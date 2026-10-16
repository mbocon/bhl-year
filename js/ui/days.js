// Days view: the whole year grouped by cycle and week.
import { h, clear } from './dom.js';
import { dayInfo, DAY_NAMES } from '../calendar.js';
import { go } from './router.js';

function titleFor(info) {
  if (info.graduation) return 'Graduation';
  if (info.dow === 6 && info.week === 13) return 'Ruck Test';
  return DAY_NAMES[info.dow - 1];
}

export function renderDays(root, app) {
  const { store } = app;
  const settings = store.settings();
  const logs = store.state.logs[settings.currentRun] || {};
  const current = settings.currentDay;
  clear(root);

  const jump = h('input', { class: 'in', type: 'text', inputmode: 'numeric', placeholder: 'Day #' });
  root.append(h('header', { class: 'hdr' }, h('div', { class: 'day' }, 'Days'),
    h('div', { class: 'meta' }, `You are on Day ${current}. Tap any day to view it.`),
    h('div', { class: 'set' }, h('span', { class: 'lab' }, 'Jump to'), jump,
      h('button', { class: 'btn', onclick: () => { const n = parseInt(jump.value, 10); if (n >= 1 && n <= 365) { app.ui.peekDay = n; app.ui.openKey = null; go('today'); } } }, 'Go'))));

  let list = null;
  for (let n = 1; n <= 365; n++) {
    const info = dayInfo(n);
    if (info.dow === 1 || info.graduation) {
      if (info.graduation) root.append(h('div', { class: 'week-h' }, 'Day 365'));
      else {
        if (info.week === 1) root.append(h('div', { class: 'section' }, h('h2', null, `Cycle ${info.cycle}`)));
        root.append(h('div', { class: 'week-h' }, `Week ${info.week} · ${info.week <= 6 ? 'Accumulation' : info.week <= 12 ? 'Intensification' : 'Deload + Tests'}`));
      }
      list = h('div', { class: 'list' });
      root.append(list);
    }
    const done = !!logs[n]?.completedAt;
    list.append(h('div', { class: 'item' + (n === current ? ' current' : ''), onclick: () => { app.ui.peekDay = n; app.ui.openKey = null; go('today'); } },
      h('span', { class: 'n' }, `Day ${n}`), h('span', { class: 't' }, titleFor(info)), h('span', { class: 'ok' }, done ? '✓' : '')));
  }
  let current_el = root.querySelector('.item.current');
  if (current_el && typeof current_el.scrollIntoView === 'function') setTimeout(() => current_el.scrollIntoView({ block: 'center' }), 0);
}
