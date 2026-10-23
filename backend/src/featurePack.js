'use strict';
// Wave 45B feature pack — deterministic, offline, no provider calls.
// IMPORTANT: never reads OPENROUTER_API_KEY/OPENAI_API_KEY for execution and
// never performs network calls. A no-provider guard is applied even if a
// .env reload (e.g. via auth middleware) repopulates those keys.
function providerGuard() {
  // Deliberately ignore provider credentials: fallback must stay offline.
  return { providerCalled: false, aiGenerated: false, source: 'deterministic-fallback' };
}
function formatValue(v) {
  if (v === undefined || v === null) return '(empty)';
  if (v === '') return '(empty)';
  if (v === false) return 'false';
  if (v === 0) return '0';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '(empty)';
  return String(v);
}
function buildSections(record) {
  const r = record || {};
  return [
    { label: 'Title', value: formatValue(r.title ?? r.name ?? r.player_name ?? r.match_name) },
    { label: 'Status', value: formatValue(r.status ?? 'todo') },
    { label: 'Priority', value: formatValue(r.priority ?? 'medium') },
    { label: 'Progress (%)', value: formatValue(r.progress ?? 0) },
    { label: 'Done', value: formatValue(r.done ?? false) },
    { label: 'Notes', value: formatValue(r.notes ?? r.description ?? '') },
    { label: 'Assignee', value: formatValue(r.assignee ?? r.owner ?? '') },
  ];
}
let seq = 0;
function createTaskStore(seed) {
  const tasks = [];
  function create(input) {
    const b = input || {};
    if (!b.title || !String(b.title).trim()) return { error: 'title is required', status: 400 };
    seq += 1;
    const t = { id: `task-${seq}`, title: String(b.title).trim(), description: b.description ?? '', status: b.status || 'todo', priority: b.priority || 'medium', assignee: b.assignee ?? '', dueDate: b.dueDate ?? null, progress: Number(b.progress) || 0, done: b.done === true, notes: b.notes ?? '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    tasks.push(t); return { task: t };
  }
  function update(id, patch) {
    const t = tasks.find((x) => x.id === id); if (!t) return { error: 'task not found', status: 404 };
    const p = patch || {};
    for (const k of ['title','description','status','priority','assignee','dueDate','notes']) if (k in p) t[k] = p[k];
    if ('progress' in p) t.progress = Number(p.progress) || 0;
    if ('done' in p) t.done = p.done === true;
    t.updatedAt = new Date().toISOString(); return { task: t };
  }
  (seed || []).forEach((s) => create(s));
  return { create, update, list: () => tasks.slice(), get: (id) => tasks.find((x) => x.id === id) || null };
}
function filterTasks(tasks, q) {
  const opts = q || {}; const needle = String(opts.q || opts.search || '').toLowerCase();
  return (tasks || []).filter((t) => {
    if (needle && !`${t.title} ${t.description} ${t.assignee} ${t.status} ${t.priority}`.toLowerCase().includes(needle)) return false;
    if (opts.status && t.status !== opts.status) return false;
    if (opts.priority && t.priority !== opts.priority) return false;
    return true;
  });
}
const FIELDS = ['id','title','description','status','priority','assignee','dueDate','progress','done','notes','createdAt','updatedAt'];
function esc(v) { if (v === undefined || v === null) return ''; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function toCSV(rows, fields) { const f = fields || FIELDS; return [f.join(','), ...(rows || []).map((r) => f.map((c) => esc(r[c])).join(','))].join('\n'); }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function fallback(feature, label, records, compute) {
  const rows = Array.isArray(records) ? records : [];
  const m = compute(rows);
  return { feature, label, ...providerGuard(), sourceLabel: 'Deterministic fallback (offline) — not AI-generated', recordCount: rows.length, ...m, sections: [{ label: 'Records analysed', value: formatValue(rows.length) }, { label: 'AI generated', value: 'false' }, { label: 'Summary', value: formatValue(m.summary) }] };
}

const ai = {
  collisionRisk(records) { return fallback('collision-risk', 'Collision risk rank', records, (rows) => { const scored = rows.map((r) => ({ name: r.name || r.primary_object || r.id, score: Math.round((num(r.probability) * 100) + Math.max(0, 10 - num(r.miss_distance))) })).sort((a, b) => b.score - a.score); const top = scored[0]; return { summary: top ? `Highest deterministic risk: ${top.name} (score ${top.score}).` : 'No records to rank.', metrics: { total: rows.length, topScore: top ? top.score : 0 }, ranked: scored }; }); },
  decayWatch(records) { return fallback('decay-watch', 'Orbital decay watch', records, (rows) => { const low = rows.filter((r) => num(r.perigee) > 0 && num(r.perigee) < 300); return { summary: low.length ? `${low.length} object(s) with perigee below 300 km.` : `No low-perigee objects in ${rows.length} record(s).`, metrics: { total: rows.length, lowPerigee: low.length } }; }); },
  removalPriority(records) { return fallback('removal-priority', 'Removal priority', records, (rows) => { const cand = rows.filter((r) => /debris|rocket|inactive|dead/i.test(String(r.object_type || r.status || r.name || ''))); return { summary: cand.length ? `${cand.length} removal candidate(s) by type/status.` : 'No removal candidates matched.', metrics: { total: rows.length, candidates: cand.length } }; }); },
};
const AI_EXPORTS = { ai };
module.exports = { providerGuard, formatValue, buildSections, createTaskStore, filterTasks, toCSV, FIELDS, ...AI_EXPORTS };
