const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM debris_removal_missions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM debris_removal_missions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mission not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { mission_name, target_object, method, estimated_cost, launch_date, duration_days, success_probability, status, agency } = req.body;
    const result = await pool.query(
      `INSERT INTO debris_removal_missions (mission_name, target_object, method, estimated_cost, launch_date, duration_days, success_probability, status, agency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [mission_name, target_object, method, estimated_cost, launch_date, duration_days, success_probability, status, agency]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { mission_name, target_object, method, estimated_cost, launch_date, duration_days, success_probability, status, agency } = req.body;
    const result = await pool.query(
      `UPDATE debris_removal_missions SET mission_name=$1, target_object=$2, method=$3, estimated_cost=$4, launch_date=$5, duration_days=$6, success_probability=$7, status=$8, agency=$9 WHERE id=$10 RETURNING *`,
      [mission_name, target_object, method, estimated_cost, launch_date, duration_days, success_probability, status, agency, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mission not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM debris_removal_missions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mission not found' });
    res.json({ message: 'Mission deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
