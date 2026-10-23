import React, { useEffect, useState } from 'react';
// Wave 45B panel: labelled sections preserve false / 0 / empty explicitly.
export function formatValue(v) { if (v === undefined || v === null || v === '') return '(empty)'; if (v === false) return 'false'; if (v === 0) return '0'; return String(v); }
export default function FeaturePackPanel() {
  const [tasks, setTasks] = useState([]); const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [title, setTitle] = useState(''); const [aiOut, setAiOut] = useState(null); const [error, setError] = useState('');
  const token = localStorage.getItem('token') || localStorage.getItem('spaceport_token') || '';
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  async function load() { try { const r = await fetch(`/api/feature-pack/tasks?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`, { headers }); const d = await r.json(); setTasks(Array.isArray(d.data) ? d.data : []); } catch (e) { setError(String(e)); } }
  useEffect(() => { load(); }, []);
  async function createTask(e) { e.preventDefault(); const r = await fetch('/api/feature-pack/tasks', { method: 'POST', headers, body: JSON.stringify({ title, progress: 0, done: false, notes: '' }) }); if (r.ok) { setTitle(''); load(); } }
  async function runAi(feature) { const r = await fetch(`/api/feature-pack/ai/${feature}`, { method: 'POST', headers, body: JSON.stringify({ records: tasks }) }); setAiOut(await r.json()); }
  function download(fmt) { const a = document.createElement('a'); a.href = `/api/feature-pack/tasks/export?format=${fmt}`; a.download = `tasks.${fmt}`; a.click(); }
  return (<section aria-label="space debris tasks and insights"><h2>Tasks — space debris</h2>
    <form onSubmit={createTask}><label>New task title <input aria-label="New task title" value={title} onChange={(e)=>setTitle(e.target.value)} /></label><button type="submit">Create task</button></form>
    <label>Search <input aria-label="Search tasks" value={q} onChange={(e)=>setQ(e.target.value)} /></label>
    <label>Status filter <select aria-label="Status filter" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">All statuses</option><option value="todo">todo</option><option value="in-progress">in-progress</option><option value="done">done</option></select></label>
    <button type="button" onClick={load}>Apply search / filter</button>
    <button type="button" onClick={()=>download('csv')}>Export CSV</button><button type="button" onClick={()=>download('json')}>Export JSON</button>
    {error ? <p role="alert">{error}</p> : null}
    <h3>Task list</h3>{tasks.length === 0 ? <p>No tasks found. (empty)</p> : tasks.map((t)=>(<article key={t.id}><h4>{formatValue(t.title)}</h4><dl><dt>Status</dt><dd>{formatValue(t.status)}</dd><dt>Priority</dt><dd>{formatValue(t.priority)}</dd><dt>Progress (%)</dt><dd>{formatValue(t.progress)}</dd><dt>Done</dt><dd>{formatValue(t.done)}</dd><dt>Notes</dt><dd>{formatValue(t.notes)}</dd><dt>Assignee</dt><dd>{formatValue(t.assignee)}</dd></dl></article>))}
    <h3>Offline insights (deterministic fallback)</h3><p>AI generated: false — deterministic fallback, no provider call.</p>
    <button type="button" onClick={()=>runAi('collision-risk')}>Collision risk rank</button><button type="button" onClick={()=>runAi('decay-watch')}>Orbital decay watch</button><button type="button" onClick={()=>runAi('removal-priority')}>Removal priority</button>
    {aiOut ? <div><h4>{formatValue(aiOut.label)}</h4><dl><dt>AI generated</dt><dd>false</dd><dt>Records analysed</dt><dd>{formatValue(aiOut.recordCount)}</dd><dt>Summary</dt><dd>{formatValue(aiOut.summary)}</dd></dl></div> : <p>No insight run yet. (empty)</p>}
  </section>);
}
