import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers/fakedom.js';

const { document, findAll, text } = installFakeDom();
const { createApp } = await import('../js/main.js');

function fresh() {
  globalThis.localStorage.removeItem('bhl-year-v1');
  const app = createApp(document);
  app.route = 'today';
  return app;
}
const typeInto = (placeholder, v) => { const i = findAll('input.in').find(x => x.attrs.placeholder === placeholder); assert.ok(i, `no input with placeholder ${placeholder}`); i.input(v); };
const clickCta = () => findAll('button.cta')[0].click();

test('every day renders in base and advanced mode with every block opened', () => {
  const app = fresh();
  const errs = [];
  for (const advanced of [false, true]) {
    app.store.updateSettings({ advanced });
    for (let n = 1; n <= 365; n++) {
      app.ui.peekDay = n; app.ui.openKey = null;
      try { app.render(); } catch (e) { errs.push(`d${n} adv=${advanced}: ${e.message}`); continue; }
      const letters = findAll('.letter').map(l => l.children[0]?.data);
      for (const k of letters) { app.ui.openKey = k; try { app.render(); } catch (e) { errs.push(`d${n} ${k} adv=${advanced}: ${e.message}`); } }
    }
  }
  assert.deepEqual(errs.slice(0, 5), [], `${errs.length} render errors`);
});

test('typing only weights on a ladder still seeds next week start', () => {
  const app = fresh();
  app.store.setCurrentDay(2); app.render();
  app.ui.openKey = 'A'; app.render();
  const ins = findAll('input.in').filter(i => i.parent._cls.has('set'));   // set rows only, not the scale weigh-in
  ins[0].input('315'); ins[2].input('335'); ins[4].input('355');
  clickCta();
  app.store.setCurrentDay(9); app.ui.peekDay = null; app.ui.openKey = 'A'; app.render();
  assert.match(text(findAll('.target')[0]), /Start set of 7 at 335 lb/);
});

test('a test value typed after marking done is recorded, and Complete Day sweeps tests', () => {
  const app = fresh();
  app.render();
  app.ui.openKey = 'C'; app.render();
  findAll('button.check')[2].click();            // done first, no time yet
  app.ui.openKey = 'C'; app.render();
  typeInto('m:ss', '728');
  assert.deepEqual(app.store.state.tests.row2k?.map(t => t.value), [448]);
  typeInto('m:ss', '725');
  assert.deepEqual(app.store.state.tests.row2k?.map(t => t.value), [445]);

  const app2 = fresh();
  app2.render(); app2.ui.openKey = 'C'; app2.render();
  typeInto('m:ss', '730');                        // never toggles done
  clickCta();
  assert.deepEqual(app2.store.state.tests.row2k?.map(t => t.value), [450]);
});

test('settings status message survives the re-render after saving a backup', async () => {
  const app = fresh();
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true });
  app.route = 'settings'; app.render();
  const save = findAll('button.btn').find(b => text(b) === 'Save a backup');
  save.click();
  await new Promise(r => setTimeout(r, 10));
  assert.match(text(document.getElementById("view")), /Downloaded\.|Copied to clipboard/);
  assert.ok(app.store.settings().lastExportAt, 'lastExportAt stamped after a successful copy');
});

test('settings macro card has no personal comparison column', () => {
  const app = fresh();
  app.store.updateSettings({ bodyweight: 200 });
  app.route = 'settings'; app.render();
  const t = text(document.getElementById('view'));
  assert.doesNotMatch(t, /Mike/);
  assert.doesNotMatch(t, /original/);
  assert.match(t, /You \(200 lb\)/);
});
