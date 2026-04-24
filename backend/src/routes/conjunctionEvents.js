const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conjunction_events ORDER BY tca DESC');
    res.json(result.rows);
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

router.post('/', auth, async (req, res) => {
  try {
    const { primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status, action_taken } = req.body;
    const result = await pool.query(
      `INSERT INTO conjunction_events (primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status, action_taken)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status, action_taken]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

module.exports = router;
