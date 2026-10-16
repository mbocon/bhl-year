import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targets, estimate1RM, defaultOptionId } from '../js/engine.js';
import { rowScheme, bikeScheme } from '../js/program/schemes.js';
import { MACHINE_OPTIONS } from '../js/program/rotations.js';
import { dayInfo } from '../js/calendar.js';

const now = Date.now();
const DAY = 86400e3;

// ----- fakes -----
function fake({ logs = {}, tests = {}, evidence = {}, choices = {} } = {}) {
  const entries = (slotKey, optionId) => (logs[slotKey] || []).filter(e => optionId === undefined || e.block?.optionId === undefined || e.block.optionId === optionId);
  return {
    logsFor: (slotKey, optionId) => entries(slotKey, optionId),
    lastLog: (slotKey, optionId) => { const a = entries(slotKey, optionId); return a.length ? a[a.length - 1] : null; },
    latestTest: (id, opts = {}) => { const t = tests[id]; if (!t) return null; if (opts.maxAgeDays !== undefined && now - t.at >= opts.maxAgeDays * DAY) return null; return t; },
    liftEvidence: lift => evidence[lift] || [],
    getChoice: slotKey => choices[slotKey],
  };
}
const ctx = (history, { n, optionId, settings = {} } = {}) => ({ history, settings: { units: 'lb', ...settings }, info: dayInfo(n), optionId, now });

const ladderBlock = (reps, phase) => ({ key: 'A', slotKey: 'd2.A.deadlift', lift: 'deadlift', rule: { type: 'ladder', reps, phase }, inputs: [{ kind: 'sets', count: reps.length }] });
const tempoBlock = (s, r) => ({ key: 'B', slotKey: 'd1.B.backsquat', lift: 'backsquat', rule: { type: 'tempoProg', sets: s, reps: r } });
const waveBlock = (reps, pct) => ({ key: 'B', slotKey: 'd1.B.backsquat', lift: 'backsquat', rule: { type: 'wave', reps, pct } });
const percentBlock = (lift, s, r, pct) => ({ key: 'A', slotKey: 'd2.A.' + lift, lift, rule: { type: 'percent', sets: s, reps: r, pct } });
const pctSingleBlock = (pct, refWeek) => ({ key: 'A', slotKey: 'd5.A.clean.hpc', lift: 'clean', rule: { type: 'pctSingle', sets: 6, reps: 3, pct, refWeek } });
const plusFiveBlock = () => ({ key: 'A', slotKey: 'd5.A.clean.hpc', lift: 'clean', rule: { type: 'plusFive', sets: 5, reps: 3 } });
const emomBlock = (pct, refWeek) => ({ key: 'A', slotKey: 'd5.A.clean.hpc', lift: 'clean', rule: { type: 'emom', minutes: 10, every: 60, reps: 3, pct, refWeek } });
const machineBlock = week => ({ key: 'C', slotKey: 'd1.C.machine', options: MACHINE_OPTIONS, rule: { type: 'rowPace', scheme: rowScheme(week, {}) }, altRules: { bike: { rule: { type: 'bikePace', scheme: bikeScheme(week, {}) } } } });
const machineTestBlock = () => ({ key: 'C', slotKey: 'd5.C.machine', options: MACHINE_OPTIONS, pickDefault: 'olderTest', test: 'row2k', rule: { type: 'rowPace', scheme: { kind: 'tt' } }, altRules: { bike: { rule: { type: 'bikePace', scheme: { kind: 'tt' } }, test: 'bike10' } } });
const runBlock = format => ({ key: 'A', slotKey: 'd3.A.run.' + format, rule: { type: 'runPace', format } });
const peakBlock = slotKey => ({ key: 'B', slotKey, rule: { type: 'peakRepeat' } });
const densityBlock = (circuit, format) => ({ key: 'D', slotKey: 'd2.D.bw.' + circuit, rule: { type: 'density', format } });
const zone2Block = minutes => ({ key: 'A', slotKey: 'd4.A.zone2', rule: { type: 'zone2', minutes } });

