// Target engine: turns a block + history into today's numbers (spec §4.5).
import { roundLoad, fmtTime, fmtPace, hrRange, maxHRFrom, lbToKg } from './format.js';
import { visibleOptions } from './program/rotations.js';
import { dayInfo } from './calendar.js';
import { deadliftScheme } from './program/schemes.js';

const DAY = 86400e3;
const FRESH_DAYS = 42;
const epley = (w, r) => w * (1 + r / 30);

export function fmtLoad(lb, units = 'lb') {
  if (units === 'kg') return `${roundLoad(lbToKg(lb), 'kg')} kg`;
  return `${roundLoad(lb, 'lb')} lb`;
}
const dispNum = (lb, units) => (units === 'kg' ? roundLoad(lbToKg(lb), 'kg') : roundLoad(lb, 'lb'));

function heaviest(sets) {
  let best = null;
  for (const s of sets || []) if (s && Number.isFinite(s.w) && (!best || s.w > best.w)) best = s;
  return best;
}

/** Resolve the rule/rx/inputs/test that apply for the chosen option (machine blocks carry altRules). */
export function resolveBlock(block, optionId) {
  const alt = optionId && block.altRules && block.altRules[optionId];
  if (!alt) return { rule: block.rule, rx: block.rx, cues: block.cues, inputs: block.inputs, test: block.test };
  return { rule: alt.rule, rx: alt.rx || block.rx, cues: alt.rx ? alt.cues : block.cues, inputs: alt.inputs || block.inputs, test: alt.test };
}

export function estimate1RM(evidence, { now = Date.now() } = {}) {
  const fresh = (evidence || []).filter(e => now - (e.at || 0) < FRESH_DAYS * DAY);
  const anchors = fresh.filter(e => e.kind === '1rm' || e.kind === 'single').sort((a, b) => a.at - b.at);
  const anchor = anchors[anchors.length - 1];
  let e = null;
  if (anchor) {
    e = anchor.kind === '1rm' ? anchor.weight : anchor.weight * 1.08;
    for (const t of fresh) if (t.kind === 'topset' && t.at > anchor.at) e = Math.max(e, epley(t.weight, t.reps));
  } else {
    for (const t of fresh) if (t.kind === 'topset') e = Math.max(e ?? 0, epley(t.weight, t.reps));
  }
  return e === null ? null : Math.round(e);
}

function anchorDescription(evidence, now, units) {
  const fresh = (evidence || []).filter(e => now - (e.at || 0) < FRESH_DAYS * DAY);
  const anchors = fresh.filter(e => e.kind === '1rm' || e.kind === 'single').sort((a, b) => a.at - b.at);
  const a = anchors[anchors.length - 1];
  if (!a) return 'recent top sets';
  return a.kind === '1rm' ? `Week ${a.week} max ${dispNum(a.weight, units)}` : `Week ${a.week} single ${dispNum(a.weight, units)} × 1.08`;
}

const missing = (text, sub) => ({ text, sub, missing: true });

function logsInPhase(ctx, slotKey, phase) {
  return ctx.history.logsFor(slotKey, ctx.optionId).filter(e => {
    const d = dayInfo(e.day);
    return d.cycle === ctx.info.cycle && d.phase === phase;
  });
}

function refSingle(ctx, block, refWeek) {
  const logs = ctx.history.logsFor(block.slotKey, ctx.optionId);
  const inWeek = logs.filter(e => { const d = dayInfo(e.day); return d.cycle === ctx.info.cycle && d.week === refWeek; });
  const pick = inWeek.length ? inWeek[inWeek.length - 1] : [...logs].reverse().find(e => e.block?.ruleType === 'single' || e.block?.ruleType === 'max');
  const top = pick && heaviest(pick.block.sets);
  return top ? top.w : null;
}

function lastTop(ctx, slotKey) {
  const last = ctx.history.lastLog(slotKey, ctx.optionId);
  const top = last && heaviest(last.block.sets);
  return top ? top.w : null;
}

