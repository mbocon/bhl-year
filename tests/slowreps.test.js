import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targets, repSpeed } from '../js/engine.js';

const E = (day, reps, extra = {}) => ({ day, block: { reps, ...extra } });
const ctx = (entries, n = 99) => ({ history: { logsFor: () => entries }, settings: {}, info: { n } });

test('speed starts at 3, rises one second per met target, and stops at 5', () => {
  const rule = { type: 'slowReps', mode: 'fixed', target: 25 };
  assert.equal(repSpeed([], rule).speed, 3);
  assert.equal(repSpeed([E(1, 24)], rule).speed, 3);
  assert.equal(repSpeed([E(1, 25)], rule).speed, 4);
  assert.equal(repSpeed([E(1, 25), E(3, 20), E(5, 26)], rule).speed, 5);
  const capped = repSpeed([E(1, 25), E(3, 25), E(5, 25)], rule);
  assert.equal(capped.speed, 5); assert.equal(capped.lastHit, true); assert.equal(capped.bumped, false);
});
test('repSpeed reports the last usable log and whether it met the target', () => {
  const rule = { type: 'slowReps', mode: 'fixed', target: 25 };
  assert.deepEqual(repSpeed([], rule), { speed: 3, last: null, lastHit: false, bumped: false });
  const r = repSpeed([E(1, 25), E(3, 12)], rule);
  assert.equal(r.last.block.reps, 12); assert.equal(r.lastHit, false); assert.equal(r.bumped, false); assert.equal(r.speed, 4);
});
test("the target saved with a log wins over today's target", () => {
  const rule = { type: 'slowReps', mode: 'fixed', target: 35 };
  assert.equal(repSpeed([E(1, 25, { target: 25 })], rule).speed, 4);
  assert.equal(repSpeed([E(1, 25)], rule).speed, 3);
});
test('a capped move needs the minutes too, unless none were logged', () => {
  const rule = { type: 'slowReps', mode: 'build', target: 100, capMinutes: 45 };
  assert.equal(repSpeed([E(85, 100, { duration: 50 })], rule).speed, 3);
  assert.equal(repSpeed([E(85, 100, { duration: 45 })], rule).speed, 4);
  assert.equal(repSpeed([E(85, 100)], rule).speed, 4);
});
test('blank or zero reps are ignored, even when the block was ticked done', () => {
  const rule = { type: 'slowReps', mode: 'build', target: 100, capMinutes: 45 };
  const t = targets({ slotKey: 'x', rule }, ctx([{ day: 85, block: { done: true } }, E(92, 0)]));
  assert.equal(t.text, 'Count every rep · 3 s down, 3 s up');
  assert.doesNotMatch(t.text + t.sub, /undefined|NaN/);
});
test('fixed mode wording', () => {
  const block = { slotKey: 'x', rule: { type: 'slowReps', mode: 'fixed', target: 25, perLeg: true } };
  assert.deepEqual(targets(block, ctx([])), { text: '25 reps per leg · 3 s down, 3 s up', sub: 'First time: pick a version you can do for sets of 5 or more' });
  assert.deepEqual(targets(block, ctx([E(1, 18)])), { text: '25 reps per leg · 3 s down, 3 s up', sub: 'Last time: 18 per leg' });
  assert.deepEqual(targets(block, ctx([E(1, 25)])), { text: '25 reps per leg · 4 s down, 4 s up', sub: 'Target met last time, so each rep is a second slower' });
  assert.equal(targets(block, ctx([E(1, 25), E(3, 25), E(5, 25)])).sub, 'Target met at 5-second reps: make the move harder');
});
test('build mode wording', () => {
  const block = { slotKey: 'x', rule: { type: 'slowReps', mode: 'build', target: 100, capMinutes: 45 } };
  assert.deepEqual(targets(block, ctx([])), { text: 'Count every rep · 3 s down, 3 s up', sub: "100 is the goal, not today's number" });
  assert.deepEqual(targets(block, ctx([E(85, 42, { duration: 30 })])), { text: 'Beat 42 · 3 s down, 3 s up', sub: 'Goal: 100 inside 45 minutes' });
  assert.equal(targets(block, ctx([E(85, 100, { duration: 44 })])).text, '100 reps · 4 s down, 4 s up');
  const legs = { slotKey: 'y', rule: { type: 'slowReps', mode: 'build', target: 35, perLeg: true } };
  assert.deepEqual(targets(legs, ctx([E(87, 20)])), { text: 'Beat 20 per leg · 3 s down, 3 s up', sub: 'Goal: 35 per leg' });
});
test('looking back at an earlier day shows the speed that applied then', () => {
  const block = { slotKey: 'x', rule: { type: 'slowReps', mode: 'fixed', target: 25 } };
  const entries = [E(1, 25), E(3, 25)];
  assert.match(targets(block, ctx(entries, 3)).text, /4 s down/);
  assert.match(targets(block, ctx(entries, 5)).text, /5 s down/);
  assert.match(targets(block, ctx(entries, 1)).text, /3 s down/);
});

test('reps met but over the time: the ask is the time, not more reps', () => {
  const block = { slotKey: 'x', rule: { type: 'slowReps', mode: 'build', target: 100, capMinutes: 45 } };
  assert.deepEqual(targets(block, ctx([E(85, 100, { duration: 50 })])), { text: '100 reps · 3 s down, 3 s up', sub: 'Reps met in 50 minutes last time. Now get them inside 45.' });
  const calves = { slotKey: 'c', rule: { type: 'slowReps', mode: 'build', target: 100, capMinutes: 15 } };
  assert.deepEqual(targets(calves, ctx([E(85, 103, { duration: 20 })])), { text: '100 reps · 3 s down, 3 s up', sub: 'Reps met in 20 minutes last time. Now get them inside 15.' });
});
