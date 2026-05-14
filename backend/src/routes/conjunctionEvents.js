const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET / with pagination and risk filter
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const high_risk = req.query.high_risk === 'true';

    let where = [];
    let params = [];
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (high_risk) { params.push(10); where.push(`miss_distance < $${params.length}`); }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM conjunction_events ${whereStr}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit); params.push(offset);
    const result = await pool.query(
      `SELECT * FROM conjunction_events ${whereStr} ORDER BY tca DESC NULLS LAST LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conjunction_events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conjunction event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/',
  auth,
  [
    body('primary_object').notEmpty().withMessage('primary_object is required'),
    body('secondary_object').notEmpty().withMessage('secondary_object is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status, action_taken } = req.body;
      const result = await pool.query(
        `INSERT INTO conjunction_events (primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status, action_taken)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status || 'Active', action_taken]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.put('/:id', auth, async (req, res) => {
  try {
    const { primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status, action_taken } = req.body;
    const result = await pool.query(
      `UPDATE conjunction_events SET primary_object=$1, secondary_object=$2, tca=$3, miss_distance=$4, probability=$5, relative_velocity=$6, status=$7, action_taken=$8 WHERE id=$9 RETURNING *`,
      [primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status, action_taken, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conjunction event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM conjunction_events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conjunction event not found' });
    res.json({ message: 'Conjunction event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conjunction-events/screen - Conjunction screening for active satellite pairs
router.post('/screen', auth, async (req, res) => {
  try {
    const { threshold_km = 10 } = req.body;

    // Get all active satellites
    const satellites = await pool.query(
      `SELECT id, name, altitude, inclination, orbit_type FROM satellites WHERE status = 'Active' LIMIT 50`
    );

    // Get all active space objects
    const objects = await pool.query(
      `SELECT id, name, perigee, apogee, inclination, orbit_type FROM space_objects
       WHERE status = 'Active' LIMIT 50`
    );

    const highRiskPairs = [];
    const allSats = satellites.rows;
    const allObjs = objects.rows;

    // Simplified miss distance estimation based on orbital parameters
    for (const sat of allSats) {
      for (const obj of allObjs) {
        if (!sat.altitude || !obj.perigee) continue;

        // Simplified: if altitudes and inclinations are similar, flag as potential conjunction
        const altDiff = Math.abs((parseFloat(sat.altitude) || 0) - (parseFloat(obj.perigee) || 0));
        const inclDiff = Math.abs((parseFloat(sat.inclination) || 0) - (parseFloat(obj.inclination) || 0));

        // Estimated miss distance (simplified model)
        const estimatedMissDistance = Math.sqrt(altDiff * altDiff + inclDiff * inclDiff * 100);

        if (estimatedMissDistance < threshold_km) {
          highRiskPairs.push({
            satellite: sat.name,
            space_object: obj.name,
            estimated_miss_distance_km: parseFloat(estimatedMissDistance.toFixed(2)),
            altitude_diff_km: parseFloat(altDiff.toFixed(2)),
            inclination_diff_deg: parseFloat(inclDiff.toFixed(2)),
            risk_level: estimatedMissDistance < 2 ? 'Critical' : estimatedMissDistance < 5 ? 'High' : 'Medium'
          });
        }
      }
    }

    // Auto-create conjunction_events for high-risk pairs
    let created = 0;
    for (const pair of highRiskPairs.filter(p => p.risk_level === 'Critical' || p.risk_level === 'High').slice(0, 10)) {
      try {
        await pool.query(
          `INSERT INTO conjunction_events (primary_object, secondary_object, miss_distance, probability, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [pair.satellite, pair.space_object, pair.estimated_miss_distance_km, 0.01, 'Active']
        );
        created++;
      } catch (e) { /* skip duplicates */ }
    }

    res.json({
      success: true,
      threshold_km,
      satellites_checked: allSats.length,
      objects_checked: allObjs.length,
      high_risk_pairs: highRiskPairs.length,
      conjunction_events_created: created,
      pairs: highRiskPairs.slice(0, 20)
    });
  } catch (err) {
    console.error('Conjunction screening error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conjunction-events/auto-screen - Auto-screen all active pairs
router.post('/auto-screen', auth, async (req, res) => {
  try {
    const { threshold_km = 10 } = req.body;

    // Get all active space objects with TLE data
    const activeObjects = await pool.query(
      `SELECT id, name, norad_id, perigee, apogee, inclination, tle_line1, tle_line2
       FROM space_objects WHERE status = 'Active' AND perigee IS NOT NULL LIMIT 100`
    );

    const objects = activeObjects.rows;
    let pairs = [];

    // Pairwise distance estimation from orbital parameters
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i];
        const obj2 = objects[j];

        if (!obj1.perigee || !obj2.perigee) continue;

        const altDiff = Math.abs(parseFloat(obj1.perigee) - parseFloat(obj2.perigee));
        const inclDiff = Math.abs((parseFloat(obj1.inclination) || 0) - (parseFloat(obj2.inclination) || 0));
        const estimatedDist = Math.sqrt(altDiff * altDiff + inclDiff * inclDiff * 111);

        if (estimatedDist < threshold_km) {
          pairs.push({
            obj1: obj1.name, obj2: obj2.name,
            estimated_distance: parseFloat(estimatedDist.toFixed(2)),
            risk: estimatedDist < 2 ? 'Critical' : estimatedDist < 5 ? 'High' : 'Medium'
          });
        }
      }
    }

    // Create events for critical/high risk pairs
    let created = 0;
    for (const pair of pairs.filter(p => p.risk !== 'Medium').slice(0, 20)) {
      try {
        await pool.query(
          `INSERT INTO conjunction_events (primary_object, secondary_object, miss_distance, status)
           VALUES ($1, $2, $3, 'Active')`,
          [pair.obj1, pair.obj2, pair.estimated_distance]
        );
        created++;
      } catch (e) {}
    }

    res.json({
      success: true,
      objects_analyzed: objects.length,
      pairs_below_threshold: pairs.length,
      events_created: created,
      high_risk_pairs: pairs.slice(0, 20)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
