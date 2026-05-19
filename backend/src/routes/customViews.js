const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../database');

// Best-effort init for digest_subscriptions table (idempotent).
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS digest_subscriptions (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        min_severity VARCHAR(50) NOT NULL DEFAULT 'medium',
        frequency VARCHAR(50) NOT NULL DEFAULT 'daily',
        next_run TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (e) {
    console.error('digest_subscriptions init error:', e.message);
  }
})();

// In-memory store of synthesized TLE rows (best-effort persistence per process)
const tleImportLog = [];

// Custom Views: bespoke read-only endpoints for the orbital tracking dashboard
// 1) GET /orbital-trajectories - synthesizes debris orbit paths across LEO/MEO/GEO bands
// 2) GET /conjunctions-timeline - synthesizes upcoming conjunctions by TCA + miss distance

const ALT_BANDS = {
  LEO: { min: 200, max: 2000, color: '#22d3ee' },
  MEO: { min: 2000, max: 35786, color: '#a78bfa' },
  GEO: { min: 35786, max: 36000, color: '#f97316' },
};

function band(altKm) {
  if (altKm < 2000) return 'LEO';
  if (altKm < 35786) return 'MEO';
  return 'GEO';
}

function seededRand(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// GET /orbital-trajectories
router.get('/orbital-trajectories', auth, (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count, 10) || 24, 60);
    const rand = seededRand(42);
    const objects = [];
    const names = ['COSMOS-FRAG', 'IRIDIUM-DBR', 'FENGYUN-DBR', 'ARIANE-UPSTAGE', 'STARLINK-OBS', 'GALILEO-FRG', 'GOES-DEAD', 'INTELSAT-RIP'];
    for (let i = 0; i < count; i++) {
      const bandPick = i % 3 === 0 ? 'GEO' : i % 3 === 1 ? 'MEO' : 'LEO';
      const bandSpec = ALT_BANDS[bandPick];
      const altitude_km = Math.round(bandSpec.min + rand() * (bandSpec.max - bandSpec.min));
      const inclination_deg = Math.round(rand() * 98 * 100) / 100;
      const eccentricity = Math.round(rand() * 0.2 * 1000) / 1000;
      const raan_deg = Math.round(rand() * 360 * 100) / 100;
      // Sample 36 points along the orbit
      const samples = 36;
      const path = [];
      for (let k = 0; k < samples; k++) {
        const theta = (k / samples) * Math.PI * 2;
        // SVG-projection-friendly normalized polar coords (r-units = altitude band)
        path.push({
          theta_rad: Math.round(theta * 1000) / 1000,
          r_alt_km: altitude_km,
          inclination_offset_deg: Math.round(Math.sin(theta + i) * inclination_deg * 100) / 100,
        });
      }
      objects.push({
        id: `dbr-${1000 + i}`,
        name: `${names[i % names.length]}-${i}`,
        norad_id: 25000 + i,
        band: bandPick,
        altitude_km,
        inclination_deg,
        eccentricity,
        raan_deg,
        period_min: Math.round(2 * Math.PI * Math.sqrt(Math.pow(6371 + altitude_km, 3) / 398600.4418) / 60 * 10) / 10,
        risk_score: Math.round(rand() * 100) / 100,
        color: bandSpec.color,
        path,
      });
    }
    res.json({
      success: true,
      generated_at: new Date().toISOString(),
      earth_radius_km: 6371,
      bands: ALT_BANDS,
      objects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /conjunctions-timeline
router.get('/conjunctions-timeline', auth, (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count, 10) || 30, 80);
    const rand = seededRand(7);
    const now = Date.now();
    const sats = ['ISS', 'Hubble', 'Starlink-1042', 'OneWeb-0177', 'GPS-IIF-12', 'Sentinel-2A', 'Cosmos-1408-FRG'];
    const conjunctions = [];
    for (let i = 0; i < count; i++) {
      const hoursAhead = Math.round((1 + rand() * 168) * 10) / 10; // 1h..7d
      const missDistanceKm = Math.round((0.05 + rand() * 25) * 1000) / 1000; // 50m .. 25km
      const relVel = Math.round((6 + rand() * 9) * 100) / 100; // 6..15 km/s
      const primary = sats[Math.floor(rand() * sats.length)];
      const secondary = sats[Math.floor(rand() * sats.length)];
      const altKm = Math.round(400 + rand() * 1400);
      const pc = Math.exp(-Math.pow(missDistanceKm, 2) / 8);
      conjunctions.push({
        id: `cdm-${i + 1}`,
        primary_object: primary,
        secondary_object: secondary === primary ? `${secondary}-B` : secondary,
        tca: new Date(now + hoursAhead * 3600 * 1000).toISOString(),
        hours_to_tca: hoursAhead,
        miss_distance_km: missDistanceKm,
        relative_velocity_kms: relVel,
        altitude_km: altKm,
        band: band(altKm),
        probability_of_collision: Math.round(pc * 1e6) / 1e6,
        severity:
          missDistanceKm < 1 ? 'critical' :
          missDistanceKm < 5 ? 'high' :
          missDistanceKm < 12 ? 'medium' : 'low',
      });
    }
    res.json({
      success: true,
      generated_at: new Date().toISOString(),
      horizon_hours: 168,
      conjunctions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TLE IMPORT ---
// POST /import-tle  body: { tle: "<paste of multiple 2-line element sets, optional name lines>" }
// Parses lines using regex (catalog#, epoch, inclination, RAAN), returns synthesized rows.
function parseTleBlock(raw) {
  const lines = String(raw || '')
    .split(/\r?\n/)
    .map(l => l.replace(/\s+$/g, ''))
    .filter(l => l.length > 0);
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!/^1\s/.test(l)) continue;
    const l2 = lines[i + 1] || '';
    if (!/^2\s/.test(l2)) continue;
    // Optional name line preceding "1 ..."
    let name = null;
    const prev = lines[i - 1];
    if (prev && !/^[12]\s/.test(prev)) {
      name = prev.trim();
    }
    // Line 1: regex pull of catalog number + epoch (col 19-32)
    const l1m = l.match(/^1\s+(\d{1,5})[A-Z]?\s+(\S+)\s+(\d{2}\d{3}\.\d+)/);
    // Line 2: catalog number, inclination (col 9-16), RAAN (col 18-25)
    const l2m = l2.match(/^2\s+(\d{1,5})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (!l1m || !l2m) continue;
    const catalog = l1m[1];
    const epoch = l1m[3];
    const inclination = parseFloat(l2m[2]);
    const raan = parseFloat(l2m[3]);
    const eccentricity = parseFloat('0.' + l2m[4]);
    const argPerigee = parseFloat(l2m[5]);
    const meanAnomaly = parseFloat(l2m[6]);
    const meanMotion = parseFloat(l2m[7]);
    // Synthesized altitude from mean motion (rev/day) via Kepler approx
    const T_min = meanMotion > 0 ? (1440 / meanMotion) : 0;
    const mu = 398600.4418;
    const T_sec = T_min * 60;
    const a = T_sec > 0 ? Math.pow(mu * Math.pow(T_sec / (2 * Math.PI), 2), 1 / 3) : 0;
    const altitude_km = a > 0 ? Math.round(a - 6371) : 0;
    rows.push({
      name: name || `OBJ-${catalog}`,
      catalog_number: catalog,
      epoch,
      inclination_deg: inclination,
      raan_deg: raan,
      eccentricity,
      arg_perigee_deg: argPerigee,
      mean_anomaly_deg: meanAnomaly,
      mean_motion_rev_per_day: meanMotion,
      period_min: Math.round(T_min * 100) / 100,
      altitude_km,
      tle_line1: l,
      tle_line2: l2,
    });
    i++; // skip line 2 next loop
  }
  return rows;
}

router.post('/import-tle', auth, (req, res) => {
  try {
    const raw = req.body && (req.body.tle || req.body.text || req.body.body);
    if (!raw || typeof raw !== 'string') {
      return res.status(400).json({ error: 'Missing "tle" string in body' });
    }
    const parsed = parseTleBlock(raw);
    const imported_at = new Date().toISOString();
    parsed.forEach(p => tleImportLog.push({ ...p, imported_at }));
    res.json({
      success: true,
      imported: parsed.length,
      parsed,
      imported_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/import-tle/log', auth, (req, res) => {
  res.json({ success: true, count: tleImportLog.length, rows: tleImportLog.slice(-100) });
});

// --- CONJUNCTION ALERT EMAIL DIGEST (stub) ---
function computeNextRun(frequency) {
  const d = new Date();
  if (frequency === 'hourly') d.setHours(d.getHours() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1); // daily
  return d;
}

router.post('/digest-subscribe', auth, async (req, res) => {
  try {
    const { email, min_severity, frequency } = req.body || {};
    if (!email || !/^.+@.+\..+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    const sev = ['low', 'medium', 'high', 'critical'].includes(min_severity) ? min_severity : 'medium';
    const freq = ['hourly', 'daily', 'weekly'].includes(frequency) ? frequency : 'daily';
    const next_run = computeNextRun(freq);
    const result = await pool.query(
      `INSERT INTO digest_subscriptions (email, min_severity, frequency, next_run)
       VALUES ($1, $2, $3, $4) RETURNING id, next_run, created_at`,
      [email, sev, freq, next_run]
    );
    res.json({
      success: true,
      subscription_id: result.rows[0].id,
      email,
      min_severity: sev,
      frequency: freq,
      next_run: result.rows[0].next_run,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/digest-subscriptions', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, email, min_severity, frequency, next_run, created_at FROM digest_subscriptions ORDER BY id DESC LIMIT 50'
    );
    res.json({ success: true, subscriptions: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/digest-preview', auth, (req, res) => {
  try {
    const rand = seededRand(99);
    const sats = ['ISS', 'Hubble', 'Starlink-1042', 'OneWeb-0177', 'GPS-IIF-12', 'Sentinel-2A', 'Cosmos-1408-FRG'];
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const miss = Math.round((0.05 + rand() * 14) * 1000) / 1000;
      const sev = miss < 1 ? 'critical' : miss < 5 ? 'high' : miss < 12 ? 'medium' : 'low';
      rows.push({
        primary: sats[Math.floor(rand() * sats.length)],
        secondary: sats[Math.floor(rand() * sats.length)],
        miss_km: miss,
        severity: sev,
        tca: new Date(Date.now() + (i + 1) * 3600 * 1000).toISOString(),
      });
    }
    const generated_at = new Date().toISOString();
    const text =
      `AI Space Debris Tracker — Conjunction Digest\nGenerated: ${generated_at}\n\n` +
      rows.map(r =>
        `[${r.severity.toUpperCase()}] ${r.primary} vs ${r.secondary} — miss ${r.miss_km} km @ ${r.tca}`
      ).join('\n');
    const html =
      `<h2 style="color:#0f172a">Conjunction Digest</h2>` +
      `<p style="color:#475569">Generated: ${generated_at}</p>` +
      `<table style="border-collapse:collapse;font-family:sans-serif">` +
      `<thead><tr style="background:#e2e8f0"><th style="padding:6px 10px">Severity</th><th style="padding:6px 10px">Primary</th><th style="padding:6px 10px">Secondary</th><th style="padding:6px 10px">Miss (km)</th><th style="padding:6px 10px">TCA</th></tr></thead><tbody>` +
      rows.map(r =>
        `<tr><td style="padding:6px 10px">${r.severity}</td><td style="padding:6px 10px">${r.primary}</td><td style="padding:6px 10px">${r.secondary}</td><td style="padding:6px 10px">${r.miss_km}</td><td style="padding:6px 10px">${r.tca}</td></tr>`
      ).join('') +
      `</tbody></table>`;
    res.json({
      success: true,
      generated_at,
      sample_size: rows.length,
      text,
      html,
      rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /info
router.get('/info', auth, (req, res) => {
  res.json({
    feature: 'custom-views',
    project: 'AISpaceDebrisTracker',
    endpoints: [
      '/orbital-trajectories',
      '/conjunctions-timeline',
      '/import-tle',
      '/import-tle/log',
      '/digest-subscribe',
      '/digest-subscriptions',
      '/digest-preview',
    ],
  });
});

module.exports = router;
