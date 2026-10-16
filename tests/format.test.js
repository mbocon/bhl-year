import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundLoad, parseTime, fmtTime, splitFrom2k, pacePerKm, fmtPace, hrRange, maxHRFrom, lbToKg, kgToLb } from '../js/format.js';

test('roundLoad', () => {
  assert.equal(roundLoad(263, 'lb'), 265);
  assert.equal(roundLoad(262, 'lb'), 260);
  assert.equal(roundLoad(101.3, 'kg'), 102.5);
});
test('parseTime accepts the four common forms', () => {
  for (const s of ['7:28', '07:28', '7.28', '728']) assert.equal(parseTime(s), 448, s);
  assert.equal(parseTime('12:05'), 725);
  assert.equal(parseTime('1205'), 725);
});
test('parseTime rejects garbage', () => {
  for (const s of ['abc', '', ':', '7:', '7:99']) assert.equal(parseTime(s), null, JSON.stringify(s));
});
test('fmtTime', () => {
  assert.equal(fmtTime(448), '7:28');
  assert.equal(fmtTime(65), '1:05');
});
test('split and pace', () => {
  assert.equal(splitFrom2k(448), 112);
  assert.equal(fmtPace(112, '/500m'), '1:52 /500m');
  assert.equal(pacePerKm(1320), 264);
  assert.equal(fmtPace(264, '/km'), '4:24 /km');
});
test('hr', () => {
  assert.deepEqual(hrRange(190), [124, 143]);
  assert.equal(maxHRFrom({ maxHR: 185, age: 40 }), 185);
  assert.equal(maxHRFrom({ age: 40 }), 180);
  assert.equal(maxHRFrom({}), null);
});
test('unit conversion round trip', () => {
  assert.equal(Math.round(lbToKg(100) * 1000) / 1000, 45.359);
  assert.equal(Math.round(kgToLb(lbToKg(225))), 225);
});
