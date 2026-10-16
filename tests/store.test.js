import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';

function mem() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) };
}
function throwing() {
  const boom = () => { throw new Error('QuotaExceeded'); };
  return { getItem: boom, setItem: boom, removeItem: boom };
}

test('defaults and persistence', () => {
  const s = createStore(mem());
  assert.equal(s.settings().currentDay, 1);
  assert.equal(s.settings().equipment.box, true);
  assert.equal(s.settings().units, 'lb');
  assert.equal(s.persistent, true);
});
test('state round-trips through storage', () => {
  const st = mem();
  const s = createStore(st);
  s.setCurrentDay(9);
  const s2 = createStore(st);
  assert.equal(s2.settings().currentDay, 9);
});
test('throwing storage still works in memory', () => {
  const s = createStore(throwing());
  s.setCurrentDay(5);
  assert.equal(s.settings().currentDay, 5);
  assert.equal(s.persistent, false);
});
test('logBlock merges and getLog reads back', () => {
  const s = createStore(mem());
  s.logBlock(2, 'A', { slotKey: 'd2.A.deadlift', sets: [{ w: 315, r: 7 }], ruleType: 'ladder', lift: 'deadlift' });
  s.logBlock(2, 'A', { notes: 'felt good' });
  assert.deepEqual(s.getLog(2).blocks.A.sets, [{ w: 315, r: 7 }]);
  assert.equal(s.getLog(2).blocks.A.notes, 'felt good');
  assert.ok(s.getLog(2).blocks.A.loggedAt);
});
test('completeDay advances pointer only for current day and is idempotent', () => {
  const s = createStore(mem());
  s.completeDay(1);
  assert.equal(s.settings().currentDay, 2);
  const t = s.getLog(1).completedAt;
  s.completeDay(1);
  assert.equal(s.getLog(1).completedAt, t);
  assert.equal(s.settings().currentDay, 2);
  s.completeDay(10);
  assert.equal(s.settings().currentDay, 2);
});
test('startRun keeps old logs and resets pointer', () => {
  const s = createStore(mem());
  s.logBlock(3, 'B', { slotKey: 'd1.B.backsquat', sets: [{ w: 200, r: 5 }] });
  const r1 = s.settings().currentRun;
  s.setCurrentDay(40);
  s.startRun();
  assert.notEqual(s.settings().currentRun, r1);
  assert.equal(s.settings().currentDay, 1);
  assert.equal(s.getLog(3), undefined);
  assert.ok(s.state.logs[r1][3]);
  assert.equal(s.state.runs.length, 2);
  assert.ok(s.state.runs[0].endedAt);
});
test('history is scoped to run; tests cross runs with age filter', () => {
  const s = createStore(mem());
  s.setCurrentDay(5);
  s.logBlock(2, 'A', { slotKey: 'd2.A.deadlift', sets: [{ w: 315, r: 7 }] });
  assert.equal(s.history.lastLog('d2.A.deadlift').day, 2);
  s.recordTest('row2k', 448, 1);
  s.startRun();
  assert.equal(s.history.lastLog('d2.A.deadlift'), null);
  assert.equal(s.history.latestTest('row2k').value, 448);
  assert.equal(s.history.latestTest('row2k', { maxAgeDays: 0 }), null);
});
test('history excludes today and later unless asked', () => {
  const s = createStore(mem());
  s.setCurrentDay(9);
  s.logBlock(2, 'A', { slotKey: 'd2.A.deadlift', sets: [{ w: 315, r: 7 }] });
  s.logBlock(9, 'A', { slotKey: 'd2.A.deadlift', sets: [{ w: 335, r: 6 }] });
  assert.deepEqual(s.history.logsFor('d2.A.deadlift').map(e => e.day), [2]);
  assert.deepEqual(s.history.logsFor('d2.A.deadlift', undefined, { includeToday: true }).map(e => e.day), [2, 9]);
});
test('logsFor filters by optionId when given', () => {
  const s = createStore(mem());
  s.setCurrentDay(20);
  s.logBlock(1, 'C', { slotKey: 'd1.C.machine', optionId: 'rower', time: 448 });
  s.logBlock(8, 'C', { slotKey: 'd1.C.machine', optionId: 'bike', cal: 200 });
  assert.deepEqual(s.history.logsFor('d1.C.machine', 'bike').map(e => e.day), [8]);
  assert.equal(s.history.logsFor('d1.C.machine').length, 2);
});
test('liftEvidence derives kinds from ruleType and stamps week', () => {
  const s = createStore(mem());
  s.setCurrentDay(50);
  s.logBlock(36, 'B', { slotKey: 'd1.B.backsquat', sets: [{ w: 305, r: 1 }], ruleType: 'single', lift: 'backsquat' });
  s.logBlock(43, 'B', { slotKey: 'd1.B.backsquat', sets: [{ w: 225, r: 6 }, { w: 265, r: 6 }], ruleType: 'wave', lift: 'backsquat' });
  const ev = s.history.liftEvidence('backsquat');
  assert.deepEqual(ev.map(e => [e.kind, e.weight, e.reps, e.week, e.phase]), [['single', 305, 1, 6, 'A'], ['topset', 265, 6, 7, 'B']]);
});
test('choices persist', () => {
  const s = createStore(mem());
  assert.equal(s.getChoice('d1.C.machine'), undefined);
  s.setChoice('d1.C.machine', 'bike');
  assert.equal(s.getChoice('d1.C.machine'), 'bike');
});
test('export/import round-trip; corrupt import rejected', () => {
  const s = createStore(mem());
  s.logBlock(1, 'A', { slotKey: 'd1.A.plyo', done: true });
  const txt = s.exportJSON();
  assert.ok(s.settings().lastExportAt);
  const s2 = createStore(mem());
  assert.deepEqual(s2.importJSON(txt), { ok: true });
  assert.equal(s2.getLog(1).blocks.A.done, true);
  assert.equal(s2.importJSON('{"version":2}').ok, false);
  assert.equal(s2.importJSON('not json').ok, false);
  assert.equal(s2.getLog(1).blocks.A.done, true);
});
test('eraseAll', () => {
  const s = createStore(mem());
  s.logBlock(1, 'A', { slotKey: 'd1.A.plyo', done: true });
  s.eraseAll();
  assert.equal(s.getLog(1), undefined);
  assert.equal(s.state.runs.length, 1);
});
test('upsertTest replaces the same day entry instead of duplicating', () => {
  const s = createStore(mem());
  s.upsertTest('row2k', 450, 1);
  s.upsertTest('row2k', 448, 1);
  assert.equal(s.state.tests.row2k.length, 1);
  assert.equal(s.state.tests.row2k[0].value, 448);
  s.upsertTest('row2k', 440, 43);
  assert.equal(s.state.tests.row2k.length, 2);
});
