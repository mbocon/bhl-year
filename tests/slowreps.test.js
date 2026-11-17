import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targets, repSpeed } from '../js/engine.js';

const E = (day, reps, extra = {}) => ({ day, block: { reps, ...extra } });
const ctx = (entries, n = 999) => ({ history: { logsFor: () => entries }, settings: {}, info: { n } });
const HOLD = { type: 'slowReps', target: 25, hold: true };   // weeks 1-8: reps are still rising
const FULL = { type: 'slowReps', target: 35 };               // week 9 on
const block = rule => ({ slotKey: 'x', rule });
const FIRST = 'First time: pick a version you can do for sets of 5 or more';

test('reps come first: speed holds at 3 seconds while the target is still rising', () => {
  assert.equal(repSpeed([], HOLD).speed, 3);
  const r = repSpeed([E(1, 25), E(4, 26)], HOLD);
  assert.deepEqual([r.speed, r.lastHit, r.harder], [3, true, false]);
  assert.deepEqual(targets(block(HOLD), ctx([E(1, 25)])), { text: '25 reps · 3 s down, 3 s up', sub: 'Last time: 25' });
});
test('at the full target, a met session slows the next one to 4 seconds', () => {
  assert.equal(repSpeed([], FULL).speed, 3);
  assert.equal(repSpeed([E(57, 34)], FULL).speed, 3);
  assert.equal(repSpeed([E(57, 35)], FULL).speed, 4);
  assert.equal(repSpeed([E(57, 20), E(60, 36)], FULL).speed, 4);
});
test('sessions from the smaller early targets do not slow the reps', () => {
  assert.equal(repSpeed([E(1, 25, { target: 25 }), E(30, 30, { target: 30 })], FULL).speed, 3);
  assert.equal(repSpeed([E(1, 25, { target: 25 })], FULL).lastHit, false);
});
test('met at 4 seconds: make the move harder and go back to 3, round and round', () => {
  const twice = repSpeed([E(57, 35), E(62, 35)], FULL);
  assert.deepEqual([twice.speed, twice.lastHit, twice.harder], [3, true, true]);
  const missed = repSpeed([E(57, 35), E(62, 35), E(64, 28)], FULL);       // the harder version
  assert.deepEqual([missed.speed, missed.lastHit, missed.harder], [3, false, false]);
  assert.equal(repSpeed([E(57, 35), E(62, 35), E(64, 28), E(71, 35)], FULL).speed, 4);
  assert.equal(repSpeed([E(57, 35), E(62, 35), E(64, 35)], FULL).speed, 4);   // kept the same version and met it again
  assert.equal(repSpeed([E(57, 35), E(62, 35), E(64, 35), E(71, 35)], FULL).harder, true);
});
test('repSpeed reports the last usable log', () => {
  assert.deepEqual(repSpeed([], FULL), { speed: 3, last: null, lastHit: false, harder: false });
  const r = repSpeed([E(57, 35), E(62, 12)], FULL);
  assert.equal(r.last.block.reps, 12); assert.equal(r.lastHit, false); assert.equal(r.speed, 3);
});
test('blank or zero reps are ignored, even when the block was ticked done', () => {
  const t = targets(block(FULL), ctx([{ day: 57, block: { done: true } }, E(62, 0)]));
  assert.deepEqual(t, { text: '35 reps · 3 s down, 3 s up', sub: FIRST });
  assert.equal(repSpeed([E(57, 35), { day: 60, block: { done: true } }], FULL).speed, 4);   // a blank log does not break the run
});
test('wording at each step', () => {
  const legs = block({ type: 'slowReps', target: 35, perLeg: true });
  assert.deepEqual(targets(legs, ctx([])), { text: '35 reps per leg · 3 s down, 3 s up', sub: FIRST });
  assert.deepEqual(targets(legs, ctx([E(57, 18)])), { text: '35 reps per leg · 3 s down, 3 s up', sub: 'Last time: 18 per leg' });
  assert.deepEqual(targets(legs, ctx([E(57, 35)])), { text: '35 reps per leg · 4 s down, 4 s up', sub: 'Target met last time, so each rep is a second slower' });
  assert.deepEqual(targets(legs, ctx([E(57, 35), E(64, 35)])), { text: '35 reps per leg · 3 s down, 3 s up', sub: 'Target met at 4-second reps: make the move harder and go back to 3 seconds' });
  const held = block({ type: 'slowReps', target: 25, perLeg: true, hold: true });
  assert.deepEqual(targets(held, ctx([])), { text: '25 reps per leg · 3 s down, 3 s up', sub: FIRST });
  for (const t of [targets(legs, ctx([E(57, 35)])), targets(held, ctx([E(1, 30)]))]) assert.doesNotMatch(t.text + t.sub, /undefined|NaN/);
});
test('looking back at an earlier day shows the speed that applied then', () => {
  const entries = [E(57, 35), E(62, 35)];
  assert.match(targets(block(FULL), ctx(entries, 57)).text, /3 s down/);
  assert.match(targets(block(FULL), ctx(entries, 62)).text, /4 s down/);
  assert.match(targets(block(FULL), ctx(entries, 64)).text, /3 s down/);
  assert.match(targets(block(FULL), ctx(entries, 64)).sub, /make the move harder/);
});
