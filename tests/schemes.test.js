import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  squatScheme, frontSquatScheme, deadliftScheme, pressScheme, cleanScheme, rowScheme, bikeScheme,
  runFormat, densityFormat, mmRounds, mmVest, MM_CAP_MINUTES, longDuration, zone2Minutes, ruckLoad, ruckTestMiles,
  pressLiftFor, cleanVariantFor,
} from '../js/program/schemes.js';

test('squat', () => {
  assert.deepEqual(squatScheme(1), { kind: 'tempo', tempo: '42X1', sets: 4, reps: 6 });
  assert.deepEqual(squatScheme(5), { kind: 'tempo', tempo: '42X1', sets: 5, reps: 2 });
  assert.deepEqual(squatScheme(6), { kind: 'single', tempo: '42X1', sets: 5, reps: 1 });
  assert.deepEqual(squatScheme(7), { kind: 'wave', tempo: '20X1', reps: 6, pct: 0.80 });
  assert.equal(squatScheme(9).reps, 2);
  assert.equal(squatScheme(10).pct, 0.83);
  assert.equal(squatScheme(12).kind, 'max');
  assert.deepEqual(squatScheme(13), { kind: 'percent', sets: 3, reps: 5, pct: 0.75 });
});
test('front squat wave order', () => {
  assert.deepEqual([7, 8, 9, 10, 11].map(w => frontSquatScheme(w).reps), [6, 4, 5, 2, 3]);
  assert.equal(frontSquatScheme(12).kind, 'max');
  assert.deepEqual(frontSquatScheme(3), squatScheme(3));
});
test('ladders', () => {
  assert.deepEqual(deadliftScheme(1).reps, [8, 7, 6]);
  assert.deepEqual(deadliftScheme(6).reps, [3, 2, 1, 1]);
  assert.equal(deadliftScheme(6).grip, 'doh');
  assert.equal(deadliftScheme(9).grip, 'hookOk');
  assert.equal(deadliftScheme(12).grip, 'max');
  assert.deepEqual(deadliftScheme(13), { kind: 'percent', sets: 3, reps: 3, pct: 0.75 });
  assert.deepEqual(pressScheme(13), { kind: 'percent', sets: 3, reps: 5, pct: 0.75 });
  assert.deepEqual(pressScheme(4).reps, [5, 4, 3]);
});
test('clean', () => {
  assert.equal(cleanScheme(1).kind, 'single');
  assert.deepEqual(cleanScheme(2), { kind: 'pctSingle', sets: 6, reps: 3, pct: 0.9, refWeek: 1 });
  assert.equal(cleanScheme(4).kind, 'plusFive');
  assert.equal(cleanScheme(6).kind, 'single');
  assert.deepEqual(cleanScheme(7), { kind: 'emom', minutes: 10, every: 60, reps: 3, pct: 0.6, refWeek: 6 });
  assert.deepEqual(cleanScheme(8), { kind: 'emom', minutes: 10, every: 60, reps: 3 });
  assert.equal(cleanScheme(11).every, 90);
  assert.equal(cleanScheme(12).kind, 'single');
  assert.deepEqual(cleanScheme(13), { kind: 'percent', sets: 3, reps: 3, pct: 0.6 });
});
test('row', () => {
  assert.equal(rowScheme(1, { firstCycle: true }).kind, 'tt');
  assert.deepEqual(rowScheme(1, { firstCycle: false }), { kind: 'intervals', rounds: 12, meters: 400, offset: 0, rest: '1:30' });
  assert.deepEqual(rowScheme(2, {}), { kind: 'intervals', rounds: 12, meters: 500, offset: 0, rest: '2:00' });
  assert.deepEqual(rowScheme(4, {}), { kind: 'intervals', rounds: 12, meters: 400, offset: -2, rest: '1:30' });
  assert.equal(rowScheme(7, {}).kind, 'primerTT');
  assert.deepEqual(rowScheme(9, {}), { kind: 'intervals', rounds: 12, meters: 500, offset: 0, rest: '1:30' });
  assert.equal(rowScheme(11, {}).kind, 'ladder1200');
  assert.equal(rowScheme(12, {}).kind, 'primerTT');
  assert.deepEqual(rowScheme(13, {}), { kind: 'easy', minutes: 20 });
});
test('bike', () => {
  assert.equal(bikeScheme(1, { firstCycle: true }).kind, 'tt');
  assert.deepEqual(bikeScheme(1, { firstCycle: false }), { kind: 'intervals', rounds: 12, seconds: 75, mult: 1.05, rest: '1:30' });
  assert.deepEqual(bikeScheme(2, {}), { kind: 'intervals', rounds: 12, seconds: 90, mult: 1.05, rest: '2:00' });
  assert.equal(bikeScheme(5, {}).mult, 1.10);
  assert.equal(bikeScheme(7, {}).kind, 'primerTT');
  assert.equal(bikeScheme(11, {}).kind, 'ladder4min');
  assert.equal(bikeScheme(13, {}).kind, 'easy');
});
test('run formats', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(runFormat),
    ['R1', 'R2', 'R5', 'TT5K', 'R3', 'R4', 'R6', 'R1', 'TT5K', 'R2', 'R3', 'R4', 'TEST1_5']);
});
test('density and mm', () => {
  assert.deepEqual(densityFormat(1), { kind: 'emom', minutes: 16, work: 30 });
  assert.equal(densityFormat(6).minutes, 20);
  assert.deepEqual(densityFormat(11), { kind: 'e90', sets: 16, work: 45 });
  assert.equal(densityFormat(13).kind, 'tests');
  assert.deepEqual([1, 7, 8, 11, 12, 13].map(mmRounds), [5, 5, 6, 8, 7, 0]);
  assert.deepEqual([1, 2, 3, 4, 5].map(w => mmRounds(w, { firstCycle: true })), [3, 3, 4, 5, 5], 'cycle 1 ramps to the full dose by week 4');
  assert.equal(mmRounds(13, { firstCycle: true }), 0);
  assert.equal(MM_CAP_MINUTES, 20);
  assert.equal(mmVest(11), true);
  assert.equal(mmVest(10), false);
});
test('durations and loads', () => {
  assert.equal(longDuration(1, 2), 40);
  assert.equal(longDuration(1, 6), 50);
  assert.equal(longDuration(1, 10), 60);
  assert.equal(longDuration(1, 4), 45);
  assert.equal(longDuration(1, 12), 60);
  assert.equal(longDuration(4, 12), 120);
  assert.equal(zone2Minutes(1, 1), 40);
  assert.equal(zone2Minutes(1, 11), 60);
  assert.equal(zone2Minutes(3, 1), 50);
  assert.equal(zone2Minutes(2, 13), 30);
  assert.deepEqual([1, 2, 3, 4].map(ruckLoad), [35, 45, 50, 55]);
  assert.deepEqual([1, 2, 3, 4].map(ruckTestMiles), [3, 3, 4, 4]);
});
test('cycle variants', () => {
  assert.equal(pressLiftFor(1, 'A'), 'bench');
  assert.equal(pressLiftFor(1, 'B'), 'ohp');
  assert.equal(pressLiftFor(2, 'A'), 'ohp');
  assert.equal(pressLiftFor(2, 'B'), 'bench');
  assert.deepEqual([1, 2, 3, 4].map(cleanVariantFor), ['hpc', 'pc', 'hpc', 'pc']);
});
