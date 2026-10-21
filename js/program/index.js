// session(n, settings): the whole program as a pure function of the day number.
import { dayInfo, DAY_NAMES } from '../calendar.js';
import { DAY_BUILDERS, graduation, pmBlock } from './days.js';
import { longDuration } from './schemes.js';

export const PHASE_LABELS = { A: 'Accumulation', B: 'Intensification', D: 'Deload + Tests', G: 'Graduation' };
const PM_DAYS = new Set([1, 2, 3, 5]);
const BASE_MINUTES = { 1: 98, 2: 100, 3: 98, 4: 70, 5: 88 };

function estMinutes(info, blocks) {
  if (info.graduation || info.dow === 7) return 0;
  if (info.dow === 6) {
    if (info.week === 13) return 60;
    const a = blocks[0];
    return a && a.rule.type === 'zone2' && a.slotKey !== 'd6.A.circuits' ? a.rule.minutes + 10 : 90;
  }
  const base = BASE_MINUTES[info.dow];
  return info.week === 13 ? Math.round(base * 0.8) : base;
}

export function session(n, settings = {}) {
  const info = dayInfo(n);
  const advanced = !!settings.advanced;
  let blocks;
  let title;
  if (info.graduation) {
    blocks = graduation();
    title = 'Graduation';
  } else {
    const ctx = { info, settings, firstCycle: info.cycle === 1 };
    blocks = DAY_BUILDERS[info.dow](ctx);
    title = info.dow === 6 && info.week === 13 ? 'Ruck Test' : DAY_NAMES[info.dow - 1];
    if (advanced && PM_DAYS.has(info.dow)) blocks = [...blocks, pmBlock(info.dow)];
  }
  const visible = blocks.filter(b => advanced || !b.advanced);
  return {
    n, cycle: info.cycle, week: info.week, dow: info.dow, phase: info.phase, phaseLabel: PHASE_LABELS[info.phase],
    title, rest: info.rest, graduation: info.graduation,
    estMinutes: estMinutes(info, visible.filter(b => !b.advanced)),
    blocks: visible,
  };
}

export { longDuration };
