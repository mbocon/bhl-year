import { test } from 'node:test';
import assert from 'node:assert/strict';
import { macros, MIKE_EXAMPLE } from '../js/nutrition.js';
import { BENCHMARKS } from '../js/benchmarks.js';

test('macros at 200 lb reproduce Mike-scale numbers', () => {
  assert.deepEqual(macros(200), { kcal: 2800, protein: 200, fat: 54, carbs: 379 });
  assert.equal(macros(0), null);
  assert.equal(macros(NaN), null);
});
test('example constant', () => {
  assert.equal(MIKE_EXAMPLE.kcal, 2800);
  assert.equal(MIKE_EXAMPLE.protein, 180);
});
test('benchmarks', () => {
  const row = BENCHMARKS.find(b => b.test === 'row2k');
  assert.deepEqual([row.solid, row.strong, row.elite], [480, 450, 420]);
  assert.equal(row.lowerIsBetter, true);
  assert.equal(BENCHMARKS.find(b => b.test === 'pullupsMax').elite, 20);
  assert.equal(BENCHMARKS.find(b => b.test === 'run1_5mi').strong, 630);
  assert.equal(BENCHMARKS.find(b => b.test === 'ruck4mi').elite, 55 * 60);
  const bs = BENCHMARKS.find(b => b.test === 'max_backsquat');
  assert.equal(bs.unit, 'xBW');
  assert.equal(bs.solid, 1.5);
  for (const b of BENCHMARKS) assert.ok(b.test && b.label && b.unit && typeof b.lowerIsBetter === 'boolean', b.test);
});
test('macroPlan eats for the goal weight when one is set, otherwise the current weight', async () => {
  const { macroPlan } = await import('../js/nutrition.js');
  assert.deepEqual(macroPlan({ bodyweight: 273, goalWeight: 220 }), { basis: 'goal', weight: 220, adjust: 0, kcal: 3080, protein: 220, fat: 59, carbs: 417 });
  assert.deepEqual(macroPlan({ bodyweight: 200 }), { basis: 'current', weight: 200, adjust: 0, kcal: 2800, protein: 200, fat: 54, carbs: 379 });
  assert.equal(macroPlan({ goalWeight: 220 }).basis, 'goal');
  assert.equal(macroPlan({}), null);
  assert.equal(macroPlan({ bodyweight: 273, goalWeight: 0 }).basis, 'current');
});
