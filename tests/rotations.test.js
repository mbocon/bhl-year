import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  plyoFor, coreFor, singleLegFor, bwCircuitFor, mmWorkout, runFormatText, ruckFormat, wedOddFor,
  pullVariant, pullRx, armsRx, mobilityRx, intervalCombo, satCircuit, MACHINE_OPTIONS, visibleOptions,
} from '../js/program/rotations.js';

const EQUIP_KEYS = new Set(['box', 'rope', 'kb', 'rings', 'climbRope', 'hurdles', 'vest', 'slamBall']);
function assertOptions(opts, label) {
  assert.ok(Array.isArray(opts) && opts.length >= 1, label);
  for (const o of opts) {
    assert.ok(o.id && o.name && Array.isArray(o.needs), label + ' option shape');
    for (const n of o.needs) assert.ok(EQUIP_KEYS.has(n), `${label}: unknown equipment key ${n}`);
  }
}

test('plyo rotation and options', () => {
  const p1 = plyoFor(1);
  assert.match(p1.name, /Drop Jump/);
  assert.equal(plyoFor(7).name, p1.name);
  assert.equal(plyoFor(12).test, 'jumpMax');
  assert.equal(plyoFor(12).name, plyoFor(6).name);
  assert.ok(plyoFor(2).options.some(o => o.needs.includes('box')));
  assert.ok(plyoFor(2).options.some(o => o.needs.length === 0));
  assert.match(plyoFor(13).rx.join(' '), /3 × 3/);
  for (let w = 1; w <= 13; w++) { assertOptions(plyoFor(w).options, `plyo w${w}`); assert.ok(plyoFor(w).rx.length >= 1); }
});
test('core never coincides and rotates through 12', () => {
  const names = new Set();
  for (let w = 1; w <= 13; w++) {
    assert.notEqual(coreFor(1, w).name, coreFor(5, w).name, `week ${w}`);
    names.add(coreFor(1, w).name); names.add(coreFor(5, w).name);
  }
  assert.equal(names.size, 12);
});
test('single leg modes', () => {
  assert.equal(singleLegFor(1).mode, 'introduce');
  assert.equal(singleLegFor(2).mode, 'repeat');
  assert.equal(singleLegFor(2).id, singleLegFor(1).id);
  assert.equal(singleLegFor(3).mode, 'introduce');
  assert.notEqual(singleLegFor(3).id, singleLegFor(4).id);
  assert.equal(singleLegFor(7).mode, 'introduce');
  assert.equal(singleLegFor(8).mode, 'repeat');
  assert.equal(singleLegFor(12).mode, 'repeat');
  assert.equal(singleLegFor(13).mode, 'deload');
});
test('bw circuits alternate', () => {
  assert.equal(bwCircuitFor(1).id, 'A');
  assert.equal(bwCircuitFor(2).id, 'B');
  assert.equal(bwCircuitFor(1).stations.length, 4);
  assert.match(bwCircuitFor(2).stations[0], /Pull-up/i);
});
test('mm rotation', () => {
  assert.equal(mmWorkout(1).id, 'MM1');
  assert.equal(mmWorkout(8).id, 'MM8');
  assert.equal(mmWorkout(9).id, 'MM1');
  assert.ok(mmWorkout(2).items.some(i => i.options && i.options.some(o => o.needs.includes('climbRope'))));
  for (let w = 1; w <= 12; w++) for (const it of mmWorkout(w).items) { assert.ok(it.text); if (it.options) assertOptions(it.options, `mm w${w}`); }
});
test('run format text', () => {
  for (const c of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'TT5K', 'TEST1_5']) { const t = runFormatText(c); assert.ok(t.name && t.rx.length >= 1, c); }
  assert.match(runFormatText('TT5K').name, /5k/i);
});
test('ruck formats and wednesday odd work', () => {
  assert.notEqual(ruckFormat(1), ruckFormat(2));
  assert.equal(ruckFormat(1), ruckFormat(5));
  assert.match(wedOddFor(13).name, /Bird Dog/);
  for (let w = 1; w <= 13; w++) { const x = wedOddFor(w); assert.ok(x.name && x.rx.length >= 1); if (x.options) assertOptions(x.options, `wed w${w}`); }
});
test('day 4 pieces', () => {
  assert.equal(pullVariant(1), 'a'); assert.equal(pullVariant(2), 'b');
  assert.ok(pullRx('a').length >= 2); assert.ok(pullRx('b').length >= 2);
  assert.ok(armsRx().length >= 3); assert.ok(mobilityRx().length >= 1);
});
test('interval combos cover four categories', () => {
  for (let w = 1; w <= 13; w++) {
    const c = intervalCombo(w);
    assert.deepEqual(c.stations.map(s => s.category), ['jump', 'machine', 'loaded', 'crawl'], `week ${w}`);
    for (const s of c.stations) assertOptions(s.options, `interval w${w} ${s.category}`);
  }
  assert.notEqual(intervalCombo(1).stations[0].name, intervalCombo(2).stations[0].name);
});
test('sat circuits', () => {
  const s = satCircuit(1);
  assert.equal(s.circuits.length, 3);
  for (const c of s.circuits) assert.ok(c.length >= 3);
  assert.ok(s.coreEmom.length >= 2);
  assert.notEqual(satCircuit(1).circuits[0][0], satCircuit(3).circuits[0][0]);
});
test('machine options and visibleOptions', () => {
  assert.deepEqual(MACHINE_OPTIONS.map(o => o.id), ['rower', 'bike']);
  const opts = [{ id: 'a', name: 'A', needs: ['box'] }, { id: 'b', name: 'B', needs: [] }];
  assert.deepEqual(visibleOptions(opts, { box: false }).map(o => o.id), ['b']);
  assert.deepEqual(visibleOptions(opts, { box: true }).map(o => o.id), ['a', 'b']);
  assert.deepEqual(visibleOptions([{ id: 'a', name: 'A', needs: ['box'] }], { box: false }).map(o => o.id), ['a']);
  assert.deepEqual(visibleOptions(opts, {}).map(o => o.id), ['b']);
});
