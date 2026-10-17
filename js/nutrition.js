// Macro guideline that generalizes the diet Mike paired with BHL (spec §5.7), plus the scale-weight trend and the
// automatic 14-day calorie review. Guidance, not medical advice. Pure functions; dates are 'YYYY-MM-DD' strings.

export const MIKE_EXAMPLE = { kcal: 2800, protein: 180, fat: '50–60', carbs: 395 };

export function macros(bodyweightLb, adjust = 0) {
  if (!Number.isFinite(bodyweightLb) || bodyweightLb <= 0) return null;
  const kcal = Math.round(14 * bodyweightLb) + adjust;
  const protein = Math.round(1.0 * bodyweightLb);
  const fat = Math.round(0.27 * bodyweightLb);
  const carbs = Math.round((kcal - 4 * protein - 9 * fat) / 4);   // reviews move calories through carbs only
  return { kcal, protein, fat, carbs };
}

/** Eat for the body you are building: the goal weight when set (with any review adjustment), otherwise the current weight. */
export function macroPlan(s = {}, nutrition = null) {
  const goal = Number.isFinite(s.goalWeight) && s.goalWeight > 0 ? s.goalWeight : null;
  const weight = goal ?? (Number.isFinite(s.bodyweight) && s.bodyweight > 0 ? s.bodyweight : null);
  if (!weight) return null;
  const adjust = goal && nutrition && Number.isFinite(nutrition.kcalAdjust) ? nutrition.kcalAdjust : 0;
  return { basis: goal ? 'goal' : 'current', weight, adjust, ...macros(weight, adjust) };
}

// ---------- dates ----------
const DAY = 86400e3;
const pad = n => String(n).padStart(2, '0');
export const isoDate = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const utc = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const addDays = (iso, n) => new Date(utc(iso) + n * DAY).toISOString().slice(0, 10);
export const fmtISO = iso => new Date(utc(iso) + 12 * 3600e3).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const todayOf = app => (app && app.today ? app.today() : isoDate(app && app.now ? app.now() : Date.now()));

// ---------- scale weight trend ----------
const round1 = x => Math.round(x * 10) / 10;
const round2 = x => Math.round(x * 100) / 100;
function windowAvg(weights, endISO, days) {
  let sum = 0; let n = 0;
  for (let i = 0; i < days; i++) { const v = weights[addDays(endISO, -i)]; if (Number.isFinite(v)) { sum += v; n++; } }
  return { avg: n ? sum / n : null, n };
}
/** 7-day average ending today against the 7 days before. rate = lb lost per week (positive = losing). null until 3 weigh-ins this week. */
export function weightTrend(weights = {}, todayISO) {
  const last = windowAvg(weights, todayISO, 7);
  if (last.n < 3) return null;
  const prev = windowAvg(weights, addDays(todayISO, -7), 7);
  return { avg7: round1(last.avg), n7: last.n, prevAvg7: prev.n ? round1(prev.avg) : null, nPrev7: prev.n, rate: prev.n >= 3 ? round2(prev.avg - last.avg) : null };
}
export function projectGoalDay(trend, goalWeight, day) {
  if (!trend || !Number.isFinite(goalWeight) || !Number.isFinite(trend.rate) || trend.rate <= 0 || trend.avg7 <= goalWeight) return null;
  return day + Math.round((trend.avg7 - goalWeight) / (trend.rate / 7));
}
export function trendText(trend, goalWeight, day) {
  if (!trend) return null;
  let s = `7-day avg ${trend.avg7} lb`;
  if (trend.rate !== null) s += ` · ${trend.rate >= 0 ? 'losing' : 'gaining'} ${Math.abs(trend.rate).toFixed(1)} lb/wk`;
  const d = projectGoalDay(trend, goalWeight, day);
  if (d) s += d <= 365 ? ` · ${goalWeight} lb around Day ${d}` : ` · ${goalWeight} lb is past Day 365 at this pace`;
  return s;
}

// ---------- automatic review ----------
export const REVIEW = { skipDays: 28, everyDays: 14, minPerWeek: 4, slow: 0.7, fast: 2.0, step: 150, floorKcal: 2400 };
export function firstWeighIn(weights = {}) {
  const ks = Object.keys(weights).filter(k => Number.isFinite(weights[k])).sort();
  return ks[0] || null;
}
export function nextReviewISO(nutrition, weights) {
  if (nutrition && nutrition.lastReviewISO) return addDays(nutrition.lastReviewISO, REVIEW.everyDays);
  const first = firstWeighIn(weights);
  return first ? addDays(first, REVIEW.skipDays) : null;
}
/** Decide today's review. Returns { status: off | waiting | hold | cut | add, ... } and, when one is due and decidable, a `review` to record. */
export function planReview({ settings, nutrition, weights, todayISO, day }) {
  const plan = macroPlan(settings, nutrition);
  if (!plan || plan.basis !== 'goal') return { status: 'off' };
  const nextISO = nextReviewISO(nutrition, weights);
  if (!nextISO || todayISO < nextISO) return { status: 'waiting', nextISO };
  const trend = weightTrend(weights, todayISO);
  if (!trend || trend.n7 < REVIEW.minPerWeek || trend.nPrev7 < REVIEW.minPerWeek) return { status: 'waiting', nextISO, needData: true, trend };
  const atGoal = trend.avg7 <= settings.goalWeight;
  let delta = 0;
  if (!atGoal) { if (trend.rate < REVIEW.slow) delta = -REVIEW.step; else if (trend.rate > REVIEW.fast) delta = REVIEW.step; }
  const kcal = Math.max(REVIEW.floorKcal, plan.kcal + delta);
  delta = kcal - plan.kcal;
  const status = delta < 0 ? 'cut' : delta > 0 ? 'add' : 'hold';
  return { status, delta, kcal, trend, atGoal, nextISO, review: { dateISO: todayISO, day, rate: trend.rate, avg7: trend.avg7, delta, kcal, atGoal } };
}
