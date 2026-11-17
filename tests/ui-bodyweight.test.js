import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers/fakedom.js';

const { document, findAll, text } = installFakeDom();
const { createApp } = await import('../js/main.js');
const { trendText } = await import('../js/nutrition.js');

function fresh() {
  globalThis.localStorage.removeItem('bhl-year-v1');
  const app = createApp(document);
  app.route = 'today';
  return app;
}
function onBodyweight() { const app = fresh(); app.store.switchPath('bodyweight'); return app; }
const view = () => text(document.getElementById('view'));
const typeInto = (placeholder, v) => { const i = findAll('input.in').find(x => x.attrs.placeholder === placeholder); assert.ok(i, `no input with placeholder ${placeholder}`); i.input(v); };
const clickCta = () => findAll('button.cta')[0].click();
const programSelect = () => findAll('select').find(s => s.children.some(o => text(o) === 'Bodyweight'));
const ALL = ['today', 'days', 'scorecard', 'settings'];

test('bodyweight days 1 to 400 render with every block opened', () => {
  const app = onBodyweight();
  const errs = [];
  for (let n = 1; n <= 400; n++) {
    app.ui.peekDay = n; app.ui.openKey = null;
    try { app.render(); } catch (e) { errs.push(`d${n}: ${e.message}`); continue; }
    if (text(findAll('.day')[0]) !== `Day ${n}`) errs.push(`d${n}: header shows ${text(findAll('.day')[0])}`);
    for (const k of findAll('.letter').map(l => l.children[0]?.data)) { app.ui.openKey = k; try { app.render(); } catch (e) { errs.push(`d${n} ${k}: ${e.message}`); } }
  }
  assert.deepEqual(errs.slice(0, 5), [], `${errs.length} render errors`);
});
test('today shows the week line, the brief and the day target', () => {
  const app = onBodyweight();
  app.ui.openKey = 'A'; app.render();
  assert.match(view(), /Week 1 · Building reps · ~35 min/);
  assert.doesNotMatch(view(), /Cycle/);
  assert.equal(findAll('.brief').length, 1);
  assert.match(text(findAll('.brief')[0]), /pair/i);
  assert.match(view(), /6 moves, done in pairs · steps · 1 optional/);
  assert.match(view(), /0 of 7 blocks marked done/);
  assert.doesNotMatch(view(), /in order|rotation/);
  assert.match(text(findAll('.target')[0]), /25 reps · 3 s down, 3 s up/);
  assert.equal(findAll('.bar')[0].attrs.title, '0% of the first 8 weeks');
});
test('a full-body day labels its three pairs and what comes after them', () => {
  const app = onBodyweight();
  app.render();
  assert.deepEqual(findAll('.group-h').map(text), ['Pair 1', 'Pair 2', 'Pair 3', 'Also today']);
  assert.deepEqual(findAll('.name').map(text), ['Pull-Ups', 'Push-Ups', 'Bulgarian Split Squats', 'Hanging Knee Raises', 'Overhead Press', 'Calf Raises', 'Steps', 'Cardio']);
  assert.deepEqual(findAll('.fig').map(text), ['25 total', '25 per leg', '25 total', '25 total', '25 total', 'Goal: 10,000 steps', '']);   // A is open
  app.store.setCurrentDay(2); app.render();
  assert.equal(findAll('.group-h').length, 0);
});
test('a rest day has a steps box, an optional cardio block and no brief', () => {
  const app = onBodyweight();
  app.store.setCurrentDay(2); app.ui.openKey = 'A'; app.render();
  assert.equal(findAll('.brief').length, 0);
  typeInto('steps', '8200');
  assert.equal(app.store.getLog(2).blocks.A.reps, 8200);
  assert.match(view(), /Week 1 · Building reps/);
  assert.match(view(), /Rest day · 1 optional block/);
  assert.doesNotMatch(view(), /~0 min|undefined/);
});
test('a class day lists the class, steps and a pick-one optional cardio block', () => {
  const app = onBodyweight();
  app.store.setCurrentDay(3); app.ui.openKey = 'C'; app.render();
  assert.match(view(), /Jiu-Jitsu Class/);
  assert.match(view(), /2 blocks to do · 1 optional/);
  assert.doesNotMatch(view(), /in order/);
  assert.deepEqual(findAll('.tag').map(text), ['Optional']);
  const chips = () => findAll('button.chip');
  assert.deepEqual(chips().map(text), ['✓ Easy', 'Steady', 'Intervals']);
  assert.match(view(), /hold a conversation/);
  chips().find(c => text(c) === 'Intervals').click();
  assert.deepEqual(chips().map(text), ['Easy', 'Steady', '✓ Intervals']);
  assert.match(view(), /8 rounds/);
  typeInto('min', '16');
  assert.equal(app.store.getLog(3).blocks.C.duration, 16);
  app.store.setCurrentDay(2); app.ui.openKey = 'B'; app.render();          // the choice is remembered on the next cardio block
  assert.deepEqual(chips().map(text), ['Easy', 'Steady', '✓ Intervals']);
});
test('speed is held while reps build, then a met target slows the same move next time', () => {
  const app = onBodyweight();
  const pullups = () => { app.ui.peekDay = null; app.ui.openKey = 'A'; app.render(); return text(findAll('.target')[0]); };
  pullups(); typeInto('reps', '25'); clickCta();            // day 1: pull-ups, 25
  assert.equal(app.store.getLog(1).blocks.A.target, 25);
  app.store.setCurrentDay(6);                               // day 6: pull-ups again
  assert.match(pullups(), /25 reps · 3 s down, 3 s up/);
  app.store.setCurrentDay(57);                              // week 9: the target is 35 from here on
  assert.match(pullups(), /35 reps · 3 s down, 3 s up/);
  typeInto('reps', '35'); clickCta();
  app.store.setCurrentDay(62);                              // the next pull-up day
  assert.match(pullups(), /35 reps · 4 s down, 4 s up/);
});
test('the day counter runs past 365 on bodyweight', () => {
  const app = onBodyweight();
  app.store.setCurrentDay(365); app.render(); clickCta();
  assert.equal(app.store.settings().currentDay, 366);
  app.render();
  assert.match(view(), /Day 366/);
  assert.match(view(), /Week 53 · Slow reps/);
  assert.match(view(), /Rest day · 1 optional block/);
  assert.equal(findAll('.bar').length, 0);
});
test('the Settings select switches programs and hides bhl-only settings', () => {
  const app = fresh();
  app.route = 'settings'; app.render();
  assert.match(view(), /Equipment/);
  assert.match(view(), /Each program keeps its own day and log/);
  programSelect().change('bodyweight');
  assert.equal(app.store.settings().path, 'bodyweight');
  assert.doesNotMatch(view(), /Equipment|Advanced/);
  assert.doesNotMatch(view(), /Mike/);
});
test('Settings accepts a day past 365 only on the open-ended program', () => {
  const app = fresh();
  app.route = 'settings'; app.render();
  const setDay = v => { const i = findAll('input.in').find(x => x.attrs.placeholder === 'Day'); i.value = v; findAll('button.btn').find(b => text(b) === 'Set').click(); };
  setDay('500');
  assert.equal(app.store.settings().currentDay, 1);
  programSelect().change('bodyweight');
  setDay('500');
  assert.equal(app.store.settings().currentDay, 500);
});
test('switching back to bhl from a late bodyweight day renders every screen', () => {
  const app = onBodyweight();
  app.store.setCurrentDay(400); app.ui.peekDay = 400;
  for (const r of ALL) { app.route = r; app.render(); }
  app.route = 'settings'; app.render();
  programSelect().change('bhl');
  for (const r of ALL) { app.route = r; app.render(); }
  assert.equal(app.store.settings().currentDay, 1);
  assert.match(view(), /Equipment/);
});
test('days view lists bodyweight weeks beyond the current day', () => {
  const app = onBodyweight();
  app.route = 'days'; app.render();
  assert.match(view(), /Building reps/);
  assert.doesNotMatch(view(), /Cycle|Graduation|Slow reps|First 12 weeks|One part a day/);
  assert.equal(findAll('.item').length, 56);
  assert.match(text(findAll('.item')[0]), /Day 1Full Body/);
  assert.match(text(findAll('.item')[2]), /Day 3Jiu-Jitsu/);
  app.store.setCurrentDay(400); app.render();
  assert.match(view(), /Slow reps/);
  assert.equal(findAll('.item').length, 434);
});
test('the bhl days view still lists the year', () => {
  const app = fresh();
  app.route = 'days'; app.render();
  assert.equal(findAll('.item').length, 365);
  assert.match(view(), /Cycle 4/);
});
test('scorecard lists logged slow-rep moves on bodyweight only', () => {
  const app = fresh();
  app.route = 'scorecard'; app.render();
  assert.doesNotMatch(view(), /Slow-rep moves/);
  app.store.switchPath('bodyweight'); app.render();
  assert.match(view(), /Log a session and your moves appear here/);
  app.store.logBlock(1, 'C', { slotKey: 'bw.f.splitsquat', reps: 40, target: 25 });
  app.store.setCurrentDay(2); app.render();
  const row = () => findAll('tr').map(text).find(t => /Bulgarian Split Squats/.test(t));
  assert.match(row(), /3 s40 per leg40 per leg/);             // weeks 1-8: speed is held however many reps were logged
  assert.doesNotMatch(view(), /Log a session and your moves appear here|First 12 weeks|One part a day/);
  app.store.setCurrentDay(57); app.render();
  assert.match(row(), /4 s40 per leg40 per leg/);             // week 9 on: 40 met the 35 target
});
test('the goal projection has no day-365 wording on an open-ended path', () => {
  const tr = { avg7: 270, rate: 0.5 };
  assert.match(trendText(tr, 220, 10), /past Day 365/);
  assert.match(trendText(tr, 220, 10, 365), /past Day 365/);
  assert.match(trendText(tr, 220, 10, Infinity), /220 lb around Day 710/);
});

