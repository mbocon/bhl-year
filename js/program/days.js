// Builds the blocks for each day of the week from the scheme tables and rotations (spec §4.3–4.4).
import * as S from './schemes.js';
import * as R from './rotations.js';
import { fmtTime } from '../format.js';

const sets = count => ({ kind: 'sets', count });
const time = label => ({ kind: 'time', label });
const cal = label => ({ kind: 'cal', label });
const reps = label => ({ kind: 'reps', label });
const distance = unit => ({ kind: 'distance', unit });
const duration = () => ({ kind: 'duration' });
const hr = () => ({ kind: 'hr' });
const pctText = p => `${Math.round(p * 100)}%`;
const Z2_OPTIONS = [{ id: 'bike', name: 'Air bike', needs: [] }, { id: 'rower', name: 'Rower', needs: [] }, { id: 'run', name: 'Easy run', needs: [] }];

const LIFT_NAMES = { backsquat: 'Back Squat', frontsquat: 'Front Squat', deadlift: 'Deadlift', bench: 'Bench Press', ohp: 'Overhead Press', clean: 'Clean' };

// ---------- shared builders ----------
function squatBlock(key, lift, scheme, dow) {
  const base = { key, slotKey: `d${dow}.${key}.${lift}`, name: LIFT_NAMES[lift], lift };
  switch (scheme.kind) {
    case 'tempo':
      return { ...base, rule: { type: 'tempoProg', sets: scheme.sets, reps: scheme.reps }, inputs: [sets(scheme.sets)],
        rx: [`Tempo ${scheme.tempo} · ${scheme.sets} × ${scheme.reps} challenging reps · rest 3 min`], cues: ['Increase weight each set if possible; tempo and range of motion are the priority'] };
    case 'single':
      return { ...base, rule: { type: 'single' }, inputs: [sets(5)],
        rx: ['Tempo 42X1 · 5 × 1 · work to a heavy tempo single · rest 3 min'], cues: ['Heavy, not a grinder: the tempo must hold'] };
    case 'wave':
      return { ...base, rule: { type: 'wave', reps: scheme.reps, pct: scheme.pct }, inputs: [sets(4)],
        rx: [`Tempo 20X1 · work up to a top set of ${scheme.reps} · RPE 8–9, no misses · rest 3 min`] };
    case 'max':
      return { ...base, rule: { type: 'max' }, test: `max_${lift}`, inputs: [sets(5)],
        rx: ['Work up to a 1RM · rest 3 min between heavy attempts'], cues: ['Controlled descent; spotter or safeties; log every attempt'] };
    case 'percent':
      return { ...base, rule: { type: 'percent', sets: scheme.sets, reps: scheme.reps, pct: scheme.pct }, inputs: [sets(scheme.sets)],
        rx: [`Tempo 20X1 · ${scheme.sets} × ${scheme.reps} @ ${pctText(scheme.pct)} of your new 1RM · rest 3 min`] };
    default: throw new Error('unknown squat scheme ' + scheme.kind);
  }
}

const GRIP_NOTE = {
  doh: 'Double overhand only: no straps, no hook grip',
  hookOk: 'Double overhand as long as possible; hook grip if you need it to go heavier',
  max: 'Hook grip or straps: lift the heaviest possible',
};
function ladderBlock(key, lift, scheme, dow) {
  const tempo = lift === 'bench' ? '21X1' : '10X1';
  const base = { key, slotKey: `d${dow}.${key}.${lift === 'deadlift' ? 'deadlift' : 'press.' + lift}`, name: LIFT_NAMES[lift], lift };
  if (scheme.kind === 'percent') {
    return { ...base, rule: { type: 'percent', sets: scheme.sets, reps: scheme.reps, pct: scheme.pct }, inputs: [sets(scheme.sets)],
      rx: [`${scheme.sets} × ${scheme.reps} @ ${pctText(scheme.pct)} of your new max · rest 3 min`] };
  }
  const rx = [`Tempo ${tempo} · one heavy set at each of ${scheme.reps.join('/')} reps · increase weight each set · rest 3 min`];
  const cues = [];
  if (lift === 'deadlift') cues.push(GRIP_NOTE[scheme.grip]);
  else if (scheme.grip === 'max') rx.push('Max out on the last single');
  const out = { ...base, rule: { type: 'ladder', reps: scheme.reps, phase: scheme.phase }, inputs: [sets(scheme.reps.length)], rx, cues };
  if (scheme.grip === 'max') out.test = `max_${lift}`;
  return out;
}

