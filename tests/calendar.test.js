import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayInfo, DAY_NAMES } from '../js/calendar.js';

test('day 1', () => {
  assert.deepEqual(dayInfo(1), { n: 1, cycle: 1, week: 1, dow: 1, phase: 'A', rest: false, graduation: false });
});
test('day 43 is cycle 1 week 7 day 1 phase B', () => {
  const d = dayInfo(43);
  assert.equal(d.week, 7); assert.equal(d.dow, 1); assert.equal(d.phase, 'B');
});
test('day 91 is deload rest day', () => {
  const d = dayInfo(91);
  assert.equal(d.week, 13); assert.equal(d.dow, 7); assert.equal(d.phase, 'D'); assert.equal(d.rest, true);
});
test('day 92 starts cycle 2', () => assert.equal(dayInfo(92).cycle, 2));
test('day 364 is cycle 4 week 13 day 7', () => {
  const d = dayInfo(364);
  assert.equal(d.cycle, 4); assert.equal(d.week, 13); assert.equal(d.dow, 7);
});
test('day 365 is graduation', () => {
  const d = dayInfo(365);
  assert.equal(d.phase, 'G'); assert.equal(d.graduation, true); assert.equal(d.rest, true);
});
test('out of range throws', () => {
  assert.throws(() => dayInfo(0), RangeError);
  assert.throws(() => dayInfo(366), RangeError);
});
test('day names', () => assert.equal(DAY_NAMES.length, 7));