// ----- tests -----
test('ladder start from last week same rep count', () => {
  const h = fake({ logs: { 'd2.A.deadlift': [{ day: 2, block: { sets: [{ w: 315, r: 7 }, { w: 335, r: 6 }, { w: 355, r: 5 }] } }] } });
  const t = targets(ladderBlock([6, 5, 4], 'A'), ctx(h, { n: 9 }));
  assert.equal(t.text, 'Start set of 6 at 335 lb');
  assert.equal(t.prefill.sets[0].w, 335);
  assert.equal(t.missing, undefined);
});
test('ladder ignores logs from the other phase', () => {
  const h = fake({ logs: { 'd2.A.deadlift': [{ day: 37, block: { sets: [{ w: 405, r: 3 }, { w: 425, r: 2 }, { w: 445, r: 1 }, { w: 455, r: 1 }] } }] } });
  const t = targets(ladderBlock([8, 7, 6], 'B'), ctx(h, { n: 44 }));
  assert.match(t.text, /Work up/);
  assert.equal(t.missing, true);
});
test('ladder with no history', () => {
  const t = targets(ladderBlock([8, 7, 6], 'A'), ctx(fake({}), { n: 2 }));
  assert.match(t.text, /Work up/);
  assert.equal(t.missing, true);
});
test('tempo progression', () => {
  const h = fake({ logs: { 'd1.B.backsquat': [{ day: 1, block: { sets: [{ w: 225, r: 6 }, { w: 245, r: 6 }] } }] } });
  assert.equal(targets(tempoBlock(4, 5), ctx(h, { n: 8 })).text, 'Top set ≈ 255 lb');
  assert.equal(targets(tempoBlock(4, 6), ctx(fake({}), { n: 1 })).missing, true);
});
test('estimate1RM: single anchor then topsets only raise', () => {
  const ev = [{ kind: 'single', weight: 305, reps: 1, at: now - 7 * DAY, week: 6, phase: 'A' }, { kind: 'topset', weight: 255, reps: 6, at: now - 1000, week: 7, phase: 'B' }];
  assert.equal(estimate1RM(ev, { now }), 329);
  const ev2 = [...ev, { kind: 'topset', weight: 285, reps: 6, at: now - 500, week: 7, phase: 'B' }];
  assert.equal(estimate1RM(ev2, { now }), 342);
});
test('estimate1RM: tested 1rm newer than single wins; stale evidence ignored', () => {
  assert.equal(estimate1RM([{ kind: 'single', weight: 305, reps: 1, at: now - 50 * DAY, week: 6, phase: 'A' }], { now }), null);
  assert.equal(estimate1RM([{ kind: 'single', weight: 305, reps: 1, at: now - 20 * DAY, week: 6, phase: 'A' }, { kind: '1rm', weight: 340, reps: 1, at: now - 1000, week: 12, phase: 'B' }], { now }), 340);
  assert.equal(estimate1RM([], { now }), null);
});
test('estimate1RM: topsets alone give a best Epley', () => {
  assert.equal(estimate1RM([{ kind: 'topset', weight: 250, reps: 6, at: now - DAY, week: 7, phase: 'B' }], { now }), 300);
});
test('wave target from e1RM', () => {
  const h = fake({ evidence: { backsquat: [{ kind: 'single', weight: 305, reps: 1, at: now - 7 * DAY, week: 6, phase: 'A' }] } });
  const t = targets(waveBlock(6, 0.80), ctx(h, { n: 43 }));
  assert.equal(t.text, 'Top set ≈ 265 lb · RPE 8–9, no misses');
  assert.match(t.sub, /330/);
  assert.equal(t.prefill.sets.at(-1).w, 265);
});
test('wave without evidence', () => {
  const t = targets(waveBlock(6, 0.80), ctx(fake({}), { n: 43 }));
  assert.equal(t.text, 'Work to RPE 8–9, no misses');
  assert.equal(t.missing, true);
});
test('percent, pctSingle, plusFive, emom', () => {
  const h = fake({
    evidence: { deadlift: [{ kind: '1rm', weight: 405, reps: 1, at: now - 3 * DAY, week: 12, phase: 'B' }] },
    logs: { 'd5.A.clean.hpc': [{ day: 5, block: { sets: [{ w: 185, r: 1 }], ruleType: 'single' } }, { day: 19, block: { sets: [{ w: 170, r: 3 }], ruleType: 'plusFive' } }] },
  });
  assert.equal(targets(percentBlock('deadlift', 3, 3, 0.75), ctx(h, { n: 86 })).text, '3 × 3 @ 305 lb (75%)');
  assert.equal(targets(pctSingleBlock(0.9, 1), ctx(h, { n: 12 })).text, '6 × 3 @ 165 lb (90% of 185)');
  assert.equal(targets(plusFiveBlock(), ctx(h, { n: 26 })).text, '5 × 3 @ 175 lb (+5)');
  assert.equal(targets(emomBlock(0.6, 1), ctx(h, { n: 47 })).text, '3 reps @ 110 lb (60% of 185)');
  const h2 = fake({ logs: { 'd5.A.clean.hpc': [{ day: 47, block: { sets: [{ w: 110, r: 3 }], ruleType: 'emom' } }] } });
  assert.equal(targets(emomBlock(), ctx(h2, { n: 54 })).text, '3 reps @ 115 lb (+5)');
  assert.equal(targets(percentBlock('deadlift', 3, 3, 0.75), ctx(fake({}), { n: 86 })).missing, true);
});
test('row pace and fallback when switching machines', () => {
  const h = fake({ tests: { row2k: { value: 448, at: now - 3 * DAY } } });
  const t = targets(machineBlock(2), ctx(h, { n: 8, optionId: 'rower' }));
  assert.equal(t.text, '12 × 500 m @ 1:52 /500m · walk 2:00');
  const b = targets(machineBlock(2), ctx(h, { n: 8, optionId: 'bike' }));
  assert.match(b.text, /comfortable but challenging/i);
  assert.equal(b.missing, true);
  const o = targets(machineBlock(4), ctx(h, { n: 22, optionId: 'rower' }));
  assert.equal(o.text, '12 × 400 m @ 1:50 /500m · walk 1:30');
  const l = targets(machineBlock(11), ctx(h, { n: 71, optionId: 'rower' }));
  assert.equal(l.text, '3 × 1200 m @ 1:54 · 1:52 · 1:50 /500m · rest 3:00');
});
test('bike calories', () => {
  const h = fake({ tests: { bike10: { value: 210, at: now - 3 * DAY } } });
  assert.equal(targets(machineBlock(2), ctx(h, { n: 8, optionId: 'bike' })).text, '12 × 1:30 → 33 cal · easy 2:00');
  assert.equal(targets(machineBlock(11), ctx(h, { n: 71, optionId: 'bike' })).text, '3 × 4:00 → 80 · 84 · 88 cal · rest 3:00');
});
test('tests and primers show the previous result', () => {
  const h = fake({ tests: { row2k: { value: 448, at: now - 40 * DAY } } });
  const t = targets(machineBlock(7), ctx(h, { n: 43, optionId: 'rower' }));
  assert.match(t.text, /Last 2k: 7:28/);
  assert.match(targets(machineBlock(7), ctx(fake({}), { n: 43, optionId: 'rower' })).text, /first 2k/i);
});
test('run pace', () => {
  const h = fake({ tests: { run5k: { value: 1320, at: now - 3 * DAY } } });
  const t = targets(runBlock('R1'), ctx(h, { n: 3 }));
  assert.match(t.sub, /fast 4:24 \/km/);
  assert.match(t.sub, /moderate 5:24–5:39 \/km/);
  assert.match(t.sub, /easy 5:54–6:24 \/km/);
  assert.match(targets(runBlock('R1'), ctx(fake({}), { n: 3 })).text, /comfortable but challenging/i);
  assert.match(targets(runBlock('TT5K'), ctx(h, { n: 24 })).text, /Last 5k: 22:00/);
});
test('peak repeat, introduce, density, beatLast, zone2', () => {
  const h = fake({
    logs: {
      'd2.B.singleleg.rfe': [{ day: 23, block: { sets: [{ w: 40, r: 8 }, { w: 45, r: 8 }, { w: 50, r: 8 }] } }],
      'd2.D.bw.A': [{ day: 23, block: { reps: 212, format: 'emom16' } }],
      'd4.B.pull.a': [{ day: 4, block: { sets: [{ w: 25, r: 5 }, { w: 25, r: 4 }] } }],
    },
  });
  assert.equal(targets(peakBlock('d2.B.singleleg.rfe'), ctx(h, { n: 30 })).text, 'All sets at 50 lb');
  assert.deepEqual(targets(peakBlock('d2.B.singleleg.rfe'), ctx(h, { n: 30 })).prefill.sets.map(s => s.w), [50, 50, 50]);
  assert.match(targets(peakBlock('d2.B.singleleg.rfe'), ctx(fake({}), { n: 30 })).text, /Work up/);
  assert.match(targets({ key: 'B', slotKey: 'x', rule: { type: 'introduce' } }, ctx(fake({}), { n: 2 })).text, /Increase weight each set/);
  assert.equal(targets(densityBlock('A', 'emom16'), ctx(h, { n: 30 })).text, 'Beat 212 total reps');
  assert.equal(targets(densityBlock('A', 'emom20'), ctx(h, { n: 44 })).missing, true);
  assert.equal(targets({ key: 'B', slotKey: 'd4.B.pull.a', rule: { type: 'beatLast' } }, ctx(h, { n: 18 })).text, 'Last: 25×5, 25×4 · beat it by a rep or 5 lb');
  assert.equal(targets(zone2Block(40), ctx(fake({}), { n: 4, settings: { maxHR: 190 } })).text, '40 min · 124–143 bpm');
  assert.equal(targets(zone2Block(40), ctx(fake({}), { n: 4, settings: {} })).text, '40 min · conversational pace');
});
test('kg display', () => {
  const h = fake({ logs: { 'd2.A.deadlift': [{ day: 2, block: { sets: [{ w: 315, r: 7 }, { w: 335, r: 6 }, { w: 355, r: 5 }] } }] } });
  const t = targets(ladderBlock([6, 5, 4], 'A'), ctx(h, { n: 9, settings: { units: 'kg' } }));
  assert.equal(t.text, 'Start set of 6 at 152.5 kg');
});
test('defaultOptionId prefers stored choice, else older test, else first', () => {
  const h = fake({ choices: {}, tests: { row2k: { value: 448, at: now - 2 * DAY }, bike10: { value: 200, at: now - 40 * DAY } } });
  assert.equal(defaultOptionId(machineTestBlock(), ctx(h, { n: 89 })), 'bike');
  const h2 = fake({ choices: { 'd5.C.machine': 'rower' }, tests: { row2k: { value: 448, at: now - 2 * DAY }, bike10: { value: 200, at: now - 40 * DAY } } });
  assert.equal(defaultOptionId(machineTestBlock(), ctx(h2, { n: 89 })), 'rower');
  assert.equal(defaultOptionId(machineBlock(2), ctx(fake({}), { n: 8 })), 'rower');
  assert.equal(defaultOptionId(machineBlock(2), ctx(fake({ choices: { 'd1.C.machine': 'bike' } }), { n: 8 })), 'bike');
  assert.equal(defaultOptionId({ key: 'A', slotKey: 'x', rule: { type: 'none' } }, ctx(fake({}), { n: 8 })), undefined);
});
test('ladder falls back to set position when reps were not typed', () => {
  const h = fake({ logs: { 'd2.A.deadlift': [{ day: 2, block: { sets: [{ w: 315 }, { w: 335 }, { w: 355 }] } }] } });
  assert.equal(targets(ladderBlock([7, 6, 5], 'A'), ctx(h, { n: 9 })).text, 'Start set of 7 at 335 lb');
});
test('ladder with no history still prefills the rep scheme', () => {
  const t = targets(ladderBlock([8, 7, 6], 'A'), ctx(fake({}), { n: 2 }));
  assert.deepEqual(t.prefill.sets.map(s => s.r), [8, 7, 6]);
});