function cleanBlock(key, info, variant) {
  const scheme = S.cleanScheme(info.week);
  const name = variant === 'hpc' ? 'Hang Power Clean' : 'Power Clean';
  const base = { key, slotKey: `d5.${key}.clean.${variant}`, name, lift: 'clean',
    options: [{ id: 'bb', name, needs: [] }, { id: 'db', name: 'DB hang power clean', needs: [] }] };
  const floorNote = variant === 'pc' ? 'Drop each rep; take every lift from the floor' : 'Keep the catch position clean; stop if it degrades';
  switch (scheme.kind) {
    case 'single': {
      const b = { ...base, rule: { type: info.week === 12 ? 'max' : 'single' }, inputs: [sets(5)], rx: ['Work up to a heavy single for today · rest 2 min'], cues: [floorNote] };
      if (info.week === 12) b.test = 'max_clean';
      return b;
    }
    case 'pctSingle':
      return { ...base, rule: { type: 'pctSingle', sets: scheme.sets, reps: scheme.reps, pct: scheme.pct, refWeek: scheme.refWeek }, inputs: [sets(scheme.sets)],
        rx: [`${scheme.sets} × ${scheme.reps} @ ${pctText(scheme.pct)} of your week-${scheme.refWeek} single · rest 3 min`], cues: [floorNote] };
    case 'plusFive':
      return { ...base, rule: { type: 'plusFive', sets: scheme.sets, reps: scheme.reps }, inputs: [sets(scheme.sets)],
        rx: [`${scheme.sets} × ${scheme.reps} · add 5 lb to last week · rest 3 min`], cues: [floorNote] };
    case 'emom': {
      const load = scheme.pct ? `@ ${pctText(scheme.pct)} of your week-${scheme.refWeek} single` : '· add 5 lb to last week';
      return { ...base, rule: { type: 'emom', minutes: scheme.minutes, every: scheme.every, reps: scheme.reps, pct: scheme.pct, refWeek: scheme.refWeek }, inputs: [sets(1)],
        rx: [`Every ${scheme.every} s for ${scheme.minutes} min: ${scheme.reps} reps ${load}`], cues: [floorNote] };
    }
    case 'percent':
      return { ...base, rule: { type: 'percent', sets: scheme.sets, reps: scheme.reps, pct: scheme.pct }, inputs: [sets(scheme.sets)],
        rx: [`${scheme.sets} × ${scheme.reps} @ ${pctText(scheme.pct)} of your max · rest 2 min`], cues: [floorNote] };
    default: throw new Error('unknown clean scheme ' + scheme.kind);
  }
}

function rowerRx(s) {
  switch (s.kind) {
    case 'tt': return { rx: ['10 min easy, then 2000 m for time'], cues: ['This sets your rowing paces for the block'] };
    case 'intervals': return { rx: [`12 × ${s.meters} m @ 2k pace${s.offset ? ' − 2 s/500 m' : ''} · walk ${s.rest}`] };
    case 'primerTT': return { rx: ['3 rounds: 300 m @ 2k pace · rest 1:00 · 100 m sprint · walk 3:00', 'Rest 5:00, then 2000 m for time'] };
    case 'ladder1200': return { rx: ['3 × 1200 m: @ 2k + 2 s · @ 2k · @ 2k − 2 s · rest 3:00'] };
    default: return { rx: ['20 min easy'] };
  }
}
function bikeRx(s) {
  switch (s.kind) {
    case 'tt': return { rx: ['10 min easy, then 10 min for max calories'], cues: ['This sets your bike paces for the block'] };
    case 'intervals': return { rx: [`12 × ${fmtTime(s.seconds)} @ ${s.mult.toFixed(2)} × test pace · easy spin ${s.rest}`] };
    case 'primerTT': return { rx: ['3 rounds: 1:00 @ test pace · rest 1:00 · 0:20 sprint · easy 3:00', 'Rest 5:00, then 10 min for max calories'] };
    case 'ladder4min': return { rx: ['3 × 4:00 @ 0.95 · 1.00 · 1.05 × test pace · rest 3:00'] };
    default: return { rx: ['20 min easy'] };
  }
}
const isTest = s => s.kind === 'tt' || s.kind === 'primerTT';
function machineBlock(key, info, firstCycle, { forceTest = false } = {}) {
  const row = forceTest ? { kind: 'tt' } : S.rowScheme(info.week, { firstCycle });
  const bike = forceTest ? { kind: 'tt' } : S.bikeScheme(info.week, { firstCycle });
  const name = forceTest ? 'Machine Test' : row.kind === 'primerTT' ? 'Intervals + Test' : row.kind === 'easy' ? 'Easy Machine' : 'Machine Intervals';
  const block = {
    key, slotKey: `d${info.dow}.${key}.machine`, name, options: R.MACHINE_OPTIONS,
    rule: { type: 'rowPace', scheme: row }, ...rowerRx(row),
    inputs: isTest(row) ? [time('2k time')] : row.kind === 'intervals' ? [time('Avg split (optional)')] : [],
    altRules: { bike: { rule: { type: 'bikePace', scheme: bike }, ...bikeRx(bike), inputs: isTest(bike) ? [cal('10-min calories')] : bike.kind === 'intervals' ? [cal('Avg cal per interval (optional)')] : [] } },
  };
  if (isTest(row)) block.test = 'row2k';
  if (isTest(bike)) block.altRules.bike.test = 'bike10';
  if (forceTest) block.pickDefault = 'olderTest';
  return block;
}

