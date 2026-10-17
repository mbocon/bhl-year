// What a block tells you to do (rx) is separate from how to do it (cues), and the Today view says what a day requires.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers/fakedom.js';

const { document, findAll, text } = installFakeDom();
const { createApp } = await import('../js/main.js');
const { session } = await import('../js/program/index.js');
const { resolveBlock } = await import('../js/engine.js');

const fresh = () => { globalThis.localStorage.removeItem('bhl-year-v1'); const app = createApp(document); app.route = 'today'; return app; };
const S = (n, extra = {}) => session(n, { ...fresh().store.settings(), ...extra });
const block = (n, key, extra) => S(n, extra).blocks.find(b => b.key === key);

test('coaching cues sit beside the prescription instead of inside it', () => {
  const plyo = block(1, 'A');
  assert.deepEqual(plyo.rx, ['5 × 3, rest 90 s']);
  assert.match(plyo.cues[0], /Step off, absorb/);
  const squat = block(1, 'B');
  assert.equal(squat.rx.length, 1);
  assert.match(squat.cues[0], /tempo and range of motion/);
  const z2 = block(4, 'A');
  assert.match(z2.rx[0], /^\d+ min easy/);
  assert.match(z2.cues[0], /Conversational/);
});

test('a compound block lists every required exercise as a prescription line', () => {
  const odd = block(3, 'C');
  assert.match(odd.name, /Sled Drag \+ Supine/);
  assert.equal(odd.rx.length, 2);
  assert.equal((odd.cues || []).length, 0);
});

test('circuit stations are items, not prescription lines', () => {
  const bw = block(2, 'D');
  assert.match(bw.name, /Bodyweight Circuit/);
  assert.equal(bw.rx.length, 1);
  assert.equal(bw.items.length, 4);
  assert.match(bw.items[0].text, /Inverted rows/);
});

test('resolveBlock carries the cues of the chosen option', () => {
  const machine = block(1, 'C');
  assert.match(resolveBlock(machine, 'rower').cues[0], /rowing paces/);
  assert.match(resolveBlock(machine, 'bike').cues[0], /bike paces/);
});

test('every block of every day has at least one prescription line and only string cues', () => {
  for (let n = 1; n <= 365; n++) for (const b of S(n, { advanced: true }).blocks) {
    assert.ok(b.rx.length >= 1 && b.rx.every(l => typeof l === 'string' && l), `day ${n} ${b.key} rx`);
    for (const c of b.cues || []) assert.ok(typeof c === 'string' && c, `day ${n} ${b.key} cue`);
  }
});

test('Today renders prescriptions at full weight, cues labelled, and choices labelled', () => {
  const app = fresh();
  app.ui.openKey = 'A'; app.render();
  assert.equal(findAll('.rx-line').length, 1);
  assert.equal(findAll('.cue').length, 1);
  assert.equal(text(findAll('.pick-k')[0]), 'Choose one');
  app.ui.peekDay = 3; app.ui.openKey = 'C'; app.render();
  assert.equal(findAll('.rx-line').length, 2);
  assert.equal(findAll('.cue').length, 0);
});

test('Today lists circuit stations with their alternatives marked "or"', () => {
  const app = fresh();
  app.ui.peekDay = 5; app.ui.openKey = 'C'; app.render();
  assert.equal(findAll('li').length, 4);
  assert.ok(findAll('.or').length >= 1);
  assert.equal(text(findAll('.or')[0]), 'or');
});

test('Today says how many blocks the day requires and how many are marked done', () => {
  const app = fresh();
  app.render();
  assert.match(text(findAll('.req')[0]), /4 blocks/);
  assert.match(text(findAll('.cta-note')[0]), /0 of 4/);
  findAll('button.check')[0].click();
  assert.match(text(findAll('.cta-note')[0]), /1 of 4/);
  app.store.updateSettings({ advanced: true }); app.render();
  assert.match(text(findAll('.req')[0]), /1 optional/);
  assert.ok(findAll('.tag').some(t => text(t) === 'Optional'));
});

test('a collapsed block with a long name keeps the whole name and drops the key figure', () => {
  const app = fresh();
  app.ui.peekDay = 3; app.ui.openKey = 'A'; app.render();
  const card = findAll('.card.collapsed').find(c => text(c).includes('Backward Sled Drag + Supine Sprint Starts'));
  assert.ok(card, 'collapsed compound block');
  assert.ok(card.querySelector('.name')._cls.has('wide'));
  assert.equal(card.querySelectorAll('.fig').length, 0);
  const short = findAll('.card.collapsed').find(c => text(c).includes('Ruck March'));
  assert.equal(short.querySelectorAll('.fig').length, 1);
});

test('Settings takes a goal weight and the macro card eats for it while the Scorecard keeps the real weight', () => {
  const app = fresh();
  app.route = 'settings'; app.render();
  const input = label => findAll('.field').find(f => text(f).startsWith(label)).querySelector('input.in');
  input('Bodyweight (lb)').change('273');
  input('Goal weight (lb)').change('220');
  assert.equal(app.store.settings().goalWeight, 220);
  assert.equal(app.store.settings().bodyweight, 273);
  const card = text(findAll('.card.plain')[0]);
  assert.match(card, /goal 220 lb/);
  assert.match(card, /3080/);
  assert.doesNotMatch(card, /3822/);
  app.store.upsertTest('max_backsquat', 315, 1);
  app.route = 'scorecard'; app.render();
  assert.match(text(findAll('table.sc')[0]), /1\.15×/);
});
