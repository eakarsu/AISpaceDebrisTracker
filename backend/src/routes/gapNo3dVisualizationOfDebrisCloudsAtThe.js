// // === Batch 08 Gaps & Frontend Mounts ===
// Feature: No 3D visualization of debris clouds at the backend (only frontend stubs)
// Kind: gap_non_ai  Project: AISpaceDebrisTracker
const express = require('express');
const router = express.Router();
let pool = null;
try { pool = require('../config/database'); } catch (_) { try { pool = require('../db'); } catch (_) { try { pool = require('../db.js'); } catch (_) {} } }

let _gapTableInit = false;
async function ensureGapTable() {
  if (_gapTableInit || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      feature_slug TEXT NOT NULL,
      project TEXT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gapTableInit = true;
  } catch (_) { /* lazy: ignore errors */ }
}

async function callOpenRouter(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const base = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!apiKey) {
    return { ai_disabled: true, note: 'OPENROUTER_API_KEY missing. Returning stub output.', echo: userPrompt.slice(0, 240) };
  }
  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.6,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`OpenRouter ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  let raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  raw = raw.trim().replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  try { return JSON.parse(raw); } catch { return { raw }; }
}

function buildDebrisCloudScene(input) {
  const objects = Array.isArray(input.objects)
    ? input.objects
    : Array.isArray(input.debris)
      ? input.debris
      : [
        { id: 'DEB-001', altitude_km: 735, inclination_deg: 98.2, size_cm: 12, risk: 'high' },
        { id: 'DEB-002', altitude_km: 742, inclination_deg: 98.4, size_cm: 6, risk: 'medium' },
        { id: 'DEB-003', altitude_km: 730, inclination_deg: 97.9, size_cm: 18, risk: 'high' },
      ];

  const points = objects.map((obj, index) => {
    const altitude = Number(obj.altitude_km || obj.altitude || 700);
    const inclination = Number(obj.inclination_deg || obj.inclination || 98);
    const raan = Number(obj.raan_deg || obj.raan || index * 37);
    const radius = 6371 + altitude;
    const theta = (raan * Math.PI) / 180;
    const phi = (inclination * Math.PI) / 180;
    return {
      id: obj.id || obj.norad_id || `debris-${index + 1}`,
      position_km: {
        x: Number((radius * Math.cos(theta) * Math.sin(phi)).toFixed(2)),
        y: Number((radius * Math.sin(theta) * Math.sin(phi)).toFixed(2)),
        z: Number((radius * Math.cos(phi)).toFixed(2)),
      },
      radius_m: Math.max(2, Number(obj.size_cm || obj.diameter_cm || 10) / 2),
      color: obj.risk === 'high' ? '#ef4444' : obj.risk === 'medium' ? '#f59e0b' : '#22c55e',
      label: obj.name || obj.id || `Debris ${index + 1}`,
      risk: obj.risk || 'unknown',
    };
  });

  return {
    summary: `Generated backend 3D scene for ${points.length} debris objects.`,
    scene: {
      units: 'km',
      earth_radius_km: 6371,
      camera: { target: [0, 0, 0], distance_km: 14000 },
      layers: [
        { id: 'earth', type: 'sphere', radius_km: 6371, color: '#1d4ed8' },
        { id: 'debris-cloud', type: 'points', points },
      ],
    },
    findings: [
      `${points.filter((p) => p.risk === 'high').length} high-risk objects should be emphasized in red.`,
      'Positions are deterministic orbital approximations for visualization, not flight dynamics propagation.',
    ],
    recommendations: [
      'Refresh the scene after each TLE or sensor-fusion update.',
      'Use the existing propagation endpoint for mission-grade trajectory review.',
    ],
  };
}

router.post('/run', async (req, res) => {
  const input = req.body || {};
  try {
    ensureGapTable();
    let out;
    if (!process.env.OPENROUTER_API_KEY) {
      out = buildDebrisCloudScene(input);
    } else {
      const sys = 'You are an assistant for the "No 3D visualization of debris clouds at the backend (only frontend stubs)" feature in project AISpaceDebrisTracker. Respond as strict JSON.';
      const user = `Feature request: No 3D visualization of debris clouds at the backend (only frontend stubs)\n\nUser input JSON:\n` + JSON.stringify(input).slice(0, 4000) + '\n\nReturn JSON with summary, findings array, recommendations array.';
      out = await callOpenRouter(sys, user);
    }
    if (pool) {
      try { await pool.query('INSERT INTO gap_features(feature_slug, project, input, output) VALUES ($1,$2,$3,$4)', ['gap-no-3d-visualization-of-debris-clouds-at-the', 'AISpaceDebrisTracker', JSON.stringify(input), JSON.stringify(out)]); } catch (_) {}
    }
    res.json({ success: true, feature: 'gap-no-3d-visualization-of-debris-clouds-at-the', kind: 'gap_non_ai', result: out });
  } catch (err) {
    res.status(500).json({ error: err.message || 'gap feature failed' });
  }
});

router.get('/history', async (req, res) => {
  if (!pool) return res.json({ history: [] });
  try {
    ensureGapTable();
    const { rows } = await pool.query('SELECT id, input, output, created_at FROM gap_features WHERE feature_slug = $1 ORDER BY created_at DESC LIMIT 50', ['gap-no-3d-visualization-of-debris-clouds-at-the']);
    res.json({ history: rows });
  } catch (_) { res.json({ history: [] }); }
});

module.exports = router;
