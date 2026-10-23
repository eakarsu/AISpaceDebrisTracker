'use strict';
// Wave 45B: authenticated tasks + search/filter + CSV/JSON export + offline AI.
// No provider calls; AI handlers are deterministic fallback (aiGenerated:false).
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const express = require('express');
const fp = require('../featurePack');
const auth = require('../middleware/auth');
function fpAuth(req,res,next){ return auth(req,res,next); }
const router = express.Router();
const store = fp.createTaskStore([]);
router.use(fpAuth);
router.get('/tasks', (req,res)=>{ const items = fp.filterTasks(store.list(), req.query); return res.json({ data: items, total: items.length, sections: fp.buildSections(items[0] || {}) }); });
router.post('/tasks', (req,res)=>{ const r = store.create(req.body||{}); if (r.error) return res.status(r.status).json({ error: r.error }); return res.status(201).json(r.task); });
router.patch('/tasks/:id', (req,res)=>{ const r = store.update(req.params.id, req.body||{}); if (r.error) return res.status(r.status).json({ error: r.error }); return res.json(r.task); });
router.put('/tasks/:id', (req,res)=>{ const r = store.update(req.params.id, req.body||{}); if (r.error) return res.status(r.status).json({ error: r.error }); return res.json(r.task); });
function exportHandler(req,res){ const items = fp.filterTasks(store.list(), req.query); const fmt = String(req.query.format||'json').toLowerCase(); if (fmt==='csv') { res.setHeader('Content-Type','text/csv; charset=utf-8'); res.setHeader('Content-Disposition','attachment; filename="tasks.csv"'); return res.send(fp.toCSV(items)); } return res.json({ data: items, total: items.length }); }
router.get('/tasks/export', exportHandler);
router.get('/export', exportHandler);
router.post('/ai/collision-risk', (req,res)=>{ const records = Array.isArray(req.body?.records) ? req.body.records : store.list(); return res.json(fp.ai.collisionRisk(records)); });
router.post('/ai/decay-watch', (req,res)=>{ const records = Array.isArray(req.body?.records) ? req.body.records : store.list(); return res.json(fp.ai.decayWatch(records)); });
router.post('/ai/removal-priority', (req,res)=>{ const records = Array.isArray(req.body?.records) ? req.body.records : store.list(); return res.json(fp.ai.removalPriority(records)); });
module.exports = router;
