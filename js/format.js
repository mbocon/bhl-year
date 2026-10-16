// Rounding, time parsing/formatting, pace and heart-rate helpers. Pure.

const LB_PER_KG = 1 / 0.45359237;

export function roundLoad(w, units = 'lb') {
  const step = units === 'kg' ? 2.5 : 5;
  return Math.round(w / step) * step;
}

/** Accepts m:ss, mm:ss, m.ss, and 3–4 digit mss/mmss. Returns seconds or null. */
export function parseTime(s) {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  let m, sec;
  let match;
  if ((match = /^(\d{1,2})[:.](\d{2})$/.exec(t))) {
    m = Number(match[1]); sec = Number(match[2]);
  } else if ((match = /^(\d{1,2})(\d{2})$/.exec(t))) {
    m = Number(match[1]); sec = Number(match[2]);
  } else {
    return null;
  }
  if (sec > 59) return null;
  return m * 60 + sec;
}

export function fmtTime(totalSec) {
  const s = Math.round(totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export const splitFrom2k = sec2k => sec2k / 4;
export const pacePerKm = sec5k => sec5k / 5;

export function fmtPace(secPerUnit, unit) {
  return `${fmtTime(secPerUnit)} ${unit}`;
}

export function hrRange(maxHR) {
  return [Math.round(0.65 * maxHR), Math.round(0.75 * maxHR)];
}

export function maxHRFrom({ maxHR, age } = {}) {
  if (Number.isFinite(maxHR) && maxHR > 0) return maxHR;
  if (Number.isFinite(age) && age > 0) return 220 - age;
  return null;
}

export const lbToKg = lb => lb / LB_PER_KG;
export const kgToLb = kg => kg * LB_PER_KG;
