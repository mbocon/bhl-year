import { test } from 'node:test';
import assert from 'node:assert/strict';
import { session } from '../js/program/index.js';
import { resolveBlock } from '../js/engine.js';
import { bwDayInfo, bwTitle, repTarget, BUILD_DAYS, bwMoves } from '../js/program/bodyweight.js';

const S = n => session(n, { path: 'bodyweight' });
const slots = n => S(n).blocks.map(b => b.slotKey);
const moves = n => slots(n).filter(k => k.startsWith('bw.f.')).map(k => k.slice(5));
const cardio = n => S(n).blocks.find(b => b.slotKey === 'bw.cardio');

test('calendar: weeks, phases and no upper limit', () => {
  assert.deepEqual(bwDayInfo(1), { n: 1, week: 1, dow: 1, phase: 'B', ab: 'A', rest: false });
  assert.equal(bwDayInfo(2).rest, true);
  assert.equal(bwDayInfo(8).ab, 'B');
  assert.equal(bwDayInfo(56).phase, 'B');
  assert.equal(bwDayInfo(57).phase, 'S'); assert.equal(bwDayInfo(57).dow, 1);
  assert.equal(bwDayInfo(5000).week, 715);
  assert.equal(BUILD_DAYS, 56);
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
test('the week never changes: full body on days 1, 4 and 6, class on 3, 5 and 7, rest on 2', () => {
  const week = start => [0, 1, 2, 3, 4, 5, 6].map(i => S(start + i).title);
  const expected = ['Full Body', 'Rest', 'Jiu-Jitsu', 'Full Body', 'Jiu-Jitsu', 'Full Body', 'Jiu-Jitsu'];
  assert.deepEqual(week(1), expected);
  assert.deepEqual(week(85), expected);
  assert.deepEqual(week(365), expected);          // (365 - 1) % 7 === 0, so day 365 opens a week
  assert.deepEqual(week(7001), expected);
  assert.deepEqual([1, 2, 3].map(bwTitle), ['Full Body', 'Rest', 'Jiu-Jitsu']);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(n => S(n).rest), [false, true, false, false, false, false, false]);
  assert.deepEqual([S(1).phaseLabel, S(56).phaseLabel, S(57).phaseLabel, S(900).phaseLabel], ['Building reps', 'Building reps', 'Slow reps', 'Slow reps']);
});
test('a full-body day pairs pull with push, legs with core, shoulders with calves', () => {
  assert.deepEqual(slots(1), ['bw.f.pullup', 'bw.f.pushup', 'bw.f.splitsquat', 'bw.f.kneeraise', 'bw.f.ohp', 'bw.f.calf', 'bw.walk', 'bw.cardio']);
  assert.deepEqual(S(1).blocks.map(b => b.group), ['Pair 1', 'Pair 1', 'Pair 2', 'Pair 2', 'Pair 3', 'Pair 3', 'Also today', 'Also today']);
  assert.deepEqual(moves(4), ['chinup', 'dip', 'lunge', 'kneeraise', 'ohp', 'calf']);
  assert.deepEqual(moves(6), ['pullup', 'pushup', 'stepup', 'kneeraise', 'ohp', 'calf']);
  assert.deepEqual(S(4).blocks.slice(0, 3).map(b => b.name), ['Chin-Ups', 'Dips, Then Push-Ups', 'Lunges']);
  assert.deepEqual(S(2).blocks.map(b => b.group), [undefined, undefined]);   // nothing to group on a day with no pairs
});
test('week A and week B swap pull-ups with chin-ups and push-ups with dips, with no last week', () => {
  const pp = n => moves(n).slice(0, 2);
  assert.deepEqual([1, 4, 6].map(pp), [['pullup', 'pushup'], ['chinup', 'dip'], ['pullup', 'pushup']]);
  assert.deepEqual([8, 11, 13].map(pp), [['chinup', 'dip'], ['pullup', 'pushup'], ['chinup', 'dip']]);
  assert.deepEqual([365, 368, 370].map(pp), [['pullup', 'pushup'], ['chinup', 'dip'], ['pullup', 'pushup']]);   // week 53 is an A
  assert.deepEqual(pp(372), ['chinup', 'dip']);                                                                 // week 54 is a B
  assert.deepEqual([365, 368, 370].map(n => moves(n)[2]), ['splitsquat', 'lunge', 'stepup']);
});
test('targets step 25, 30, 35 and then stay at 35; speed is held while they rise', () => {
  const t = n => S(n).blocks[0].rule.target;
  assert.deepEqual([t(1), t(27), t(29), t(55), t(57), t(85), t(7001)], [25, 25, 30, 30, 35, 35, 35]);
  assert.deepEqual([1, 4, 5, 8, 9, 12, 500].map(repTarget), [25, 25, 30, 30, 35, 35, 35]);
  assert.deepEqual(S(1).blocks[0].rule, { type: 'slowReps', target: 25, hold: true });
  assert.deepEqual(S(1).blocks[2].rule, { type: 'slowReps', target: 25, perLeg: true, hold: true });
  assert.deepEqual(S(55).blocks[0].rule, { type: 'slowReps', target: 30, hold: true });
  assert.deepEqual(S(57).blocks[0].rule, { type: 'slowReps', target: 35 });
  assert.equal(S(1).blocks[2].rx[0], '25 per leg');
  assert.equal(S(1).blocks[0].rx[0], '25 total');
  assert.deepEqual([S(1).blocks[2], S(1).blocks[0]].map(b => b.inputs[0].label), ['Per leg', 'Total']);   // short enough for the label column
});
test('session length, brief and the pair count', () => {
  assert.deepEqual([S(1).estMinutes, S(29).estMinutes, S(57).estMinutes, S(2).estMinutes, S(3).estMinutes], [35, 40, 45, 0, 0]);
  assert.ok(S(1).brief.length >= 2);
  assert.match(S(1).brief.join(' '), /pair/i);
  assert.deepEqual([S(2).brief, S(3).brief], [[], []]);
  assert.deepEqual([S(1).rotation, S(2).rotation, S(3).rotation], [6, 0, 0]);
});
test('steps are on every day, with one optional pick-one cardio block last', () => {
  for (let n = 1; n <= 14; n++) {
    const s = S(n);
    const steps = s.blocks.filter(b => b.slotKey === 'bw.walk');
    assert.equal(steps.length, 1, `d${n} steps`);
    assert.ok(!steps[0].advanced && steps[0].name === 'Steps', `d${n} steps are not optional`);
    assert.deepEqual(s.blocks.filter(b => b.advanced).map(b => b.slotKey), ['bw.cardio'], `d${n} optional blocks`);
    assert.equal(s.blocks.at(-1).slotKey, 'bw.cardio', `d${n} cardio last`);
  }
  assert.deepEqual(slots(2), ['bw.walk', 'bw.cardio']);
  assert.deepEqual(slots(3), ['bw.class', 'bw.walk', 'bw.cardio']);
  assert.equal(S(3).blocks[0].name, 'Jiu-Jitsu Class');
  assert.equal(S(1).blocks[4].name, 'Overhead Press');
  assert.match(S(1).blocks[4].rx[1], /^Standing/);
  assert.match(S(3).blocks[0].rx.join(' '), /canceled/i);
});
test('cardio offers three options, each with its own instructions and a note for the kind of day', () => {
  const c = cardio(2);
  assert.deepEqual(c.options.map(o => o.name), ['Easy', 'Steady', 'Intervals']);
  const resolved = c.options.map(o => resolveBlock(c, o.id));
  assert.equal(new Set(resolved.map(r => r.rx[0])).size, 3);
  for (const r of resolved) {
    assert.ok(r.rx.length >= 3 && r.cues.length >= 1);
    assert.deepEqual(r.inputs, [{ kind: 'duration' }]);
    assert.equal(r.rule.type, 'none');
  }
  assert.match(resolved[2].rx.join(' '), /8 rounds/);
  const note = n => resolveBlock(cardio(n), 'easy').rx.at(-1);
  assert.equal(new Set([note(1), note(2), note(3)]).size, 3);          // full-body day, rest day, class day
  assert.match(note(3), /canceled/i);
  for (const n of [1, 2, 3]) for (const o of cardio(n).options) assert.equal(resolveBlock(cardio(n), o.id).rx.at(-1), resolveBlock(cardio(n), 'easy').rx.at(-1));
});
test('the figure on a closed card is short enough to show in full on a phone', () => {
  for (let n = 1; n <= 14; n++) for (const b of S(n).blocks) {
    const fig = b.fig ?? b.rx[0];
    assert.ok(fig.length <= 18, `d${n} ${b.name}: ${fig}`);
    assert.ok(b.name.length <= 22, `d${n} ${b.name}`);
  }
  assert.equal(cardio(1).fig, '');                 // the Optional tag and the chosen option already fill that row
  assert.equal(S(2).blocks[0].rx[0], 'Goal: 10,000 steps');
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
      for (const o of b.options || []) assert.ok(o.id && o.name && Array.isArray(o.needs), `d${n} ${b.key} option`);
    }
  }
});
test('bwMoves lists every slow-rep slot the sessions use, with the rule for that week', () => {
  const used = new Map();
  for (let n = 1; n <= 98; n++) for (const b of S(n).blocks) if (b.rule.type === 'slowReps') used.set(b.slotKey, b.name);
  assert.deepEqual(new Set(bwMoves(1).map(m => m.slotKey)), new Set(used.keys()));
  for (const m of bwMoves(1)) { assert.equal(m.name, used.get(m.slotKey)); assert.equal(m.rule.type, 'slowReps'); assert.equal(m.rule.hold, true); assert.equal(m.rule.target, 25); }
  for (const m of bwMoves(9)) { assert.equal(m.rule.target, 35); assert.equal(m.rule.hold, undefined); }
});
test('no personal names in the copy', () => {
  const all = JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 57].map(S));
  assert.doesNotMatch(all, /Mike/);
});