const coreBlock = (key, dow, week) => {
  const c = R.coreFor(dow, week);
  return { key, slotKey: `d${dow}.${key}.core`, name: c.name, rule: { type: 'none' }, rx: c.rx, cues: c.cues, inputs: [] };
};
const z2Block = (key, slotKey, name, minutes, rx, extra = {}) => ({
  key, slotKey, name, rule: { type: 'zone2', minutes, ...(extra.load ? { load: extra.load } : {}) }, rx, cues: extra.cues,
  inputs: [duration(), hr()], options: extra.options, ...(extra.advanced ? { advanced: true } : {}),
});
const pmBlock = dow => z2Block('PM', `d${dow}.PM`, 'PM Zone 2', 45,
  ['30–45 min easy on the air bike (or an easy row or run)'], { options: Z2_OPTIONS, advanced: true, cues: ['Optional: never required to complete the day'] });

// Day 4 C: the press that Day 2 is not laddering this phase, 4 × 6 to beat last week, then arms.
function pressPlusArms(info) {
  const ladder = S.pressLiftFor(info.cycle, info.phase === 'D' ? 'B' : info.phase);
  const lift = ladder === 'bench' ? 'ohp' : 'bench';
  return { key: 'C', slotKey: `d4.C.press.${lift}`, name: `${LIFT_NAMES[lift]} + Arms`, lift, rule: { type: 'beatLast' },
    ...R.armsRx(lift, info.week === 13), inputs: [sets(info.week === 13 ? 3 : 4)] };
}

// ---------- days ----------
export function day1(ctx) {
  const { info, firstCycle } = ctx;
  const p = R.plyoFor(info.week);
  const plyo = { key: 'A', slotKey: 'd1.A.plyo', name: p.name, rule: { type: 'none' }, rx: p.rx, cues: p.cues, options: p.options, inputs: p.test ? [{ kind: 'height' }] : [] };
  if (p.test) plyo.test = p.test;
  return [plyo, squatBlock('B', 'backsquat', S.squatScheme(info.week), 1), machineBlock('C', info, firstCycle), coreBlock('D', 1, info.week)];
}

