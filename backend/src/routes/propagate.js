const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// POST /api/propagate - SGP4 orbital propagation
router.post('/',
  auth,
  [
    body('tle_line1').notEmpty().withMessage('tle_line1 is required'),
    body('tle_line2').notEmpty().withMessage('tle_line2 is required'),
    body('minutes_ahead').optional().isInt({ min: 1, max: 10080 }).withMessage('minutes_ahead must be 1-10080'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { norad_id, tle_line1, tle_line2, minutes_ahead = 120, step_minutes = 10 } = req.body;

      let satellite;
      try {
        satellite = require('satellite.js');
      } catch (e) {
        return res.status(500).json({ error: 'satellite.js not installed. Run: npm install satellite.js' });
      }

      const satrec = satellite.twoline2satrec(tle_line1.trim(), tle_line2.trim());

      const positions = [];
      const now = new Date();
      const steps = Math.min(Math.floor(minutes_ahead / step_minutes), 200);

      for (let i = 0; i <= steps; i++) {
        const time = new Date(now.getTime() + i * step_minutes * 60000);
        const positionAndVelocity = satellite.propagate(satrec, time);

        if (!positionAndVelocity.position || positionAndVelocity.position === false) continue;

        const gmst = satellite.gstime(time);
        const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

        positions.push({
          time: time.toISOString(),
          minutes_from_now: i * step_minutes,
          latitude: satellite.degreesLat(positionGd.latitude),
          longitude: satellite.degreesLong(positionGd.longitude),
          altitude_km: positionGd.height,
          x_km: positionAndVelocity.position.x,
          y_km: positionAndVelocity.position.y,
          z_km: positionAndVelocity.position.z,
        });
      }

      res.json({
        success: true,
        norad_id: norad_id || 'Unknown',
        start_time: now.toISOString(),
        minutes_ahead,
        step_minutes,
        positions_count: positions.length,
        positions
      });
    } catch (err) {
      console.error('Propagation error:', err);
      res.status(500).json({ error: 'Failed to propagate orbit: ' + err.message });
    }
  }
);

// GET /api/propagate/:norad_id - Propagate from stored TLE data
router.get('/:norad_id', auth, async (req, res) => {
  try {
    const { norad_id } = req.params;
    const minutes_ahead = Math.min(parseInt(req.query.minutes_ahead) || 120, 10080);

    // Try to find space object with TLE data
    const obj = await pool.query(
      'SELECT * FROM space_objects WHERE norad_id=$1', [norad_id]
    );

    if (obj.rows.length === 0) {
      return res.status(404).json({ error: 'Space object not found. Please provide TLE data.' });
    }

    const spaceObj = obj.rows[0];
    if (!spaceObj.tle_line1 || !spaceObj.tle_line2) {
      return res.status(400).json({
        error: 'No TLE data for this object. Use POST /api/propagate with tle_line1 and tle_line2.',
        object: spaceObj
      });
    }

    // Re-use propagation logic
    req.body = {
      norad_id, tle_line1: spaceObj.tle_line1, tle_line2: spaceObj.tle_line2, minutes_ahead
    };
    return router.handle(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
