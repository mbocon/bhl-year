// Today view: one-at-a-time layout (spec §5.2). Inputs write straight to the store without re-rendering.
import { h, clear } from './dom.js';
import { session } from '../program/index.js';
import { targets, defaultOptionId, resolveBlock } from '../engine.js';
import { visibleOptions } from '../program/rotations.js';
import { parseTime, fmtTime, roundLoad, lbToKg, kgToLb } from '../format.js';
import { go } from './router.js';

const DAY_MS = 86400e3;
const TOTAL = 365;

function heaviest(sets) {
  let best = null;
  for (const s of sets || []) if (s && Number.isFinite(s.w) && (!best || s.w > best.w)) best = s;
  return best;
}
/** The value a test block records, from what was logged; null when nothing valid is there. */
export function testValueFor(resolved, b) {
  const testId = resolved.test;
  if (!testId || !b) return null;
  if (testId.startsWith('max_')) return heaviest(b.sets)?.w ?? null;
  if (testId === 'jumpMax') return Number.isFinite(b.height) ? b.height : null;
  if (resolved.inputs?.some(i => i.kind === 'time')) return Number.isFinite(b.time) ? b.time : null;
  if (resolved.inputs?.some(i => i.kind === 'cal')) return Number.isFinite(b.cal) ? b.cal : null;
  if (resolved.inputs?.some(i => i.kind === 'reps')) return Number.isFinite(b.reps) ? b.reps : null;
  return null;
}
function completedCount(store) {
  const logs = store.state.logs[store.settings().currentRun] || {};
  return Object.values(logs).filter(d => d.completedAt).length;
}

export function historyFor(store) { return { ...store.history, getChoice: store.getChoice }; }

