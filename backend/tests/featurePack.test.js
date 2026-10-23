'use strict';
// Offline only: unset provider keys before importing the app module.
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const test = require('node:test');
const assert = require('node:assert/strict');
const fp = require('../src/featurePack');
test('tasks create/update + search/filter preserving false/0/empty', () => {
  const s = fp.createTaskStore([]);
  const bad = s.create({}); assert.equal(bad.status, 400);
  const c = s.create({ title: ' Review space_objects ', progress: 0, done: false, notes: '' });
  assert.equal(c.task.progress, 0); assert.equal(c.task.done, false);
  const sec0 = fp.buildSections({ ...c.task }); assert.equal(sec0.find((x)=>x.label==='Progress (%)').value, '0'); assert.equal(sec0.find((x)=>x.label==='Done').value, 'false'); assert.equal(sec0.find((x)=>x.label==='Notes').value, '(empty)');
  const u = s.update(c.task.id, { status: 'done', progress: 100 });
  assert.equal(u.task.status, 'done');
  assert.equal(fp.filterTasks(s.list(), { q: 'review' }).length, 1);
  assert.equal(fp.filterTasks(s.list(), { status: 'todo' }).length, 0);
});
test('CSV/JSON export shapes', () => {
  const rows = [{ id:'task-1', title:'A,B', status:'todo', priority:'high', progress:0, done:false, notes:'' }];
  const csv = fp.toCSV(rows); assert.ok(csv.split('\n')[0].includes('title')); assert.ok(csv.includes('"A,B"')); assert.ok(csv.includes(',0,false,'));
  assert.equal(JSON.parse(JSON.stringify(rows))[0].done, false);
});
test('domain AI deterministic fallback offline (aiGenerated:false)', () => {
  process.env.OPENROUTER_API_KEY = 'must-not-be-used';
  try {
    for (const fn of ["collisionRisk", "decayWatch", "removalPriority"].map((k)=>fp.ai[k])) { const out = fn([{ title:'x', status:'Open', effectiveness:'Ineffective', severity:'High', perigee:200, probability:0.5, miss_distance:2, contract_value:100, guaranteed_money:90, asking_price:100, current_offer:80, confidence_score:80, injury_status:'Out' }]); assert.equal(out.aiGenerated, false); assert.equal(out.providerCalled, false); assert.ok(out.sections.length >= 3); }
  } finally { delete process.env.OPENROUTER_API_KEY; }
});
test('no-provider guard ignores reloaded keys', () => { assert.deepEqual(fp.providerGuard(), { providerCalled:false, aiGenerated:false, source:'deterministic-fallback' }); });
