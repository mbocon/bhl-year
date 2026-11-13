import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';
import { PATHS, pathOf, lastDayOf, maxTypedDay } from '../js/paths.js';

function mem() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) };
}

test('the two programs are BHL Year and Bodyweight', () => {
  assert.deepEqual(PATHS.map(p => [p.id, p.name]), [['bhl', 'BHL Year'], ['bodyweight', 'Bodyweight']]);
});
test('pathOf falls back to bhl', () => {
  assert.equal(pathOf({}).id, 'bhl');
  assert.equal(pathOf({ path: 'nope' }).id, 'bhl');
  assert.equal(lastDayOf({ path: 'bodyweight' }), Infinity);
  assert.equal(lastDayOf({ path: 'bhl' }), 365);
});
test('a fresh store is on bhl with a tagged run', () => {
  const s = createStore(mem());
  assert.equal(s.settings().path, 'bhl');
  assert.equal(s.state.runs[0].path, 'bhl');
  assert.deepEqual(s.state.paths, {});
});
test('switching paths keeps a separate day and log, and switching back resumes', () => {
  const s = createStore(mem());
  s.setCurrentDay(9); const bhlRun = s.settings().currentRun;
  s.logBlock(9, 'A', { slotKey: 'd2.A.deadlift', done: true });
  assert.equal(s.switchPath('bodyweight'), true);
  assert.equal(s.settings().currentDay, 1);
  assert.notEqual(s.settings().currentRun, bhlRun);
  assert.equal(s.getLog(9), undefined);
  s.completeDay(1);
  assert.equal(s.switchPath('bhl'), true);
  assert.equal(s.settings().currentDay, 9);
  assert.equal(s.settings().currentRun, bhlRun);
  assert.equal(s.getLog(9).blocks.A.done, true);
  s.switchPath('bodyweight');
  assert.equal(s.settings().currentDay, 2);
});
test('a switch survives a reload', () => {
  const st = mem(); const s = createStore(st);
  s.setCurrentDay(9); s.switchPath('bodyweight'); s.setCurrentDay(3);
  const again = createStore(st);
  assert.equal(again.settings().path, 'bodyweight');
  assert.equal(again.settings().currentDay, 3);
  again.switchPath('bhl');
  assert.equal(again.settings().currentDay, 9);
});
test('switchPath refuses the current path and unknown ids', () => {
  const s = createStore(mem());
  assert.equal(s.switchPath('bhl'), false);
  assert.equal(s.switchPath('nope'), false);
  assert.equal(s.state.runs.length, 1);
});
test('bodyweight days run past 365; bhl stops there', () => {
  const s = createStore(mem());
  s.setCurrentDay(365); s.completeDay(365);
  assert.equal(s.settings().currentDay, 365);
  s.switchPath('bodyweight'); s.setCurrentDay(365); s.completeDay(365);
  assert.equal(s.settings().currentDay, 366);
});
test('start over on bodyweight leaves bhl progress alone', () => {
  const s = createStore(mem());
  s.setCurrentDay(40); const bhlRun = s.settings().currentRun;
  s.switchPath('bodyweight'); s.setCurrentDay(20);
  const id = s.startRun();
  assert.equal(s.state.runs.find(r => r.id === id).path, 'bodyweight');
  assert.equal(s.settings().currentDay, 1);
  s.switchPath('bhl');
  assert.equal(s.settings().currentDay, 40);
  assert.equal(s.settings().currentRun, bhlRun);
});
test('an old backup restores onto bhl even from the bodyweight path', () => {
  const old = createStore(mem()); old.setCurrentDay(12);
  const backup = JSON.parse(old.exportJSON());
  delete backup.settings.path; delete backup.paths; for (const r of backup.runs) delete r.path;
  const s = createStore(mem()); s.switchPath('bodyweight');
  assert.deepEqual(s.importJSON(JSON.stringify(backup)), { ok: true });
  assert.equal(s.settings().path, 'bhl');
  assert.equal(s.settings().currentDay, 12);
  assert.deepEqual(s.state.paths, {});
  assert.equal(s.state.runs[0].path, 'bhl');
});
test('an unknown saved path falls back to bhl on load', () => {
  const st = mem(); const a = createStore(st);
  const raw = JSON.parse(a.exportJSON()); raw.settings.path = 'future-thing';
  st.setItem('bhl-year-v1', JSON.stringify(raw));
  assert.equal(createStore(st).settings().path, 'bhl');
});

test('typed day numbers are bounded even on the open-ended program', () => {
  assert.equal(maxTypedDay({ path: 'bhl', currentDay: 3 }), 365);
  assert.equal(maxTypedDay({ path: 'bodyweight', currentDay: 1 }), 3650);
  assert.equal(maxTypedDay({ path: 'bodyweight', currentDay: 5000 }), 5365);
});
