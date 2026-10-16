// Week-by-week numbers from the design spec §4.4 and §4.7, as pure lookups. week = 1..13, cycle = 1..4.

const WAVE_PCT = { 6: 0.80, 5: 0.83, 4: 0.86, 3: 0.89, 2: 0.92 };
const TEMPO_SETS = { 1: [4, 6], 2: [4, 5], 3: [5, 4], 4: [5, 3], 5: [5, 2] };

function squatLike(week, waveOrder) {
  if (week <= 5) { const [sets, reps] = TEMPO_SETS[week]; return { kind: 'tempo', tempo: '42X1', sets, reps }; }
  if (week === 6) return { kind: 'single', tempo: '42X1', sets: 5, reps: 1 };
  if (week <= 11) { const reps = waveOrder[week - 7]; return { kind: 'wave', tempo: '20X1', reps, pct: WAVE_PCT[reps] }; }
  if (week === 12) return { kind: 'max' };
  return { kind: 'percent', sets: 3, reps: 5, pct: 0.75 };
}
export const squatScheme = week => squatLike(week, [6, 4, 2, 5, 3]);
export const frontSquatScheme = week => squatLike(week, [6, 4, 5, 2, 3]);

const LADDERS = [[8, 7, 6], [7, 6, 5], [6, 5, 4], [5, 4, 3], [4, 3, 2], [3, 2, 1, 1]];
function ladder(week, deloadReps) {
  if (week === 13) return { kind: 'percent', sets: 3, reps: deloadReps, pct: 0.75 };
  const reps = LADDERS[(week - 1) % 6];
  const grip = week <= 6 ? 'doh' : week === 12 ? 'max' : 'hookOk';
  return { kind: 'ladder', reps, grip, phase: week <= 6 ? 'A' : 'B' };
}
export const deadliftScheme = week => ladder(week, 3);
export const pressScheme = week => ladder(week, 5);

export function cleanScheme(week) {
  if (week === 1 || week === 6 || week === 12) return { kind: 'single' };
  if (week === 2) return { kind: 'pctSingle', sets: 6, reps: 3, pct: 0.9, refWeek: 1 };
  if (week <= 5) return { kind: 'plusFive', sets: 5, reps: 3 };
  if (week === 7) return { kind: 'emom', minutes: 10, every: 60, reps: 3, pct: 0.6, refWeek: 6 };
  if (week <= 10) return { kind: 'emom', minutes: 10, every: 60, reps: 3 };
  if (week === 11) return { kind: 'emom', minutes: 15, every: 90, reps: 3 };
  return { kind: 'percent', sets: 3, reps: 3, pct: 0.6 };
}

// Rower: [meters, offset, rest] by week; week 1 (later cycles), 2..6, 8..10
const ROW = { 1: [400, 0, '1:30'], 2: [500, 0, '2:00'], 3: [600, 0, '2:00'], 4: [400, -2, '1:30'], 5: [500, -2, '2:00'], 6: [600, -2, '2:00'], 8: [400, 0, '1:30'], 9: [500, 0, '1:30'], 10: [600, 0, '2:00'] };
export function rowScheme(week, { firstCycle = false } = {}) {
  if (week === 1 && firstCycle) return { kind: 'tt' };
  if (week === 7 || week === 12) return { kind: 'primerTT' };
  if (week === 11) return { kind: 'ladder1200' };
  if (week === 13) return { kind: 'easy', minutes: 20 };
  const [meters, offset, rest] = ROW[week];
  return { kind: 'intervals', rounds: 12, meters, offset, rest };
}

// Air bike: [seconds, mult, rest]
const BIKE = { 1: [75, 1.05, '1:30'], 2: [90, 1.05, '2:00'], 3: [120, 1.05, '2:00'], 4: [75, 1.10, '1:30'], 5: [90, 1.10, '2:00'], 6: [120, 1.10, '2:00'], 8: [75, 1.05, '1:30'], 9: [90, 1.05, '1:30'], 10: [120, 1.05, '2:00'] };
export function bikeScheme(week, { firstCycle = false } = {}) {
  if (week === 1 && firstCycle) return { kind: 'tt' };
  if (week === 7 || week === 12) return { kind: 'primerTT' };
  if (week === 11) return { kind: 'ladder4min' };
  if (week === 13) return { kind: 'easy', minutes: 20 };
  const [seconds, mult, rest] = BIKE[week];
  return { kind: 'intervals', rounds: 12, seconds, mult, rest };
}

const RUN = ['R1', 'R2', 'R5', 'TT5K', 'R3', 'R4', 'R6', 'R1', 'TT5K', 'R2', 'R3', 'R4', 'TEST1_5'];
export const runFormat = week => RUN[week - 1];

export function densityFormat(week) {
  if (week <= 5) return { kind: 'emom', minutes: 16, work: 30 };
  if (week <= 10) return { kind: 'emom', minutes: 20, work: 30 };
  if (week <= 12) return { kind: 'e90', sets: 16, work: 45 };
  return { kind: 'tests' };
}

export function mmRounds(week) {
  if (week === 13) return 0;
  if (week <= 7) return 5;
  if (week <= 10) return 6;
  return week === 11 ? 8 : 7;
}
export const mmVest = week => week === 11 || week === 12;

const LONG_RUN = { 1: [40, 50, 60], 2: [60, 70, 75], 3: [75, 85, 90], 4: [90, 105, 120] };
const LONG_RUCK = { 1: [45, 55, 60], 2: [60, 70, 75], 3: [75, 85, 90], 4: [90, 105, 120] };
export const isLongRunWeek = week => week === 2 || week === 6 || week === 10;
export const isLongRuckWeek = week => week === 4 || week === 8 || week === 12;
export function longDuration(cycle, week) {
  let w = week % 2 === 0 ? week : Math.max(2, week - 1);
  if (w > 12) w = 12;
  const table = isLongRunWeek(w) ? LONG_RUN : LONG_RUCK;
  const idx = isLongRunWeek(w) ? [2, 6, 10].indexOf(w) : [4, 8, 12].indexOf(w);
  return table[cycle][idx];
}

export function zone2Minutes(cycle, week) {
  if (week === 13) return 30;
  const start = [40, 45, 50, 55][cycle - 1];
  return Math.min(60, start + 2 * (week - 1));
}

export const ruckLoad = cycle => [35, 45, 50, 55][cycle - 1];
export const ruckTestMiles = cycle => (cycle <= 2 ? 3 : 4);

export function pressLiftFor(cycle, phase) {
  const benchFirst = cycle % 2 === 1;
  return (phase === 'A') === benchFirst ? 'bench' : 'ohp';
}
export const cleanVariantFor = cycle => (cycle % 2 === 1 ? 'hpc' : 'pc');
