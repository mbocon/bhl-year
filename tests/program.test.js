import { test } from 'node:test';
import assert from 'node:assert/strict';
import { session } from '../js/program/index.js';

const S = (n, extra = {}) => session(n, { advanced: false, equipment: { box: true, rope: true }, ...extra });

test('day 1 shape', () => {
  const s = S(1);
  assert.equal(s.title, 'Squat + Intervals');
  assert.deepEqual(s.blocks.map(b => b.key), ['A', 'B', 'C', 'D']);
  assert.equal(s.blocks[1].rule.type, 'tempoProg');
  assert.equal(s.blocks[1].lift, 'backsquat');
  assert.equal(s.blocks[2].rule.type, 'rowPace');
  assert.equal(s.blocks[2].rule.scheme.kind, 'tt');
  assert.equal(s.blocks[2].altRules.bike.rule.type, 'bikePace');
  assert.equal(s.blocks[2].altRules.bike.test, 'bike10');
  assert.equal(s.blocks[2].test, 'row2k');
  assert.deepEqual(s.blocks[2].options.map(o => o.id), ['rower', 'bike']);
  assert.ok(s.estMinutes > 60);
});
test('day 2 shape and press lift by cycle', () => {
  const s = S(2);
  assert.deepEqual(s.blocks.map(b => b.key), ['A', 'B', 'C', 'D', 'E']);
  assert.equal(s.blocks[0].rule.type, 'ladder');
  assert.deepEqual(s.blocks[0].rule.reps, [8, 7, 6]);
  assert.equal(s.blocks[1].rule.type, 'introduce');
  assert.equal(s.blocks[2].lift, 'bench');
  assert.equal(s.blocks[2].slotKey, 'd2.C.press.bench');
  assert.equal(S(93).blocks[2].lift, 'ohp');
  assert.equal(S(93).blocks[2].slotKey, 'd2.C.press.ohp');
  assert.equal(S(9).blocks[1].rule.type, 'peakRepeat');
  assert.equal(S(30).blocks.length, 5);
  assert.equal(S(2).blocks[4].rule.type, 'consistency');
  assert.equal(S(2).blocks[4].rule.rounds, 3);
});
test('day 2 mixed modal: no flush, 20-min cap, rounds ramp over the first four weeks of cycle 1', () => {
  const mm = n => S(n).blocks.find(b => b.key === 'E');
  assert.deepEqual([2, 9, 16, 23, 30].map(n => mm(n).rule.rounds), [3, 3, 4, 5, 5]);
  assert.equal(mm(93).rule.rounds, 5, 'cycle 2 week 1 starts at the full dose');
  assert.equal(mm(2).rule.capMin, 20);
  assert.match(mm(2).rx[0], /^3 rounds or 20 min, whichever comes first/);
  assert.match(mm(23).rx[0], /^5 rounds or 20 min/);
  assert.match(mm(79).rx[0], /20 lb in the ruck/);
  assert.deepEqual(mm(2).inputs, [{ kind: 'rounds', count: 3 }]);
  for (const n of [2, 9, 16, 23]) assert.ok(!S(n).blocks.some(b => b.slotKey === 'd2.F.flush'), `day ${n} still has the flush`);
  assert.ok(S(2).estMinutes <= 100, `day 2 estimate ${S(2).estMinutes} min`);
});
test('week 7 day 1 is a wave with 2k retest', () => {
  const s = S(43);
  assert.deepEqual(s.blocks[1].rule, { type: 'wave', reps: 6, pct: 0.80 });
  assert.equal(s.blocks[1].lift, 'backsquat');
  assert.equal(s.blocks[2].rule.scheme.kind, 'primerTT');
  assert.equal(s.blocks[2].test, 'row2k');
});
test('week 7 day 5 clean emom at 60%', () => {
  const s = S(47);
  assert.equal(s.blocks[0].rule.type, 'emom');
  assert.equal(s.blocks[0].rule.pct, 0.6);
  assert.equal(s.blocks[0].lift, 'clean');
  assert.equal(s.blocks[0].slotKey, 'd5.A.clean.hpc');
  assert.equal(S(47 + 91).blocks[0].slotKey, 'd5.A.clean.pc');
  assert.equal(s.blocks[1].lift, 'frontsquat');
  assert.equal(s.blocks[2].rule.type, 'intervals');
  assert.equal(s.blocks[2].rule.work, 60);
  assert.equal(S(5).blocks[2].rule.work, 45);
});
test('week 12 maxes record tests', () => {
  assert.equal(S(78).blocks[1].test, 'max_backsquat');
  assert.equal(S(78).blocks[1].rule.type, 'max');
  assert.equal(S(78).blocks[0].test, 'jumpMax');
  assert.equal(S(79).blocks[0].test, 'max_deadlift');
  assert.equal(S(79).blocks[2].test, 'max_ohp');
  assert.equal(S(82).blocks[0].test, 'max_clean');
  assert.equal(S(82).blocks[1].test, 'max_frontsquat');
});
test('week 13 is deload and tests', () => {
  const d1 = S(85);
  assert.deepEqual(d1.blocks[1].rule, { type: 'percent', sets: 3, reps: 5, pct: 0.75 });
  const d2 = S(86);
  assert.deepEqual(d2.blocks.filter(b => b.test).map(b => b.test), ['pushups2', 'situps2', 'pullupsMax']);
  assert.ok(!d2.blocks.some(b => b.key === 'E'));
  assert.equal(S(87).blocks[0].test, 'run1_5mi');
  const d5 = S(89);
  assert.equal(d5.blocks[2].pickDefault, 'olderTest');
  assert.equal(d5.blocks[2].test, 'row2k');
  assert.equal(d5.blocks[2].altRules.bike.test, 'bike10');
  assert.equal(S(90).blocks[0].test, 'ruck3mi');
  assert.equal(S(90 + 182).blocks[0].test, 'ruck4mi');
});
test('rest, advanced, graduation', () => {
  assert.equal(S(7).rest, true);
  assert.equal(S(7).blocks.filter(b => !b.advanced).length, 1);
  assert.ok(S(7, { advanced: true }).blocks.some(b => b.advanced && b.rule.type === 'zone2'));
  assert.ok(S(1, { advanced: true }).blocks.some(b => b.key === 'PM'));
  assert.ok(!S(1).blocks.some(b => b.key === 'PM'));
  assert.ok(!S(4, { advanced: true }).blocks.some(b => b.key === 'PM'));
  assert.equal(S(365).graduation, true);
  assert.equal(S(365).rest, true);
});
test('cycle 2 week 1 trains at test pace instead of testing', () => {
  const s = S(92);
  assert.equal(s.blocks[2].rule.scheme.kind, 'intervals');
  assert.equal(s.blocks[2].test, undefined);
});
test('long days', () => {
  assert.match(S(13).blocks[0].name, /Long Run/);
  assert.match(S(27).blocks[0].name, /Long Ruck/);
  assert.match(S(6).blocks[0].name, /Circuits/);
  assert.equal(S(13).blocks[0].rule.minutes, 40);
  assert.equal(S(27).blocks[0].rule.minutes, 45);
  assert.equal(S(6).blocks.length, 2);
});
test('run-ruck-run weeks fold the ruck into A and reletter', () => {
  const s = S(38);
  assert.equal(s.blocks[0].rule.format, 'R4');
  assert.deepEqual(s.blocks.map(b => b.key), ['A', 'B']);
  assert.deepEqual(S(87).blocks.map(b => b.key), ['A', 'B']);
  assert.deepEqual(S(3).blocks.map(b => b.key), ['A', 'B', 'C']);
  assert.match(S(3).blocks[1].rx.join(' '), /35 lb/);
  assert.match(S(59).blocks[1].rx.join(' '), /45 min/);
});
test('day 7 advanced duration tracks the nearest long week', () => {
  assert.equal(S(7, { advanced: true }).blocks.find(b => b.advanced).rule.minutes, 40);
  assert.equal(S(42, { advanced: true }).blocks.find(b => b.advanced).rule.minutes, 50);
});
test('day 4 shape', () => {
  const s = S(4);
  assert.deepEqual(s.blocks.map(b => b.key), ['A', 'B', 'C', 'D']);
  assert.equal(s.blocks[0].rule.type, 'zone2');
  assert.equal(s.blocks[0].rule.minutes, 40);
  assert.equal(s.blocks[1].slotKey, 'd4.B.pull.a');
  assert.equal(S(11).blocks[1].slotKey, 'd4.B.pull.b');
  assert.equal(s.blocks[2].rule.type, 'beatLast');
});
test('every day has unique block keys and well-formed blocks', () => {
  for (let n = 1; n <= 365; n++) {
    const s = S(n, { advanced: true });
    const keys = s.blocks.map(b => b.key);
    assert.equal(new Set(keys).size, keys.length, `day ${n}`);
    assert.ok(typeof s.estMinutes === 'number', `day ${n} estMinutes`);
    for (const b of s.blocks) {
      assert.ok(b.slotKey && b.name && b.rule && b.rule.type && Array.isArray(b.rx) && Array.isArray(b.inputs), `day ${n} ${b.key}`);
      if (b.options) assert.ok(b.options.length >= 1, `day ${n} ${b.key} options`);
    }
  }
});
test('both presses appear every week: Day 2 ladders one, Day 4 presses the other', () => {
  const c = n => S(n).blocks[2];
  assert.equal(c(2).lift, 'bench');                      // cycle 1 Phase A: bench ladder on Day 2
  assert.equal(c(4).lift, 'ohp');                        // so Day 4 presses overhead
  assert.equal(c(4).slotKey, 'd4.C.press.ohp');
  assert.equal(c(4).name, 'Overhead Press + Arms');
  assert.equal(c(4).rule.type, 'beatLast');
  assert.match(c(4).rx[0], /^Overhead press 4 × 6/);
  assert.equal(c(44).name, 'Overhead Press');            // week 7: the ladder switches to OHP
  assert.equal(c(46).name, 'Bench Press + Arms');        // and Day 4 switches to bench
  assert.equal(c(93).lift, 'ohp');                       // cycle 2 reverses the order
  assert.equal(c(95).lift, 'bench');
  assert.match(c(88).rx[0], /3 × 8/);                    // week 13: light
  assert.equal(S(4).title, 'Zone 2 + Pull + Press');
  assert.equal(S(4).estMinutes, 70);
});