export function day2(ctx) {
  const { info, firstCycle } = ctx;
  const w = info.week;
  const blocks = [ladderBlock('A', 'deadlift', S.deadliftScheme(w), 2)];
  const sl = R.singleLegFor(w);
  blocks.push({ key: 'B', slotKey: `d2.B.singleleg.${sl.id}`, name: sl.name, rx: sl.rx, cues: sl.cues, inputs: [sets(sl.rx[0].startsWith('4') ? 4 : 3)],
    rule: { type: sl.mode === 'introduce' ? 'introduce' : sl.mode === 'repeat' ? 'peakRepeat' : 'none' } });
  blocks.push(ladderBlock('C', S.pressLiftFor(info.cycle, info.phase === 'D' ? 'B' : info.phase), S.pressScheme(w), 2));
  const df = S.densityFormat(w);
  if (df.kind === 'tests') {
    blocks.push({ key: 'D1', slotKey: 'd2.D.test.pushups', name: '2-Minute Push-Ups', rule: { type: 'none' }, test: 'pushups2', rx: ['Max hand-release-free push-ups in 2:00 · rest 5 min after'], inputs: [reps('Reps')] });
    blocks.push({ key: 'D2', slotKey: 'd2.D.test.situps', name: '2-Minute Sit-Ups', rule: { type: 'none' }, test: 'situps2', rx: ['Max sit-ups in 2:00 · rest 5 min after'], inputs: [reps('Reps')] });
    blocks.push({ key: 'D3', slotKey: 'd2.D.test.pullups', name: 'Max Strict Pull-Ups', rule: { type: 'none' }, test: 'pullupsMax', rx: ['One unbroken set of strict pull-ups'], inputs: [reps('Reps')] });
  } else {
    const c = R.bwCircuitFor(w);
    const fmtId = df.kind === 'emom' ? `emom${df.minutes}` : `e90x${df.sets}`;
    const line = df.kind === 'emom'
      ? `EMOM ${df.minutes} min · ${df.work} s as many reps as possible each minute, rotating stations`
      : `Every 90 s for ${df.sets} sets · ${df.work} s as many reps as possible / 45 s rest · rest 90 s after each round of 4`;
    blocks.push({ key: 'D', slotKey: `d2.D.bw.${c.id}`, name: `Bodyweight Circuit ${c.id}`, rule: { type: 'density', format: fmtId },
      rx: [line], items: c.stations.map(s => ({ text: s })), itemsLabel: 'Stations', inputs: [reps('Total reps (optional)')] });
  }
  const rounds = S.mmRounds(w, { firstCycle });
  if (rounds > 0) {
    const mm = R.mmWorkout(w);
    const cap = S.MM_CAP_MINUTES;
    blocks.push({ key: 'E', slotKey: `d2.E.mm.${mm.id}`, name: 'Mixed Modal · Moderate Pace', rule: { type: 'consistency', rounds, capMin: cap },
      rx: [`${rounds} rounds or ${cap} min, whichever comes first · moderate pace${S.mmVest(w) ? ' · 20 lb in the ruck' : ''}`],
      cues: ['Keep consistent times across all rounds', `Stop at ${cap} min even mid-round; log the rounds you finished`],
      items: mm.items, itemsLabel: 'Each round', inputs: [{ kind: 'rounds', count: rounds }] });
  }
  return blocks;
}

export function day3(ctx) {
  const { info } = ctx;
  const w = info.week;
  const code = S.runFormat(w);
  const f = R.runFormatText(code, w);
  const load = S.ruckLoad(info.cycle);
  const run = { key: 'A', slotKey: `d3.A.run.${code}`, name: f.name, rule: { type: 'runPace', format: code }, rx: [...f.rx], cues: f.cues, inputs: [] };
  if (code === 'TT5K') { run.test = 'run5k'; run.inputs = [time('5k time')]; }
  if (code === 'TEST1_5') { run.test = 'run1_5mi'; run.inputs = [time('1.5-mile time')]; }
  if (code === 'R4') run.rx.push(`Ruck load: ${load} lb`);
  const blocks = [run];
  if (code !== 'R4' && w !== 13) {
    const minutes = w === 9 ? 45 : 30;
    blocks.push({ key: 'B', slotKey: 'd3.B.ruck', name: 'Ruck March', rule: { type: 'none' }, inputs: [distance('mi')],
      rx: [`${minutes} min @ ${load} lb · ${R.ruckFormat(w)}`], cues: ['Load the ruck with the sandbag or plates; comfortable footwear'] });
  }
  const odd = R.wedOddFor(w);
  blocks.push({ key: 'C', slotKey: 'd3.C.odd', name: odd.name, rule: { type: 'none' }, rx: odd.rx, cues: odd.cues, inputs: [], options: odd.options });
  return blocks.map((b, i) => ({ ...b, key: 'ABC'[i] }));
}

export function day4(ctx) {
  const { info } = ctx;
  const v = R.pullVariant(info.week);
  return [
    z2Block('A', 'd4.A.zone2', 'Zone 2', S.zone2Minutes(info.cycle, info.week), [`${S.zone2Minutes(info.cycle, info.week)} min easy`], { options: Z2_OPTIONS, cues: ['Conversational pace, nasal breathing possible'] }),
    { key: 'B', slotKey: `d4.B.pull.${v}`, name: v === 'a' ? 'Weighted Pull-Ups + DB Row' : 'Pull-Up Ladder + Barbell Row', rule: { type: 'beatLast' }, ...R.pullRx(v), inputs: [sets(5)] },
    pressPlusArms(info),
    { key: 'D', slotKey: 'd4.D.mobility', name: 'Mobility', rule: { type: 'none' }, rx: R.mobilityRx(), inputs: [] },
  ];
}

