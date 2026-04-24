const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM space_objects ORDER BY created_at DESC');
    res.json(result.rows);
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

router.post('/', auth, async (req, res) => {
  try {
    const { name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status } = req.body;
    const result = await pool.query(
      `INSERT INTO space_objects (name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status } = req.body;
    const result = await pool.query(
      `UPDATE space_objects SET name=$1, norad_id=$2, object_type=$3, orbit_type=$4, inclination=$5, apogee=$6, perigee=$7, period=$8, launch_date=$9, country=$10, rcs=$11, status=$12 WHERE id=$13 RETURNING *`,
      [name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status, req.params.id]
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

module.exports = router;
