// Daily scale weight: logged by calendar date, trended by 7-day averages, reviewed every 14 days to adjust calories.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers/fakedom.js';

const { document, findAll, text } = installFakeDom();
const { createApp } = await import('../js/main.js');
const { weightTrend, planReview, macroPlan, isoDate, projectGoalDay, nextReviewISO } = await import('../js/nutrition.js');

const DAY = 86400e3;
const T0 = Date.UTC(2026, 10, 1, 12);
const iso = d => isoDate(T0 + d * DAY);
const series = (start, perDay, from, to, skip = []) => { const w = {}; for (let d = from; d <= to; d++) if (!skip.includes(d)) w[iso(d)] = +(start + perDay * d).toFixed(1); return w; };
const fresh = () => { globalThis.localStorage.removeItem('bhl-year-v1'); const app = createApp(document); app.route = 'today'; return app; };

test('weightTrend averages the last 7 days and compares with the 7 before', () => {
  const t = weightTrend(series(275, -0.15, 0, 13), iso(13));
  assert.equal(t.n7, 7); assert.equal(t.nPrev7, 7);
  assert.ok(Math.abs(t.rate - 1.05) < 0.06, String(t.rate));   // series values are rounded to 0.1 lb
  assert.ok(Math.abs(t.avg7 - 273.5) < 0.06, String(t.avg7));
  assert.equal(weightTrend(series(275, 0, 12, 13), iso(13)), null);
  assert.equal(weightTrend(series(275, 0, 9, 13), iso(13)).rate, null);
});

test('macroPlan folds the review adjustment into carbs only', () => {
  assert.deepEqual(macroPlan({ goalWeight: 220 }, { kcalAdjust: -150 }), { basis: 'goal', weight: 220, adjust: -150, kcal: 2930, protein: 220, fat: 59, carbs: 380 });
});

test('planReview waits 28 days, then every 14, needs 4 weigh-ins per week, and respects the floor', () => {
  const settings = { goalWeight: 220, bodyweight: 273 };
  const nut = { kcalAdjust: 0, lastReviewISO: null, log: [] };
  const slow = series(275, -0.05, 0, 27);
  assert.equal(planReview({ settings, nutrition: nut, weights: slow, todayISO: iso(20), day: 21 }).status, 'waiting');
  const r = planReview({ settings, nutrition: nut, weights: slow, todayISO: iso(28), day: 29 });
  assert.equal(r.status, 'cut'); assert.equal(r.delta, -150); assert.equal(r.kcal, 2930); assert.equal(r.review.day, 29);
  assert.equal(planReview({ settings, nutrition: nut, weights: series(275, -0.05, 0, 27, [21, 22, 23, 24]), todayISO: iso(28), day: 29 }).status, 'waiting');
  assert.equal(planReview({ settings, nutrition: nut, weights: series(275, -0.35, 0, 27), todayISO: iso(28), day: 29 }).delta, 150);
  assert.equal(planReview({ settings, nutrition: nut, weights: series(275, -0.15, 0, 27), todayISO: iso(28), day: 29 }).status, 'hold');
  assert.equal(planReview({ settings: { bodyweight: 273 }, nutrition: nut, weights: slow, todayISO: iso(28), day: 29 }).status, 'off');
  assert.equal(nextReviewISO({ kcalAdjust: -150, lastReviewISO: iso(28), log: [] }, slow), iso(42));
  const floored = planReview({ settings, nutrition: { kcalAdjust: -600, lastReviewISO: iso(14), log: [] }, weights: slow, todayISO: iso(28), day: 29 });
  assert.equal(floored.kcal, 2400); assert.equal(floored.delta, -80);
});

test('projectGoalDay extrapolates the weekly rate', () => {
  assert.equal(projectGoalDay({ avg7: 270, rate: 1.0 }, 220, 30), 380);
  assert.equal(projectGoalDay({ avg7: 270, rate: 0 }, 220, 30), null);
  assert.equal(projectGoalDay({ avg7: 219, rate: 1 }, 220, 30), null);
});

test('Today logs the scale weight for the calendar day; the trend and the Scorecard use the 7-day average', () => {
  const app = fresh();
  app.now = () => T0 + 13 * DAY;
  for (const [k, v] of Object.entries(series(275, -0.15, 0, 12))) app.store.logWeight(k, v);
  app.store.updateSettings({ bodyweight: 273, goalWeight: 220 });
  app.render();
  findAll('.weigh')[0].querySelector('input').change('273.0');
  assert.equal(app.store.weights()[iso(13)], 273);
  assert.match(text(findAll('.weigh')[0]), /7-day avg 273\.\d lb · losing 1\.\d lb\/wk/);
  app.store.upsertTest('max_backsquat', 315, 1);
  app.route = 'scorecard'; app.render();
  assert.match(text(findAll('table.sc')[0]), /1\.15×/);
});

test('a due review adjusts calories once, logs it, and the Settings card shows it', () => {
  const app = fresh();
  app.store.updateSettings({ bodyweight: 273, goalWeight: 220 });
  for (const [k, v] of Object.entries(series(275, -0.05, 0, 27))) app.store.logWeight(k, v);
  app.now = () => T0 + 28 * DAY;
  app.store.setCurrentDay(29);
  app.render(); app.render();
  assert.equal(app.store.nutrition().kcalAdjust, -150);
  assert.equal(app.store.nutrition().log.length, 1);
  assert.equal(app.store.nutrition().log[0].day, 29);
  app.route = 'settings'; app.render();
  const card = text(findAll('.card.plain')[0]);
  assert.match(card, /2930/); assert.match(card, /Day 29/); assert.match(card, /−150|-150/);
});

test('weights survive a new run and a backup round-trip, and old backups import without them', () => {
  const app = fresh();
  app.store.logWeight('2026-11-01', 272.4);
  app.store.startRun();
  assert.equal(app.store.weights()['2026-11-01'], 272.4);
  const json = app.store.exportJSON();
  const old = JSON.parse(json); delete old.weights; delete old.nutrition;
  assert.equal(app.store.importJSON(JSON.stringify(old)).ok, true);
  assert.deepEqual(app.store.weights(), {});
  assert.equal(app.store.nutrition().kcalAdjust, 0);
  assert.equal(app.store.importJSON(json).ok, true);
  assert.equal(app.store.weights()['2026-11-01'], 272.4);
  app.store.logWeight('2026-11-01', null);
  assert.equal(app.store.weights()['2026-11-01'], undefined);
});
