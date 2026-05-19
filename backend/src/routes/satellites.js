const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM satellites');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM satellites ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    const data = result.rows;
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM satellites WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Satellite not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, norad_id, operator, mission_type, orbit_type, altitude, inclination, launch_date, expected_lifetime, fuel_remaining, status } = req.body;
    const result = await pool.query(
      `INSERT INTO satellites (name, norad_id, operator, mission_type, orbit_type, altitude, inclination, launch_date, expected_lifetime, fuel_remaining, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, norad_id, operator, mission_type, orbit_type, altitude, inclination, launch_date, expected_lifetime, fuel_remaining, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, norad_id, operator, mission_type, orbit_type, altitude, inclination, launch_date, expected_lifetime, fuel_remaining, status } = req.body;
    const result = await pool.query(
      `UPDATE satellites SET name=$1, norad_id=$2, operator=$3, mission_type=$4, orbit_type=$5, altitude=$6, inclination=$7, launch_date=$8, expected_lifetime=$9, fuel_remaining=$10, status=$11 WHERE id=$12 RETURNING *`,
      [name, norad_id, operator, mission_type, orbit_type, altitude, inclination, launch_date, expected_lifetime, fuel_remaining, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Satellite not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM satellites WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Satellite not found' });
    res.json({ message: 'Satellite deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