export function renderToday(root, app) {
  const { store } = app;
  const settings = store.settings();
  const ui = app.ui;
  const current = settings.currentDay;
  const n = Math.min(TOTAL, Math.max(1, ui.peekDay ?? current));
  const s = session(n, settings);
  const history = historyFor(store);
  const log = store.getLog(n) || { blocks: {} };
  const units = settings.units;
  const equipment = settings.equipment || {};
  const keys = s.blocks.map(b => b.key);
  const openKey = ui.openKey && keys.includes(ui.openKey) ? ui.openKey : (keys.find(k => !log.blocks[k]?.done) ?? null);
  const dayDone = !!log.completedAt;

  const peek = delta => { ui.peekDay = Math.min(TOTAL, Math.max(1, n + delta)); ui.openKey = null; app.render(); };
  const required = s.blocks.filter(b => !b.advanced);
  const optional = s.blocks.filter(b => b.advanced);
  const doneCount = () => required.filter(b => store.getLog(n)?.blocks?.[b.key]?.done).length;
  const plural = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;
  const reqText = s.graduation ? 'Nothing left to log. Read on.'
    : s.rest ? `Rest day${optional.length ? ` · ${plural(optional.length, 'optional block')}` : ''}`
      : `${plural(required.length, 'block')} to do, in order${optional.length ? ` · ${optional.length} optional` : ''}`;

  // ----- header -----
  const pct = Math.round((completedCount(store) / TOTAL) * 100);
  const header = h('header', { class: 'hdr' },
    h('div', { class: 'hdr-row' },
      h('button', { class: 'nav', 'aria-label': 'Previous day', onclick: () => peek(-1), disabled: n <= 1 }, '‹'),
      h('div', { class: 'day' }, `Day ${n}`),
      h('button', { class: 'nav', 'aria-label': 'Next day', onclick: () => peek(1), disabled: n >= TOTAL }, '›')),
    h('div', { class: 'meta' }, s.graduation ? 'Graduation' : `Cycle ${s.cycle} · Week ${s.week} · ${s.phaseLabel}${s.estMinutes ? ` · ~${s.estMinutes} min` : ''}`),
    h('div', { class: 'title' }, s.title),
    h('div', { class: 'req' }, reqText),
    n !== current
      ? h('div', { class: 'peek' }, `You are on Day ${current}. `, h('a', { href: '#today', onclick: e => { e.preventDefault(); store.setCurrentDay(n); ui.peekDay = null; ui.openKey = null; app.render(); } }, `Set Day ${n} as current`))
      : null,
    h('div', { class: 'bar', title: `${pct}% of the year` }, h('i', { style: `width:${pct}%` })));

  // ----- banners -----
  const banners = [];
  if (!store.persistent) banners.push(h('div', { class: 'banner warn' }, "Can't save on this browser: logs will be lost when you close the app."));
  const last = settings.lastExportAt;
  if (completedCount(store) > 0 && (!last || app.now() - last > 14 * DAY_MS)) {
    banners.push(h('div', { class: 'banner' }, last ? 'Your last backup is over two weeks old. ' : 'No backup yet. ', h('a', { href: '#settings', onclick: e => { e.preventDefault(); go('settings'); } }, 'Save one in Settings')));
  }

  // ----- blocks -----
  const renderBlock = block => {
    const optionId = defaultOptionId(block, { history, settings });
    const resolved = resolveBlock(block, optionId);
    const blog = log.blocks[block.key] || {};
    const done = !!blog.done;
    const meta = { slotKey: block.slotKey, optionId, ruleType: resolved.rule.type, lift: block.lift, format: resolved.rule.format };
    const cur = () => store.getLog(n)?.blocks?.[block.key] || {};
    const write = patch => { store.logBlock(n, block.key, { ...meta, ...patch }); if (cur().done) recordTestIfAny(); };
    const isOpen = block.key === openKey;
    const vis = block.options ? visibleOptions(block.options, equipment) : null;
    const chosen = vis ? (vis.find(o => o.id === optionId) || vis[0]) : null;
    const keyFigure = resolved.rx?.[0] || '';
    const longName = block.name.length > 26;         // long titles wrap onto two lines instead of sharing the row with a clipped figure

    const letter = h('div', { class: 'letter' + (block.advanced ? ' adv' : '') }, block.key);
    const tag = block.advanced ? h('span', { class: 'tag' }, 'Optional') : null;
    const check = h('button', { class: 'check' + (done ? ' on' : ''), 'aria-label': done ? 'Mark not done' : 'Mark done', onclick: e => { e.stopPropagation(); toggleDone(); } }, done ? '✓' : '');

    function toggleDone() {
      const next = !cur().done;
      write({ done: next });
      if (next) {
        recordTestIfAny();
        const idx = keys.indexOf(block.key);
        const after = keys.slice(idx + 1).find(k => !(store.getLog(n)?.blocks?.[k]?.done));
        ui.openKey = after ?? keys.find(k => !(store.getLog(n)?.blocks?.[k]?.done)) ?? null;
      } else {
        ui.openKey = block.key;
      }
      app.render();
    }
    function recordTestIfAny() {
      const value = testValueFor(resolved, cur());
      if (value !== null) store.upsertTest(resolved.test, value, n);
    }

    if (!isOpen) {
      return h('div', { class: 'card collapsed' + (done ? ' done' : '') + (block.advanced ? ' pm' : ''), onclick: () => { ui.openKey = block.key; app.render(); } },
        h('div', { class: 'row' }, letter, h('div', { class: 'name' + (longName ? ' wide' : '') }, block.name), tag, chosen && block.options.length > 1 ? h('span', { class: 'chip sel' }, chosen.name) : null, longName ? null : h('span', { class: 'fig' }, keyFigure), check));
    }

    // expanded
    const target = targets(block, { history, settings, info: s, optionId, now: app.now() });
    const chips = vis && vis.length > 1
      ? h('div', { class: 'pick' }, h('div', { class: 'pick-k' }, 'Choose one'),
        h('div', { class: 'chips' }, ...vis.map(o => h('button', { class: 'chip' + (o.id === chosen.id ? ' sel' : ''), onclick: e => { e.stopPropagation(); store.setChoice(block.slotKey, o.id); write({ optionId: o.id }); app.render(); } }, (o.id === chosen.id ? '✓ ' : '') + o.name))))
      : null;
    const rx = h('div', { class: 'rx' }, ...(resolved.rx || []).map(line => h('div', { class: 'rx-line' }, line)));
    const items = block.items ? h('div', { class: 'items-wrap' }, h('div', { class: 'items-k' }, block.itemsLabel || 'Stations'),
      h('ol', { class: 'items' }, ...block.items.map(it => {
        const v = it.options ? visibleOptions(it.options, equipment) : null;
        const main = v ? v[0].name : it.text;
        const alts = v ? v.slice(1).map(o => o.name) : [];
        return h('li', null, h('div', { class: 'it' }, main), alts.length ? h('div', { class: 'alt' }, h('span', { class: 'or' }, 'or'), alts.join(' / ')) : null);
      }))) : null;
    const cues = resolved.cues && resolved.cues.length
      ? h('div', { class: 'cues' }, ...resolved.cues.map(c => h('div', { class: 'cue' }, h('span', { class: 'cue-k' }, 'Cue'), c)))
      : null;
    const targetBox = target && target.text
      ? h('div', { class: 'target' + (target.missing ? ' soft' : '') }, target.text, target.sub ? h('small', null, target.sub) : null)
      : null;

    const dispW = w => (w == null ? '' : units === 'kg' ? roundLoad(lbToKg(w), 'kg') : w);
    const parseW = v => { const x = parseFloat(v); return Number.isFinite(x) ? (units === 'kg' ? kgToLb(x) : x) : undefined; };
    const parseInt10 = v => { const x = parseInt(v, 10); return Number.isFinite(x) ? x : undefined; };
    const parseFloatU = v => { const x = parseFloat(v); return Number.isFinite(x) ? x : undefined; };
    function numField(value, placeholder, onInput, inputmode = 'decimal') {
      return h('input', { class: 'in', type: 'text', inputmode, placeholder: placeholder ?? '', value: value ?? '', oninput: e => onInput(e.target.value) });
    }
    const inputs = h('div', { class: 'inputs' }, ...(resolved.inputs || []).map(inp => renderInput(inp)));
    function renderInput(inp) {
      switch (inp.kind) {
        case 'sets': {
          const logged = blog.sets || [];
          const pre = target?.prefill?.sets || [];
          const rows = Math.max(inp.count, logged.length);
          const update = (i, patch) => {
            const sets = (cur().sets || []).map(x => ({ ...x })); while (sets.length <= i) sets.push({});
            sets[i] = { ...sets[i], ...patch };
            if (patch.w !== undefined && sets[i].r === undefined && Number.isFinite(pre[i]?.r)) sets[i].r = pre[i].r;
            write({ sets });
          };
          const lines = Array.from({ length: rows }, (_, i) => {
            const sv = logged[i] || {}; const p = pre[i] || {};
            const label = block.rule.type === 'wave' && i === rows - 1 ? 'Top' : `Set ${i + 1}`;
            return h('div', { class: 'set' }, h('span', { class: 'lab' }, label),
              numField(dispW(sv.w), dispW(p.w) || units, v => update(i, { w: parseW(v) })),
              h('span', { class: 'x' }, '×'),
              numField(sv.r ?? '', p.r ?? 'reps', v => update(i, { r: parseInt10(v) }), 'numeric'));
          });
          return h('div', { class: 'sets' }, ...lines, h('button', { class: 'link', onclick: () => { const sets = (cur().sets || []).map(x => ({ ...x })); sets.push({}); write({ sets }); app.render(); } }, '+ add set'));
        }
        case 'time':
          return h('div', { class: 'set' }, h('span', { class: 'lab' }, inp.label || 'Time'),
            numField(blog.timeText ?? (Number.isFinite(blog.time) ? fmtTime(blog.time) : ''), 'm:ss', v => { const sec = parseTime(v); write({ timeText: v, time: sec ?? undefined }); }, 'numeric'));
        case 'cal': return h('div', { class: 'set' }, h('span', { class: 'lab' }, inp.label || 'Calories'), numField(blog.cal ?? '', 'cal', v => write({ cal: parseInt10(v) }), 'numeric'));
        case 'reps': return h('div', { class: 'set' }, h('span', { class: 'lab' }, inp.label || 'Reps'), numField(blog.reps ?? '', 'reps', v => write({ reps: parseInt10(v) }), 'numeric'));
        case 'distance': return h('div', { class: 'set' }, h('span', { class: 'lab' }, `Distance (${inp.unit})`), numField(blog.distance ?? '', inp.unit, v => write({ distance: parseFloatU(v) })));
        case 'duration': return h('div', { class: 'set' }, h('span', { class: 'lab' }, 'Minutes'), numField(blog.duration ?? '', 'min', v => write({ duration: parseFloatU(v) }), 'numeric'));
        case 'hr': return h('div', { class: 'set' }, h('span', { class: 'lab' }, 'Avg HR'), numField(blog.hr ?? '', 'bpm (optional)', v => write({ hr: parseInt10(v) }), 'numeric'));
        case 'height': return h('div', { class: 'set' }, h('span', { class: 'lab' }, 'Best (in)'), numField(blog.height ?? '', 'inches or ft of broad jump', v => write({ height: parseFloatU(v) })));
        case 'rounds': {
          const rounds = blog.rounds || [];
          const texts = blog.roundsText || [];
          return h('div', { class: 'sets' }, ...Array.from({ length: inp.count }, (_, i) =>
            h('div', { class: 'set' }, h('span', { class: 'lab' }, `Rd ${i + 1}`),
              numField(texts[i] ?? (Number.isFinite(rounds[i]) ? fmtTime(rounds[i]) : ''), 'm:ss (optional)', v => {
                const b = cur(); const r = [...(b.rounds || [])]; const t = [...(b.roundsText || [])];
                while (r.length <= i) r.push(undefined); while (t.length <= i) t.push('');
                r[i] = parseTime(v) ?? undefined; t[i] = v; write({ rounds: r, roundsText: t });
              }, 'numeric'))));
        }
        default: return null;
      }
    }
    const notes = h('input', { class: 'notes', type: 'text', placeholder: 'Add a note', value: blog.notes ?? '', oninput: e => write({ notes: e.target.value }) });

    return h('div', { class: 'card open' + (done ? ' done' : '') + (block.advanced ? ' pm' : '') },
      h('div', { class: 'row', onclick: () => { ui.openKey = null; app.render(); } }, letter, h('div', { class: 'name' }, block.name), tag, check),
      chips, rx, items, cues, targetBox, inputs,
      h('div', { class: 'foot' }, notes));
  };

  // ----- CTA -----
  let ctaLabel = `Complete Day ${n}`;
  if (s.graduation) ctaLabel = 'Done. Go specialize.';
  else if (s.rest) ctaLabel = 'Rest logged';
  const cta = dayDone
    ? h('button', { class: 'cta done', disabled: true }, `Day ${n} completed ✓`)
    : h('button', { class: 'cta', onclick: () => {
      for (const block of s.blocks) {            // sweep: record any test values typed without toggling done
        const optionId = defaultOptionId(block, { history, settings });
        const resolved = resolveBlock(block, optionId);
        const value = testValueFor(resolved, store.getLog(n)?.blocks?.[block.key]);
        if (value !== null) store.upsertTest(resolved.test, value, n);
      }
      store.completeDay(n); ui.peekDay = null; ui.openKey = null; app.render(); window.scrollTo(0, 0);
    } }, ctaLabel);

  const dc = doneCount();
  const ctaNote = dayDone || s.graduation || s.rest ? null
    : h('div', { class: 'cta-note' }, dc === required.length ? `All ${required.length} blocks marked done` : `${dc} of ${required.length} blocks marked done`);

  clear(root);
  root.append(header, ...banners, h('div', { class: 'blocks' }, ...s.blocks.map(renderBlock)), ...[ctaNote, cta].filter(Boolean));
}