export function day5(ctx) {
  const { info, firstCycle } = ctx;
  const w = info.week;
  const blocks = [cleanBlock('A', info, S.cleanVariantFor(info.cycle)), squatBlock('B', 'frontsquat', S.frontSquatScheme(w), 5)];
  if (w === 13) {
    blocks.push(machineBlock('C', info, firstCycle, { forceTest: true }));
  } else {
    const work = info.phase === 'A' ? 45 : 60;
    const n = info.phase === 'A' ? 6 : 4;
    const combo = R.intervalCombo(w);
    blocks.push({ key: 'C', slotKey: 'd5.C.intervals', name: 'High-Effort Intervals', rule: { type: 'intervals', work, sets: n },
      rx: [`${n} ${info.phase === 'A' ? 'sets' : 'rounds'} · 4 stations · ${work} s work / ${work} s walk`], cues: ['High effort: almost as fast as possible, keep a little in the tank'],
      items: combo.stations.map(s => ({ text: s.name, options: s.options })), itemsLabel: 'Stations · rotate each set', inputs: [] });
  }
  blocks.push(coreBlock('D', 5, w));
  return blocks;
}

export function day6(ctx) {
  const { info } = ctx;
  const w = info.week;
  const load = S.ruckLoad(info.cycle);
  if (w === 13) {
    const miles = S.ruckTestMiles(info.cycle);
    return [{ key: 'A', slotKey: 'd6.A.rucktest', name: `${miles}-Mile Ruck Test`, rule: { type: 'none' }, test: miles === 3 ? 'ruck3mi' : 'ruck4mi',
      rx: [`${miles} miles @ 45 lb for time`], cues: ['Walk or shuffle; pick a flat, measured route'], inputs: [time('Time')] }];
  }
  if (S.isLongRunWeek(w)) {
    const m = S.longDuration(info.cycle, w);
    return [z2Block('A', 'd6.A.longrun', 'Long Run', m, [`${m} min easy, conversational`], { cues: ['Roads or trail; walk breaks are fine early in the year'] })];
  }
  if (S.isLongRuckWeek(w)) {
    const m = S.longDuration(info.cycle, w);
    return [z2Block('A', 'd6.A.longruck', 'Long Ruck', m, [`${m} min @ ${load} lb at an easy pace`], { load, cues: ['Load the ruck with the sandbag or plates'] })];
  }
  const sc = R.satCircuit(w);
  return [
    z2Block('A', 'd6.A.circuits', 'Easy Circuits', 60,
      ['3 × 20 min at an easy pace: continuous movement, conversation possible, no rest needed',
        ...sc.circuits.map((c, i) => `Circuit ${i + 1}: ${c.join(' · ')}`)]),
    { key: 'B', slotKey: 'd6.B.coreEmom', name: '10-Minute Core EMOM', rule: { type: 'none' }, rx: sc.coreEmom, inputs: [] },
  ];
}

export function day7(ctx) {
  const { info } = ctx;
  const evenWeek = info.week === 1 ? 2 : info.week % 2 === 0 ? info.week : info.week - 1;
  const m = S.longDuration(info.cycle, Math.min(evenWeek, 12));
  return [
    { key: 'R', slotKey: 'd7.R.rest', name: 'Rest', rule: { type: 'none' }, rx: ['Rest. Optional 20–30 min walk and some mobility.'], inputs: [] },
    z2Block('A', 'd7.A.longz2', 'Long Zone 2', m, [`${m} min easy on whichever modality Day 6 did not use`],
      { cues: ['Bike if Day 6 was a run or ruck; run or ruck if Day 6 was circuits'], options: [{ id: 'bike', name: 'Air bike', needs: [] }, { id: 'run', name: 'Run', needs: [] }, { id: 'ruck', name: 'Ruck', needs: [] }], advanced: true }),
  ];
}

export function graduation() {
  return [{ key: 'R', slotKey: 'grad', name: 'You have the base', rule: { type: 'none' }, inputs: [],
    rx: ['Rest day.', 'Pick the thing: marathon, selection, academy test. Specialize for 8–12 weeks, then come back to Day 1.'] }];
}

export const DAY_BUILDERS = { 1: day1, 2: day2, 3: day3, 4: day4, 5: day5, 6: day6, 7: day7 };
export { pmBlock };