// ----- from the final review -----
test('trying Bodyweight does not relabel the BHL scorecard columns', () => {
  const app = fresh();
  app.store.recordTest('row2k', 450, 1);
  app.route = 'scorecard'; app.render();
  const heads = () => findAll('th').map(text);
  assert.deepEqual(heads().slice(0, 3), ['Test', 'C1', 'Best']);
  app.store.switchPath('bodyweight'); app.store.switchPath('bhl'); app.render();
  assert.deepEqual(heads().slice(0, 3), ['Test', 'C1', 'Best']);
  app.store.startRun(); app.store.recordTest('row2k', 440, 1); app.render();
  assert.deepEqual(heads().slice(0, 4), ['Test', 'R1·C1', 'R2·C1', 'Best']);
});
test('Start over says which program restarts and what is lost', () => {
  const asked = []; const realConfirm = globalThis.confirm;
  globalThis.confirm = msg => { asked.push(msg); return false; };
  try {
    const app = fresh(); app.route = 'settings'; app.render();
    const startOver = () => findAll('button.btn').find(b => text(b) === 'Start over at Day 1').click();
    startOver();
    programSelect().change('bodyweight'); startOver();
  } finally { globalThis.confirm = realConfirm; }
  assert.match(asked[0], /stays on the Scorecard/);
  assert.match(asked[1], /Restart Bodyweight at Day 1/);
  assert.match(asked[1], /BHL Year is not affected/);
  assert.doesNotMatch(asked[1], /stays on the Scorecard/);
});
test('restoring an old backup from a late Bodyweight day lands on the backup day', () => {
  const old = fresh(); old.store.setCurrentDay(12);
  const backup = JSON.parse(old.store.exportJSON());
  delete backup.settings.path; delete backup.paths; for (const r of backup.runs) delete r.path;
  const app = onBodyweight(); app.store.setCurrentDay(400); app.ui.peekDay = 400;
  app.route = 'settings'; app.render();
  findAll('textarea')[0].value = JSON.stringify(backup);
  findAll('button.btn').find(b => text(b) === 'Restore pasted backup').click();
  app.route = 'today'; app.render();
  assert.equal(app.store.settings().path, 'bhl');
  assert.equal(text(findAll('.day')[0]), 'Day 12');
});
test('a mistyped huge day number is refused', () => {
  const app = onBodyweight();
  app.route = 'settings'; app.render();
  const setDay = v => { const i = findAll('input.in').find(x => x.attrs.placeholder === 'Day'); i.value = v; findAll('button.btn').find(b => text(b) === 'Set').click(); };
  setDay('100000');
  assert.equal(app.store.settings().currentDay, 1);
  setDay('3650');
  assert.equal(app.store.settings().currentDay, 3650);
  app.store.setCurrentDay(1); app.route = 'days'; app.render();
  const jump = findAll('input.in').find(x => x.attrs.placeholder === 'Day #'); jump.value = '9999999';
  findAll('button.btn').find(b => text(b) === 'Go').click();
  assert.equal(app.ui.peekDay, null);
});
