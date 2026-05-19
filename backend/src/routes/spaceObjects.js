const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET / with pagination and search/filter
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const object_type = req.query.object_type;
    const status = req.query.status;

    let where = [];
    let params = [];
    if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR norad_id ILIKE $${params.length})`); }
    if (object_type) { params.push(object_type); where.push(`object_type = $${params.length}`); }
    if (status) { params.push(status); where.push(`status = $${params.length}`); }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM space_objects ${whereStr}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit); params.push(offset);
    const result = await pool.query(
      `SELECT * FROM space_objects ${whereStr} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM space_objects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space object not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/',
  auth,
  [body('name').notEmpty().withMessage('name is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status, tle_line1, tle_line2 } = req.body;
      const result = await pool.query(
        `INSERT INTO space_objects (name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status, tle_line1, tle_line2, tle_updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status || 'Active',
         tle_line1 || null, tle_line2 || null, (tle_line1 && tle_line2) ? new Date() : null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status, tle_line1, tle_line2 } = req.body;
    const result = await pool.query(
      `UPDATE space_objects SET name=$1, norad_id=$2, object_type=$3, orbit_type=$4, inclination=$5, apogee=$6, perigee=$7, period=$8, launch_date=$9, country=$10, rcs=$11, status=$12,
       tle_line1=$13, tle_line2=$14, tle_updated_at=$15
       WHERE id=$16 RETURNING *`,
      [name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status,
       tle_line1 || null, tle_line2 || null, (tle_line1 && tle_line2) ? new Date() : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space object not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM space_objects WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space object not found' });
    res.json({ message: 'Space object deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/space-objects/sync-tle - Fetch TLE data from Celestrak
router.get('/sync-tle', auth, async (req, res) => {
  try {
    // Fetch active debris catalog from Celestrak
    const response = await fetch('https://celestrak.org/SOCRATES/query.php?NAME=ALL&MAXDAYS=7&MAX=100&SORT=MAXPROB&FORMAT=json', {
      headers: { 'User-Agent': 'AISpaceDebrisTracker/1.0' }
    });

    if (!response.ok) {
      // Fallback to TLE format from Celestrak
      const tleResponse = await fetch('https://celestrak.org/pub/TLE/catalog.txt', {
        headers: { 'User-Agent': 'AISpaceDebrisTracker/1.0' }
      });

      if (!tleResponse.ok) {
        return res.json({
          success: false,
          message: 'Celestrak API unavailable. Using simulated TLE data.',
          synced: 0,
          note: 'Configure internet access to sync live TLE data from Celestrak.'
        });
      }

      const tleText = await tleResponse.text();
      const lines = tleText.split('\n').filter(l => l.trim());
      let synced = 0;

      for (let i = 0; i < lines.length - 2; i += 3) {
        const name = lines[i].trim();
        const line1 = lines[i + 1]?.trim();
        const line2 = lines[i + 2]?.trim();

        if (!line1 || !line2 || !line1.startsWith('1') || !line2.startsWith('2')) continue;

        const norad_id = line1.substring(2, 7).trim();

        try {
          await pool.query(
            `INSERT INTO space_objects (name, norad_id, tle_line1, tle_line2, tle_updated_at, status)
             VALUES ($1, $2, $3, $4, NOW(), 'Active')
             ON CONFLICT (norad_id) DO UPDATE SET
               tle_line1=$3, tle_line2=$4, tle_updated_at=NOW()`,
            [name, norad_id, line1, line2]
          );
          synced++;
        } catch (e) { /* skip invalid records */ }

        if (synced >= 100) break; // limit for safety
      }

      return res.json({ success: true, synced, source: 'Celestrak TLE Catalog', last_sync: new Date().toISOString() });
    }

    const data = await response.json();
    res.json({ success: true, data: data.slice(0, 20), source: 'Celestrak SOCRATES', last_sync: new Date().toISOString() });
  } catch (err) {
    console.error('TLE sync error:', err);
    res.status(500).json({ error: 'TLE sync failed: ' + err.message });
  }
});

module.exports = router;
