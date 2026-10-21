// Settings: pointer, units, advanced, HR, equipment, nutrition, backup, restore, resets.
import { h, clear } from './dom.js';
import { macroPlan, weightTrend, trendText, nextReviewISO, REVIEW, fmtISO, todayOf } from '../nutrition.js';
import { backupFilename, shareOrDownload } from '../backup.js';
import { maxHRFrom, hrRange } from '../format.js';

const EQUIPMENT = [['box', 'Plyo box'], ['rope', 'Jump rope'], ['kb', 'Kettlebells'], ['rings', 'Rings'], ['climbRope', 'Climbing rope'], ['hurdles', 'Hurdles'], ['vest', 'Weight vest'], ['slamBall', 'Slam ball'], ['hrm', 'Heart-rate monitor']];

export function renderSettings(root, app) {
  const { store } = app;
  const s = store.settings();
  clear(root);
  const num = (value, onCommit, placeholder = '') => h('input', { class: 'in', type: 'text', inputmode: 'decimal', value: value ?? '', placeholder, onchange: e => { const v = parseFloat(e.target.value); onCommit(Number.isFinite(v) ? v : null); } });
  const toggle = (on, onFlip) => h('button', { class: 'toggle' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: onFlip });
  const field = (label, control, note) => h('div', { class: 'field' }, h('div', null, label, note ? h('div', { class: 'muted' }, note) : null), control);
  const status = h('div', { class: 'muted', style: 'margin-top:6px' }, app.ui.flash || '');
  app.ui.flash = null;
  const flash = msg => { app.ui.flash = msg; app.render(); };

  root.append(h('header', { class: 'hdr' }, h('div', { class: 'day' }, 'Settings')));

  // Program
  const dayIn = num(s.currentDay, () => {}, 'Day');
  root.append(h('div', { class: 'section' }, h('h2', null, 'Program'),
    field('Current day', h('div', { style: 'display:flex;gap:6px' }, dayIn, h('button', { class: 'btn', onclick: () => { const n = parseInt(dayIn.value, 10); if (n >= 1 && n <= 365) { store.setCurrentDay(n); app.ui.peekDay = null; app.render(); } } }, 'Set'))),
    field('Units', h('select', { onchange: e => { store.updateSettings({ units: e.target.value }); app.render(); } },
      h('option', { value: 'lb', selected: s.units === 'lb' }, 'lb'), h('option', { value: 'kg', selected: s.units === 'kg' }, 'kg'))),
    field('Advanced', toggle(s.advanced, () => { store.updateSettings({ advanced: !s.advanced }); app.render(); }), 'Adds the Day 7 long zone 2 session and optional PM rides'),
  ));

  // Body
  const mhr = maxHRFrom(s);
  root.append(h('div', { class: 'section' }, h('h2', null, 'You'),
    field('Max heart rate', num(s.maxHR, v => { store.updateSettings({ maxHR: v }); app.render(); }, 'bpm'), mhr ? `Zone 2: ${hrRange(mhr).join('–')} bpm` : 'Or enter age below'),
    field('Age', num(s.age, v => { store.updateSettings({ age: v }); app.render(); }, 'years'), 'Used as 220 − age when max HR is blank'),
    field('Bodyweight (lb)', num(s.bodyweight, v => { store.updateSettings({ bodyweight: v }); app.render(); }, 'lb'), 'Scorecard ×BW lifts (your 7-day scale average once you log weigh-ins); macros when no goal is set'),
    field('Goal weight (lb)', num(s.goalWeight, v => { store.updateSettings({ goalWeight: v }); app.render(); }, 'lb'), 'Macros are computed from this, so the deficit closes as you get there'),
  ));

  // Equipment
  root.append(h('div', { class: 'section' }, h('h2', null, 'Equipment'),
    h('p', { class: 'muted' }, 'Unchecked gear hides the options that need it.'),
    ...EQUIPMENT.map(([k, label]) => field(label, toggle(!!s.equipment[k], () => { store.updateSettings({ equipment: { [k]: !s.equipment[k] } }); app.render(); })))));

  // Nutrition
  const m = macroPlan(s, store.nutrition());
  const todayISO = todayOf(app);
  const nut = store.nutrition();
  const tr = weightTrend(store.weights(), todayISO);
  const nextISO = m && m.basis === 'goal' ? nextReviewISO(nut, store.weights()) : null;
  const goalNote = m && m.basis === 'goal'
    ? `Computed from your goal weight${s.bodyweight ? `, not your current ${s.bodyweight} lb` : ''}: the deficit is biggest now and reaches maintenance when you arrive. Keep protein at ${m.protein} g all the way down; ${m.fat} g fat is the floor (trade carbs for fat if hunger or energy is poor). Log your scale weight daily and the review below moves calories for you.`
    : null;
  root.append(h('div', { class: 'section' }, h('h2', null, 'Macros that paired with BHL'),
    h('div', { class: 'card plain' },
      h('div', { class: 'muted' }, 'Guideline, not medical advice. Recomp works at roughly maintenance with high protein and enough carbs to fuel this volume; ' + (m && m.basis === 'goal' ? 'with a goal weight set, the automatic review below adjusts calories every two weeks.' : 'adjust by 100–200 kcal every two weeks based on the mirror and the log.')),
      h('table', { class: 'sc', style: 'margin-top:10px' },
        h('thead', null, h('tr', null, h('th', null, ''), h('th', null, m ? (m.basis === 'goal' ? `Eat · goal ${m.weight} lb` : `You (${m.weight} lb)`) : 'You'))),
        h('tbody', null,
          h('tr', null, h('td', null, 'Calories'), h('td', null, m ? m.kcal : '—')),
          h('tr', null, h('td', null, 'Protein (g)'), h('td', null, m ? m.protein : '—')),
          h('tr', null, h('td', null, 'Fat (g)'), h('td', null, m ? m.fat : '—')),
          h('tr', null, h('td', null, 'Carbs (g)'), h('td', null, m ? m.carbs : '—')))),
      goalNote ? h('div', { class: 'muted', style: 'margin-top:8px' }, goalNote) : null,
      h('div', { class: 'muted', style: 'margin-top:8px' }, tr
        ? `Scale: ${trendText(tr, m && m.basis === 'goal' ? m.weight : null, s.currentDay)} (${tr.n7} weigh-ins this week).`
        : 'Log your scale weight on the Today screen most mornings; the trend appears after three weigh-ins.'),
      m && m.basis === 'goal' ? h('div', { class: 'muted', style: 'margin-top:8px' },
        `Automatic review every ${REVIEW.everyDays} days, the first ${REVIEW.skipDays} days after your first weigh-in, needing ${REVIEW.minPerWeek} weigh-ins in each of the last two weeks: losing under ${REVIEW.slow} lb/week cuts ${REVIEW.step} kcal from carbs, over ${REVIEW.fast} lb/week adds ${REVIEW.step} back, floor ${REVIEW.floorKcal} kcal.`
        + (nextISO ? ` Next review: ${fmtISO(nextISO)}${nextISO <= todayISO ? ' (waiting for enough weigh-ins)' : ''}.` : ' Log a weigh-in to start the clock.')
        + (m.adjust ? ` Current adjustment: ${m.adjust > 0 ? '+' : '−'}${Math.abs(m.adjust)} kcal.` : '')) : null,
      nut.log.length ? h('div', { class: 'muted', style: 'margin-top:8px' }, 'Reviews so far:',
        ...nut.log.slice(-6).reverse().map(r => h('div', null, `Day ${r.day} · ${r.rate.toFixed(1)} lb/wk · ${r.delta === 0 ? (r.atGoal ? 'at goal, hold' : 'hold') : (r.delta > 0 ? '+' : '−') + Math.abs(r.delta)} → ${r.kcal} kcal`))) : null,
      h('div', { class: 'muted', style: 'margin-top:8px' }, '14 kcal, 1 g protein, 0.27 g fat per lb; carbs fill the rest.' + (m ? '' : ' Enter a bodyweight or goal weight above.')))));

  // Backup
  const last = s.lastExportAt ? new Date(s.lastExportAt).toLocaleDateString() : 'never';
  const paste = h('textarea', { class: 'in', placeholder: 'Or paste a backup here' });
  const fileIn = h('input', { type: 'file', accept: 'application/json,.json', style: 'font-size:14px' });
  const doImport = text => {
    let days = 0;
    try { const p = JSON.parse(text); days = Object.values(p.logs || {}).reduce((a, r) => a + Object.keys(r).length, 0); } catch { /* validated below */ }
    const cur = Object.values(store.state.logs).reduce((a, r) => a + Object.keys(r).length, 0);
    if (!confirm(`Replace the ${cur} logged day(s) on this phone with this backup (${days} logged day(s))?`)) return;
    const r = store.importJSON(text);
    flash(r.ok ? 'Restored.' : r.error);
  };
  fileIn.addEventListener('change', () => { const f = fileIn.files && fileIn.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => doImport(String(rd.result)); rd.readAsText(f); });
  root.append(h('div', { class: 'section' }, h('h2', null, 'Backup'),
    h('p', { class: 'muted' }, `Last backup: ${last}. Your log lives only on this phone; back it up every couple of weeks.`),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn primary', onclick: async () => {
        try {
          const r = await shareOrDownload(store.exportJSON(), backupFilename(s.currentDay));
          if (r === 'shared' || r === 'downloaded' || r === 'copied') store.markExported();
          flash({ shared: 'Shared.', downloaded: 'Downloaded.', copied: 'Copied to clipboard: paste it somewhere safe.', cancelled: 'Cancelled.' }[r] || r);
        } catch (e) { flash(e.message); }
      } }, 'Save a backup')),
    h('div', { class: 'muted' }, 'Restore from a backup file:'), fileIn,
    paste, h('div', { class: 'btn-row' }, h('button', { class: 'btn', onclick: () => { if (paste.value.trim()) doImport(paste.value); } }, 'Restore pasted backup')),
    status));

  // Danger zone
  root.append(h('div', { class: 'section' }, h('h2', null, 'Start over'),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn', onclick: () => { if (confirm('Start a new run at Day 1? Your history is kept and stays on the Scorecard.')) { store.startRun(); app.ui.peekDay = null; app.ui.openKey = null; app.render(); } } }, 'Start over at Day 1'),
      h('button', { class: 'btn danger', onclick: () => { if (confirm('Erase everything on this phone? This cannot be undone.') && confirm('Really erase all logs, tests, and settings?')) { store.eraseAll(); app.ui.peekDay = null; app.ui.openKey = null; app.render(); } } }, 'Erase everything')),
    h('p', { class: 'muted' }, store.persistent ? '' : "Storage is unavailable on this browser, so nothing here will persist.")));
}