const RULES = {
  ladder(block, ctx, rule) {
    const u = ctx.settings.units;
    const entries = logsInPhase(ctx, block.slotKey, rule.phase).reverse();
    const want = rule.reps[0];
    for (const e of entries) {
      const thatWeek = deadliftScheme(dayInfo(e.day).week);
      const planned = thatWeek.reps || [];
      const sets = (e.block.sets || []).map((x, i) => (x && x.r === undefined && Number.isFinite(x.w) ? { ...x, r: planned[i] } : x));
      const s = sets.find(x => x && x.r === want && Number.isFinite(x.w));
      if (s) {
        const prefill = rule.reps.map((r, i) => (i === 0 ? { w: s.w, r } : { r }));
        return { text: `Start set of ${want} at ${fmtLoad(s.w, u)}`, sub: 'then +5 to 10 lb each set', prefill: { sets: prefill } };
      }
    }
    return { ...missing('Work up. Record each set', 'Your numbers from today seed next week'), prefill: { sets: rule.reps.map(r => ({ r })) } };
  },
  tempoProg(block, ctx, rule) {
    const w = lastTop(ctx, block.slotKey);
    if (w === null) return missing('Challenging weight; tempo and range of motion are the priority');
    const target = roundLoad(w * 1.04, 'lb');
    const prefill = { sets: Array.from({ length: rule.sets }, (_, i) => (i === rule.sets - 1 ? { w: target, r: rule.reps } : { r: rule.reps })) };
    return { text: `Top set ≈ ${fmtLoad(target, ctx.settings.units)}`, sub: `Last top set ${dispNum(w, ctx.settings.units)}; reps drop, load rises`, prefill };
  },
  wave(block, ctx, rule) {
    const ev = ctx.history.liftEvidence(block.lift);
    const e = estimate1RM(ev, { now: ctx.now });
    if (e === null) return missing('Work to RPE 8–9, no misses', 'No recent max or heavy single to base a target on');
    const u = ctx.settings.units;
    const target = roundLoad(e * rule.pct, 'lb');
    const ramp = [0.7, 0.85, 0.95].map(f => ({ w: roundLoad(target * f, 'lb'), r: rule.reps }));
    return { text: `Top set ≈ ${fmtLoad(target, u)} · RPE 8–9, no misses`,
      sub: `${Math.round(rule.pct * 100)}% of estimated 1RM ${dispNum(e, u)} · from ${anchorDescription(ev, ctx.now, u)}`,
      prefill: { sets: [...ramp, { w: target, r: rule.reps }] } };
  },
  percent(block, ctx, rule) {
    const ev = ctx.history.liftEvidence(block.lift);
    const e = estimate1RM(ev, { now: ctx.now });
    if (e === null) return missing(`${rule.sets} × ${rule.reps} at about ${Math.round(rule.pct * 100)}% effort`, 'No recent max to base this on');
    const w = roundLoad(e * rule.pct, 'lb');
    return { text: `${rule.sets} × ${rule.reps} @ ${fmtLoad(w, ctx.settings.units)} (${Math.round(rule.pct * 100)}%)`, prefill: { sets: Array.from({ length: rule.sets }, () => ({ w, r: rule.reps })) } };
  },
  pctSingle(block, ctx, rule) {
    const ref = refSingle(ctx, block, rule.refWeek);
    if (ref === null) return missing(`${rule.sets} × ${rule.reps} at about ${Math.round(rule.pct * 100)}% of your best single`);
    const w = roundLoad(ref * rule.pct, 'lb');
    return { text: `${rule.sets} × ${rule.reps} @ ${fmtLoad(w, ctx.settings.units)} (${Math.round(rule.pct * 100)}% of ${dispNum(ref, ctx.settings.units)})`, prefill: { sets: Array.from({ length: rule.sets }, () => ({ w, r: rule.reps })) } };
  },
  plusFive(block, ctx, rule) {
    const last = lastTop(ctx, block.slotKey);
    if (last === null) return missing(`${rule.sets} × ${rule.reps} at a weight you can move fast`);
    const w = last + 5;
    return { text: `${rule.sets} × ${rule.reps} @ ${fmtLoad(w, ctx.settings.units)} (+5)`, prefill: { sets: Array.from({ length: rule.sets }, () => ({ w, r: rule.reps })) } };
  },
  emom(block, ctx, rule) {
    if (rule.pct && rule.refWeek) {
      const ref = refSingle(ctx, block, rule.refWeek);
      if (ref === null) return missing(`${rule.reps} reps at about ${Math.round(rule.pct * 100)}% of your best single`);
      const w = roundLoad(ref * rule.pct, 'lb');
      return { text: `${rule.reps} reps @ ${fmtLoad(w, ctx.settings.units)} (${Math.round(rule.pct * 100)}% of ${dispNum(ref, ctx.settings.units)})`, prefill: { sets: [{ w, r: rule.reps }] } };
    }
    const last = lastTop(ctx, block.slotKey);
    if (last === null) return missing(`${rule.reps} reps at a weight you can move fast`);
    const w = last + 5;
    return { text: `${rule.reps} reps @ ${fmtLoad(w, ctx.settings.units)} (+5)`, prefill: { sets: [{ w, r: rule.reps }] } };
  },
  rowPace(block, ctx, rule) {
    const s = rule.scheme;
    const fresh = ctx.history.latestTest('row2k', { maxAgeDays: FRESH_DAYS });
    const any = ctx.history.latestTest('row2k');
    if (s.kind === 'tt' || s.kind === 'primerTT') {
      if (!any) return { text: 'Your first 2k: set the pace for the block', sub: 'Even splits; empty the tank in the last 500 m' };
      const split = any.value / 4;
      return { text: `Last 2k: ${fmtTime(any.value)} · beat it`, sub: s.kind === 'primerTT' ? `Primer 300s @ ${fmtPace(split, '/500m')}` : `That was ${fmtPace(split, '/500m')}` };
    }
    if (s.kind === 'easy') return { text: `${s.minutes} min easy` };
    if (!fresh) return missing('Comfortable but challenging; hold it for all rounds', 'No rower test in the last 6 weeks');
    const split = fresh.value / 4;
    if (s.kind === 'intervals') return { text: `${s.rounds} × ${s.meters} m @ ${fmtPace(split + s.offset, '/500m')} · walk ${s.rest}`, sub: `From your 2k of ${fmtTime(fresh.value)}` };
    if (s.kind === 'ladder1200') return { text: `3 × 1200 m @ ${fmtTime(split + 2)} · ${fmtTime(split)} · ${fmtTime(split - 2)} /500m · rest 3:00`, sub: `From your 2k of ${fmtTime(fresh.value)}` };
    return { text: '' };
  },
  bikePace(block, ctx, rule) {
    const s = rule.scheme;
    const fresh = ctx.history.latestTest('bike10', { maxAgeDays: FRESH_DAYS });
    const any = ctx.history.latestTest('bike10');
    if (s.kind === 'tt' || s.kind === 'primerTT') {
      if (!any) return { text: 'Your first 10-min test: set the pace for the block', sub: 'Steady for 8 minutes, then empty it' };
      return { text: `Last 10-min test: ${any.value} cal · beat it`, sub: `That was ${(any.value / 10).toFixed(1)} cal/min` };
    }
    if (s.kind === 'easy') return { text: `${s.minutes} min easy` };
    if (!fresh) return missing('Comfortable but challenging; hold it for all rounds', 'No bike test in the last 6 weeks');
    const P = fresh.value / 10;
    if (s.kind === 'intervals') {
      const c = Math.round(P * s.mult * s.seconds / 60);
      return { text: `${s.rounds} × ${fmtTime(s.seconds)} → ${c} cal · easy ${s.rest}`, sub: `From your 10-min test of ${fresh.value} cal` };
    }
    if (s.kind === 'ladder4min') {
      const cs = [0.95, 1.0, 1.05].map(m => Math.round(P * m * 4));
      return { text: `3 × 4:00 → ${cs.join(' · ')} cal · rest 3:00`, sub: `From your 10-min test of ${fresh.value} cal` };
    }
    return { text: '' };
  },
  runPace(block, ctx, rule) {
    if (rule.format === 'TT5K' || rule.format === 'TEST1_5') {
      const id = rule.format === 'TT5K' ? 'run5k' : 'run1_5mi';
      const any = ctx.history.latestTest(id);
      const label = rule.format === 'TT5K' ? '5k' : '1.5-mile';
      if (!any) return { text: `Your first ${label}: comfortable but challenging start, finish hard` };
      return { text: `Last ${label}: ${fmtTime(any.value)} · beat it` };
    }
    const fresh = ctx.history.latestTest('run5k', { maxAgeDays: FRESH_DAYS });
    if (!fresh) return missing('Comfortable but challenging; hold your paces', 'No 5k in the last 6 weeks');
    const p = fresh.value / 5;
    return { text: 'Paces from your 5k', sub: `fast ${fmtPace(p, '/km')} · moderate ${fmtTime(p + 60)}–${fmtTime(p + 75)} /km · easy ${fmtTime(p + 90)}–${fmtTime(p + 120)} /km` };
  },
  peakRepeat(block, ctx) {
    const w = lastTop(ctx, block.slotKey);
    if (w === null) return missing('Work up: increase weight each set');
    const count = (block.inputs || []).find(i => i.kind === 'sets')?.count || 3;
    return { text: `All sets at ${fmtLoad(w, ctx.settings.units)}`, prefill: { sets: Array.from({ length: count }, () => ({ w })) } };
  },
  introduce(block, ctx) {
    const w = lastTop(ctx, block.slotKey);
    return { text: 'Increase weight each set if possible', sub: w === null ? undefined : `Last time: peak ${fmtLoad(w, ctx.settings.units)}` };
  },
  density(block, ctx, rule) {
    const entries = ctx.history.logsFor(block.slotKey).filter(e => e.block?.format === rule.format && Number.isFinite(e.block?.reps));
    if (!entries.length) return missing('Count total reps if you can', 'Next time you will get a number to beat');
    return { text: `Beat ${entries[entries.length - 1].block.reps} total reps` };
  },
  consistency(block, ctx) {
    const last = ctx.history.lastLog(block.slotKey);
    const rounds = last?.block?.rounds?.filter(Number.isFinite);
    if (!rounds || !rounds.length) return missing('Pick a pace you can hold for every round');
    const avg = rounds.reduce((a, b) => a + b, 0) / rounds.length;
    return { text: `Last average round ${fmtTime(avg)} · same or faster, no fade` };
  },
  beatLast(block, ctx) {
    const last = ctx.history.lastLog(block.slotKey);
    const sets = (last?.block?.sets || []).filter(s => s && Number.isFinite(s.w) && Number.isFinite(s.r));
    if (!sets.length) return missing("Log your sets; next time you'll get a target");
    const u = ctx.settings.units;
    return { text: `Last: ${sets.map(s => `${dispNum(s.w, u)}×${s.r}`).join(', ')} · beat it by a rep or 5 lb` };
  },
  zone2(block, ctx, rule) {
    const mhr = maxHRFrom(ctx.settings);
    const load = rule.load ? ` @ ${rule.load} lb` : '';
    if (mhr) { const [lo, hi] = hrRange(mhr); return { text: `${rule.minutes} min${load} · ${lo}–${hi} bpm`, sub: 'Conversational; nasal breathing possible' }; }
    return { text: `${rule.minutes} min${load} · conversational pace`, sub: 'Set max HR or age in Settings for a bpm range' };
  },
  intervals(block, ctx, rule) {
    return { text: `${rule.sets} × 4 stations · ${rule.work} s on / ${rule.work} s off` };
  },
  single(block, ctx) {
    const ev = ctx.history.liftEvidence(block.lift);
    const e = estimate1RM(ev, { now: ctx.now });
    if (e === null) return missing('Work up by feel; log every attempt');
    return { text: `Estimated 1RM ≈ ${fmtLoad(e, ctx.settings.units)}`, sub: 'A tempo single usually lands around 90% of that' };
  },
  max(block, ctx) {
    const ev = ctx.history.liftEvidence(block.lift);
    const e = estimate1RM(ev, { now: ctx.now });
    if (e === null) return missing('Work up by feel; log every attempt');
    return { text: `Estimated 1RM ≈ ${fmtLoad(e, ctx.settings.units)} · plan attempts around it`, sub: 'Open around 90%, then 97%, then go' };
  },
  none(block, ctx) {
    if (block.test) {
      const any = ctx.history.latestTest(block.test);
      if (any) return { text: `Last: ${block.inputs?.some(i => i.kind === 'time') ? fmtTime(any.value) : any.value} · beat it` };
      return { text: 'First time: set the baseline' };
    }
    return { text: '' };
  },
};

export function targets(block, ctx) {
  const { rule } = resolveBlock(block, ctx.optionId);
  const fn = RULES[rule.type] || RULES.none;
  return fn(block, ctx, rule);
}

export function defaultOptionId(block, ctx) {
  if (!block.options || !block.options.length) return undefined;
  const vis = visibleOptions(block.options, ctx.settings.equipment);
  const stored = ctx.history.getChoice ? ctx.history.getChoice(block.slotKey) : undefined;
  if (stored && vis.some(o => o.id === stored)) return stored;
  if (block.pickDefault === 'olderTest') {
    let best = null;
    for (const o of vis) {
      const testId = o.id === block.options[0].id ? block.test : block.altRules?.[o.id]?.test;
      const t = testId ? ctx.history.latestTest(testId) : null;
      const at = t ? t.at : -Infinity;
      if (!best || at < best.at) best = { id: o.id, at };
    }
    return best.id;
  }
  return vis[0].id;
}
