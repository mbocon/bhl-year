// Day-number math for the 365-day program. Pure; safe in Node and browser.

export const DAY_NAMES = [
  'Squat + Intervals',
  'Hinge + Press + Work Capacity',
  'Run + Ruck',
  'Zone 2 + Pull + Press',
  'Clean + Front Squat + Intervals',
  'Long Easy',
  'Rest',
];

export const TOTAL_DAYS = 365;
export const CYCLE_DAYS = 91;

/**
 * @param {number} n 1..365
 * @returns {{n:number, cycle:number, week:number, dow:number, phase:'A'|'B'|'D'|'G', rest:boolean, graduation:boolean}}
 */
export function dayInfo(n) {
  if (!Number.isInteger(n) || n < 1 || n > TOTAL_DAYS) {
    throw new RangeError(`day out of range: ${n}`);
  }
  if (n === TOTAL_DAYS) {
    return { n, cycle: 4, week: 13, dow: 1, phase: 'G', rest: true, graduation: true };
  }
  const cycle = Math.ceil(n / CYCLE_DAYS);
  const dayInCycle = ((n - 1) % CYCLE_DAYS) + 1;
  const week = Math.ceil(dayInCycle / 7);
  const dow = ((n - 1) % 7) + 1;
  const phase = week <= 6 ? 'A' : week <= 12 ? 'B' : 'D';
  return { n, cycle, week, dow, phase, rest: dow === 7, graduation: false };
}
