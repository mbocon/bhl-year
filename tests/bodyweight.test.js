import { test } from 'node:test';
import assert from 'node:assert/strict';
import { session } from '../js/program/index.js';
import { bwDayInfo, bwTitle, foundationTarget, FOUNDATION_DAYS, BW_MOVES } from '../js/program/bodyweight.js';

const S = n => session(n, { path: 'bodyweight' });
const slots = n => S(n).blocks.map(b => b.slotKey);

test('calendar: weeks, phases and no upper limit', () => {
  assert.deepEqual(bwDayInfo(1), { n: 1, week: 1, dow: 1, phase: 'F', ab: 'A', rest: false });
  assert.equal(bwDayInfo(8).ab, 'B');
  assert.equal(bwDayInfo(84).phase, 'F'); assert.equal(bwDayInfo(84).rest, true);
  assert.equal(bwDayInfo(85).phase, 'S'); assert.equal(bwDayInfo(85).dow, 1);
  assert.equal(bwDayInfo(5000).week, 715);
  assert.equal(FOUNDATION_DAYS, 84);
  assert.throws(() => bwDayInfo(0), RangeError);
  assert.throws(() => bwDayInfo(1.5), RangeError);
});
test('session() routes by path and bhl is untouched', () => {
  assert.equal(S(1).path, 'bodyweight');
  assert.equal(session(1, {}).title, 'Squat + Intervals');
  assert.equal(session(1, { path: 'bhl' }).title, 'Squat + Intervals');
  assert.equal(S(366).graduation, false);
  assert.equal(S(1).cycle, null);
});
test('foundation week: three full-body days, walks between, rest on day 7', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(n => S(n).title), ['Full Body', 'Walk', 'Full Body', 'Walk', 'Full Body', 'Walk', 'Rest']);
  assert.deepEqual([1, 2, 7, 85, 91].map(bwTitle), ['Full Body', 'Walk', 'Rest', 'Back + Calves', 'Rest']);
  assert.deepEqual(slots(2), ['bw.walk']);
  assert.deepEqual(slots(7), ['bw.rest']);
  assert.equal(S(7).rest, true);
  assert.equal(S(1).phaseLabel, 'Foundation');
});
test('week A and week B rotate legs, push and pull as designed', () => {
  assert.deepEqual(slots(1), ['bw.f.splitsquat', 'bw.f.pushup', 'bw.f.pullup', 'bw.f.ohp', 'bw.f.kneeraise', 'bw.f.calf', 'bw.bike']);
  assert.deepEqual(slots(3), ['bw.f.lunge', 'bw.f.dip', 'bw.f.chinup', 'bw.f.ohp', 'bw.f.kneeraise', 'bw.f.calf']);
  assert.deepEqual(slots(5), ['bw.f.stepup', 'bw.f.pushup', 'bw.f.pullup', 'bw.f.ohp', 'bw.f.kneeraise', 'bw.f.calf', 'bw.bike']);
  assert.deepEqual(slots(8).slice(1, 3), ['bw.f.dip', 'bw.f.chinup']);
  assert.deepEqual(slots(10).slice(1, 3), ['bw.f.pushup', 'bw.f.pullup']);
  assert.deepEqual(slots(12).slice(1, 3), ['bw.f.dip', 'bw.f.chinup']);
  assert.deepEqual(S(3).blocks.slice(0, 3).map(b => b.name), ['Lunges', 'Dips, Then Push-Ups', 'Chin-Ups']);
});
test('foundation targets step 25, 30, 35 and the bike block is optional', () => {
  const t = n => S(n).blocks[0].rule.target;
  assert.deepEqual([t(1), t(26), t(29), t(54), t(57), t(82)], [25, 25, 30, 30, 35, 35]);
  assert.deepEqual([1, 4, 5, 8, 9, 12].map(foundationTarget), [25, 25, 30, 30, 35, 35]);
  assert.equal(S(1).blocks[0].rule.perLeg, true);
  assert.equal(S(1).blocks[0].rule.mode, 'fixed');
  assert.equal(S(1).blocks[0].rx[0], '25 per leg');
  assert.equal(S(1).blocks[1].rx[0], '25 total');
  assert.equal(S(1).blocks.at(-1).advanced, true);
  assert.equal(S(1).blocks.filter(b => b.advanced).length, 1);
  assert.deepEqual([S(1).estMinutes, S(29).estMinutes, S(57).estMinutes, S(2).estMinutes], [30, 35, 40, 0]);
  assert.ok(S(1).brief.length >= 2);
  assert.deepEqual([S(1).rotation, S(2).rotation, S(85).rotation], [true, false, false]);
  assert.deepEqual(S(1).blocks.slice(0, 2).map(b => b.inputs[0].label), ['Per leg', 'Total']);   // short enough for the label column
  assert.deepEqual(S(2).brief, []);
});
test('day 85 on: one part a day in the designed order, forever', () => {
  const week = start => [0, 1, 2, 3, 4, 5, 6].map(i => S(start + i).title);
  const expected = ['Back + Calves', 'Chest', 'Legs + Calves', 'Arms', 'Shoulders + Calves', 'Core', 'Rest'];
  assert.deepEqual(week(85), expected);
  assert.deepEqual(week(365), expected);          // (365 - 1) % 7 === 0, so day 365 opens a week
  assert.deepEqual(week(7001), expected);
  assert.deepEqual(slots(85), ['bw.s.pullup', 'bw.s.calf', 'bw.walk']);
  assert.deepEqual(slots(86), ['bw.s.chest', 'bw.walk', 'bw.bike']);
  assert.deepEqual(slots(87), ['bw.s.splitsquat', 'bw.s.lunge', 'bw.s.stepup', 'bw.s.calf', 'bw.walk']);
  assert.deepEqual(slots(88), ['bw.s.chinup', 'bw.walk']);
  assert.deepEqual(slots(89), ['bw.s.ohp', 'bw.s.calf', 'bw.walk']);
  assert.deepEqual(slots(90), ['bw.s.kneeraise', 'bw.walk', 'bw.bike']);
  assert.deepEqual(slots(91), ['bw.rest']);
  assert.equal(S(85).phaseLabel, 'One part a day');
  assert.deepEqual([85, 86, 87, 88, 89, 90, 91].map(n => S(n).estMinutes), [60, 45, 60, 45, 60, 30, 0]);
});
test('split goals: 100 a day, legs add up to 100 per leg, time caps', () => {
  const legs = S(87).blocks.filter(b => b.rule.perLeg);
  assert.equal(legs.reduce((a, b) => a + b.rule.target, 0), 100);
  assert.ok(legs.every(b => b.rule.capMinutes === undefined && b.inputs.length === 1));
  assert.deepEqual(S(85).blocks.map(b => [b.rule.target, b.rule.capMinutes]).slice(0, 2), [[100, 45], [100, 15]]);
  assert.equal(S(85).blocks[0].rule.mode, 'build');
  assert.equal(S(85).blocks[0].rx[0], 'Goal 100');
  assert.equal(S(87).blocks[0].rx[0], 'Goal 35 per leg');
  assert.ok(S(85).blocks[0].inputs.some(i => i.kind === 'duration'));
  assert.equal(S(85).blocks.at(-1).name, 'Steps');
  assert.equal(S(2).blocks[0].name, 'Walk');
});
test('every day from 1 to 1200 is well formed', () => {
  const kinds = new Set(['reps', 'duration', 'cal']);
  for (let n = 1; n <= 1200; n++) {
    const s = S(n);
    assert.ok(s.title && s.phaseLabel, `d${n}`);
    assert.equal(s.n, n);
    assert.deepEqual(s.blocks.map(b => b.key), [...'ABCDEFGH'].slice(0, s.blocks.length), `d${n} key order`);
    for (const b of s.blocks) {
      assert.match(b.slotKey, /^bw\./, `d${n}`);
      assert.ok(b.name && b.rule?.type && b.rx?.length && Array.isArray(b.inputs), `d${n} ${b.key}`);
      for (const i of b.inputs) assert.ok(kinds.has(i.kind), `d${n} ${b.key} ${i.kind}`);
      if (b.rule.type === 'slowReps') assert.ok(b.cues.length >= 2 && Number.isFinite(b.rule.target), `d${n} ${b.key} cues/target`);
    }
  }
});
test('BW_MOVES lists every slow-rep slot the sessions use', () => {
  const used = new Map();
  for (let n = 1; n <= 98; n++) for (const b of S(n).blocks) if (b.rule.type === 'slowReps') used.set(b.slotKey, b.name);
  assert.deepEqual(new Set(BW_MOVES.map(m => m.slotKey)), new Set(used.keys()));
  for (const m of BW_MOVES) { assert.equal(m.name, used.get(m.slotKey)); assert.equal(m.rule.type, 'slowReps'); assert.match(m.phase, /^[FS]$/); }
});
test('no personal names in the copy', () => {
  const all = JSON.stringify([1, 2, 3, 5, 7, 8, 85, 86, 87, 88, 89, 90, 91].map(S));
  assert.doesNotMatch(all, /Mike/);
});
