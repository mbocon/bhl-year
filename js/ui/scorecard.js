// Scorecard: tests by run × cycle, all-time bests, benchmarks, lift estimates.
import { h, clear } from './dom.js';
import { BENCHMARKS } from '../benchmarks.js';
import { dayInfo } from '../calendar.js';
import { fmtTime } from '../format.js';
import { estimate1RM, fmtLoad } from '../engine.js';

const LIFTS = ['backsquat', 'frontsquat', 'deadlift', 'bench', 'ohp', 'clean'];
const LIFT_LABEL = { backsquat: 'Back squat', frontsquat: 'Front squat', deadlift: 'Deadlift', bench: 'Bench press', ohp: 'Overhead press', clean: 'Clean' };

function fmtValue(b, v, settings) {
  if (v === null || v === undefined) return '—';
  if (b.unit === 'time') return fmtTime(v);
  if (b.unit === 'xBW') {
    const bw = settings.bodyweight;
    const load = fmtLoad(v, settings.units);
    return bw ? `${load} (${(v / bw).toFixed(2)}×)` : load;
  }
  return String(v);
}
function fmtThreshold(b, v) {
  if (v === null || v === undefined) return '—';
  if (b.unit === 'time') return fmtTime(v);
  if (b.unit === 'xBW') return `${v}× BW`;
  return String(v);
}
function better(b, a, c) { if (a === null) return c; if (c === null) return a; return b.lowerIsBetter ? Math.min(a, c) : Math.max(a, c); }

export function renderScorecard(root, app) {
  const { store } = app;
  const settings = store.settings();
  const runs = store.state.runs;
  const runIndex = Object.fromEntries(runs.map((r, i) => [r.id, i + 1]));
  clear(root);
  root.append(h('header', { class: 'hdr' }, h('div', { class: 'day' }, 'Scorecard'), h('div', { class: 'meta' }, 'Same tests every cycle. Watch them move.')));

  // columns: run × cycle that have any entry
  const colSet = new Map();
  for (const list of Object.values(store.state.tests)) for (const t of list) {
    const key = `${t.runId}:${dayInfo(t.day).cycle}`;
    if (!colSet.has(key)) colSet.set(key, { runId: t.runId, cycle: dayInfo(t.day).cycle, label: `${runs.length > 1 ? 'R' + runIndex[t.runId] + '·' : ''}C${dayInfo(t.day).cycle}` });
  }
  const cols = [...colSet.values()].sort((a, b) => (runIndex[a.runId] - runIndex[b.runId]) || (a.cycle - b.cycle));

  const table = h('table', { class: 'sc' },
    h('thead', null, h('tr', null, h('th', null, 'Test'), ...cols.map(c => h('th', null, c.label)), h('th', null, 'Best'))),
    h('tbody', null, ...BENCHMARKS.map(b => {
      const entries = store.state.tests[b.test] || [];
      let best = null;
      const cells = cols.map(c => {
        let v = null;
        for (const t of entries) if (t.runId === c.runId && dayInfo(t.day).cycle === c.cycle) v = better(b, v, t.value);
        best = better(b, best, v);
        return h('td', null, fmtValue(b, v, settings));
      });
      const thr = [b.solid, b.strong, b.elite].filter(x => x !== null && x !== undefined).map(x => fmtThreshold(b, x)).join(' / ');
      return h('tr', null, h('td', null, b.label, thr ? h('div', { class: 'muted' }, thr) : null), ...cells, h('td', null, h('b', null, fmtValue(b, best, settings))));
    })));
  root.append(h('div', { class: 'section' }, h('h2', null, 'Tests'), h('div', { class: 'scroll-x' }, table),
    h('p', { class: 'muted' }, 'Grey line under each test: solid / strong / elite reference marks. Motivational, not requirements.')));

  const lifts = h('div', { class: 'list' }, ...LIFTS.map(l => {
    const e = estimate1RM(store.history.liftEvidence(l), { now: app.now() });
    const bw = settings.bodyweight;
    return h('div', { class: 'item', style: 'cursor:default' }, h('span', { class: 't' }, LIFT_LABEL[l]),
      h('span', null, e ? `${fmtLoad(e, settings.units)}${bw ? ` · ${(e / bw).toFixed(2)}× BW` : ''}` : '—'));
  }));
  root.append(h('div', { class: 'section' }, h('h2', null, 'Estimated 1RMs (this run, last 6 weeks)'), lifts));
}
