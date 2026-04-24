const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM launch_windows ORDER BY window_start DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM launch_windows WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Launch window not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { mission_name, launch_site, target_orbit, window_start, window_end, vehicle, payload_mass, weather_status, debris_clearance, status } = req.body;
    const result = await pool.query(
      `INSERT INTO launch_windows (mission_name, launch_site, target_orbit, window_start, window_end, vehicle, payload_mass, weather_status, debris_clearance, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [mission_name, launch_site, target_orbit, window_start, window_end, vehicle, payload_mass, weather_status, debris_clearance, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { mission_name, launch_site, target_orbit, window_start, window_end, vehicle, payload_mass, weather_status, debris_clearance, status } = req.body;
    const result = await pool.query(
      `UPDATE launch_windows SET mission_name=$1, launch_site=$2, target_orbit=$3, window_start=$4, window_end=$5, vehicle=$6, payload_mass=$7, weather_status=$8, debris_clearance=$9, status=$10 WHERE id=$11 RETURNING *`,
      [mission_name, launch_site, target_orbit, window_start, window_end, vehicle, payload_mass, weather_status, debris_clearance, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Launch window not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM launch_windows WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Launch window not found' });
    res.json({ message: 'Launch window deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
