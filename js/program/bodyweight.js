// The Bodyweight program: slow, controlled reps on a handful of moves. Pure functions of the day number, with no
// last day. Days 1–84 are three full-body rotations a week; from day 85 it is one body part a day, repeating.
// Spec: docs/superpowers/specs/2026-11-13-bodyweight-path-design.md

export const FOUNDATION_DAYS = 84;

const reps = (label, placeholder = 'reps') => ({ kind: 'reps', label, placeholder });
const minutes = () => ({ kind: 'duration' });

/**
 * @param {number} n 1 or more; there is no upper limit
 * @returns {{n:number, week:number, dow:number, phase:'F'|'S', ab:'A'|'B', rest:boolean}}
 */
export function bwDayInfo(n) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`day out of range: ${n}`);
  const week = Math.ceil(n / 7);
  const dow = ((n - 1) % 7) + 1;
  return { n, week, dow, phase: n <= FOUNDATION_DAYS ? 'F' : 'S', ab: week % 2 ? 'A' : 'B', rest: dow === 7 };
}

/** Reps per move on a full-body day (per leg for leg moves). */
export const foundationTarget = week => (week <= 4 ? 25 : week <= 8 ? 30 : 35);

const BAND_CUES = [
  'Start from a full hang and pull until your chin clears the bar',
  'Choose a band that gives you sets of 3 to 6; go lighter once sets pass 8',
  'Nothing left with the band? Step up to the top and lower yourself as slowly as you can',
];
const MOVES = {
  splitsquat: { name: 'Bulgarian Split Squats', perLeg: true,
    how: 'Back foot up on a bench; all reps on one leg, then the other',
    cues: ['Lower until the back knee is just off the floor; keep the front heel down', 'Hold the rack with one hand if balance is what stops you', 'Target feeling easy? Hold a dumbbell in each hand'] },
  lunge: { name: 'Lunges', perLeg: true,
    how: 'Step back into each rep; all reps on one leg, then the other',
    cues: ['Back knee brushes the floor; stand up by pushing through the front foot', 'Chest tall, front knee in line with your toes', 'Target feeling easy? Hold a dumbbell in each hand'] },
  stepup: { name: 'Step-Ups', perLeg: true,
    how: 'One foot stays on a bench or box; all reps on one leg, then the other',
    cues: ['Stand all the way up, then lower yourself slowly: the way down is the work', 'Do not spring off the bottom foot', 'Too high to control? Use a lower step'] },
  pushup: { name: 'Push-Ups',
    how: 'Chest to a fist above the floor, then press to straight arms',
    cues: ['Body in one line from head to heels', 'Sets of 5 out of reach? Put your hands on a bench', 'Target feeling easy? Put your feet on the bench'] },
  dip: { name: 'Dips, Then Push-Ups',
    how: 'Dips on the handles first; when form goes, finish the count with push-ups',
    cues: ['Shoulders down; lower until your upper arms are level with the floor and no deeper', 'Loop a band across the handles and kneel on it if you cannot get 3 clean dips', 'Any twinge at the front of the shoulder: stop dipping and switch to push-ups'] },
  pullup: { name: 'Pull-Ups',
    how: 'Palms facing away; band looped over the bar and under a foot or knee',
    cues: BAND_CUES },
  chinup: { name: 'Chin-Ups',
    how: 'Palms facing you; band looped over the bar and under a foot or knee',
    cues: BAND_CUES },
  ohp: { name: 'Standing Overhead Press',
    how: 'Barbell or dumbbells from the shoulders to straight arms overhead',
    cues: ['Squeeze your glutes and keep your ribs down so your lower back does not arch', 'Pick a load you could press 15 to 20 times when fresh', 'No leg drive: the knees stay locked'] },
  kneeraise: { name: 'Hanging Knee Raises',
    how: 'Hang from the bar and lift your knees above your hips',
    cues: ['No swinging: come to a still hang before each rep', 'Lower as slowly as you lifted', 'Grip giving out first? Do the same movement lying on a bench'] },
  calf: { name: 'Calf Raises',
    how: 'Balls of the feet on a plate or step, heels hanging off',
    cues: ['All the way up, hold a beat, then down into a full stretch', 'Touch the rack for balance, not for help', 'Target feeling easy? Hold a dumbbell or work one leg at a time'] },
};

function fixedBlock(id, target) {
  const m = MOVES[id];
  const rule = { type: 'slowReps', mode: 'fixed', target };
  if (m.perLeg) rule.perLeg = true;
  return { slotKey: `bw.f.${id}`, name: m.name, rule, rx: [`${target} ${m.perLeg ? 'per leg' : 'total'}`, m.how], cues: m.cues,
    inputs: [reps(m.perLeg ? 'Per leg' : 'Total')] };
}
function buildBlock(slot, id, target, capMinutes) {
  const m = MOVES[id];
  const rule = { type: 'slowReps', mode: 'build', target };
  if (m.perLeg) rule.perLeg = true;
  if (capMinutes) rule.capMinutes = capMinutes;
  const count = reps(m.perLeg ? 'Per leg' : 'Total');
  return { slotKey: `bw.s.${slot}`, name: m.name, rule, rx: [`Goal ${target}${m.perLeg ? ' per leg' : ''}`, m.how], cues: m.cues,
    inputs: capMinutes ? [count, minutes()] : [count] };
}
const walkBlock = name => ({ slotKey: 'bw.walk', name, rule: { type: 'none' }, rx: ['Build toward 10,000 steps across the day'],
  cues: ['Easy pace: you should be able to hold a conversation', 'Several short walks count the same as one long one'], inputs: [reps('Steps', 'steps')] });
const bikeBlock = () => ({ slotKey: 'bw.bike', name: 'Bike Intervals', advanced: true, rule: { type: 'none' },   // `advanced` renders as Optional
  rx: ['8 rounds: 20 seconds hard, 100 seconds easy', '16 minutes in all'],
  cues: ['Skip it when you feel run down', 'A rower works just as well'], inputs: [{ kind: 'cal', label: 'Total calories' }] });
const restBlock = () => ({ slotKey: 'bw.rest', name: 'Rest', rule: { type: 'none' }, rx: ['Rest. An easy walk if you feel like it.'], inputs: [] });

// ----- days 1–84 -----
const LEGS = ['splitsquat', 'lunge', 'stepup'];
const PUSH = { A: ['pushup', 'dip', 'pushup'], B: ['dip', 'pushup', 'dip'] };
const PULL = { A: ['pullup', 'chinup', 'pullup'], B: ['chinup', 'pullup', 'chinup'] };
const FOUNDATION_TITLES = ['Full Body', 'Walk', 'Full Body', 'Walk', 'Full Body', 'Walk', 'Rest'];
const FOUNDATION_BRIEF = [
  'Work through the moves as a rotation: one set of each, then round again until every target is met.',
  'Rest 60 to 90 seconds between moves. Stop each set 1 or 2 reps short of failure.',
  'Every rep at the speed shown in the target box.',
];
const FOUNDATION_MINUTES = { 25: 30, 30: 35, 35: 40 };

function foundationBlocks(info) {
  if (info.dow === 7) return [restBlock()];
  if (info.dow % 2 === 0) return [walkBlock('Walk')];
  const i = (info.dow - 1) / 2;
  const t = foundationTarget(info.week);
  const out = [LEGS[i], PUSH[info.ab][i], PULL[info.ab][i], 'ohp', 'kneeraise', 'calf'].map(id => fixedBlock(id, t));
  if (info.dow !== 3) out.push(bikeBlock());
  return out;
}

// ----- day 85 onward -----
// [slot, move, goal, minutes allowed for a met goal]
const SPLIT = {
  pullup: ['pullup', 'pullup', 100, 45], chest: ['chest', 'dip', 100, 45],
  splitsquat: ['splitsquat', 'splitsquat', 35], lunge: ['lunge', 'lunge', 35], stepup: ['stepup', 'stepup', 30],
  chinup: ['chinup', 'chinup', 100, 45], ohp: ['ohp', 'ohp', 100, 45], kneeraise: ['kneeraise', 'kneeraise', 100, 45],
  calf: ['calf', 'calf', 100, 15],
};
const SPLIT_DAYS = [
  { title: 'Back + Calves', slots: ['pullup', 'calf'], minutes: 60 },
  { title: 'Chest', slots: ['chest'], minutes: 45, bike: true },
  { title: 'Legs + Calves', slots: ['splitsquat', 'lunge', 'stepup', 'calf'], minutes: 60 },
  { title: 'Arms', slots: ['chinup'], minutes: 45 },
  { title: 'Shoulders + Calves', slots: ['ohp', 'calf'], minutes: 60 },
  { title: 'Core', slots: ['kneeraise'], minutes: 30, bike: true },
  { title: 'Rest', slots: [], minutes: 0 },
];
const SPLIT_BRIEF = [
  'One part today. Slow sets, each stopping a rep short of failure, with 30 seconds to 2 minutes of rest between them.',
  'Until you have a number to beat, stop at 30 minutes. After that, stop at 45 even if you are short of the goal.',
];
const LEGS_BRIEF = [
  'Three leg moves today, one after the other. Slow sets, each stopping a rep short of failure, with 30 seconds to 2 minutes of rest.',
  'Stop at 45 minutes even if you are short of the goals.',
];

function splitBlocks(info) {
  if (info.dow === 7) return [restBlock()];
  const day = SPLIT_DAYS[info.dow - 1];
  const out = day.slots.map(s => buildBlock(...SPLIT[s]));
  out.push(walkBlock('Steps'));
  if (day.bike) out.push(bikeBlock());
  return out;
}

/** Every slow-rep move with the slot its history lives under, for the scorecard. */
export const BW_MOVES = [
  ...Object.keys(MOVES).map(id => ({ phase: 'F', ...fixedBlock(id, foundationTarget(1)) })),
  ...Object.values(SPLIT).map(args => ({ phase: 'S', ...buildBlock(...args) })),
].map(b => ({ slotKey: b.slotKey, name: b.name, phase: b.phase, rule: b.rule }));

export function bwTitle(n) {
  const info = bwDayInfo(n);
  return info.phase === 'F' ? FOUNDATION_TITLES[info.dow - 1] : SPLIT_DAYS[info.dow - 1].title;
}

export function bwSession(n) {
  const info = bwDayInfo(n);
  const foundation = info.phase === 'F';
  const raw = foundation ? foundationBlocks(info) : splitBlocks(info);
  const training = raw.some(b => b.rule.type === 'slowReps');
  let estMinutes = 0; let brief = [];
  if (foundation && training) { estMinutes = FOUNDATION_MINUTES[foundationTarget(info.week)]; brief = FOUNDATION_BRIEF; }
  else if (!foundation && training) { estMinutes = SPLIT_DAYS[info.dow - 1].minutes; brief = info.dow === 3 ? LEGS_BRIEF : SPLIT_BRIEF; }
  return {
    n, path: 'bodyweight', cycle: null, week: info.week, dow: info.dow, phase: info.phase,
    phaseLabel: foundation ? 'Foundation' : 'One part a day',
    title: bwTitle(n), rest: info.rest, graduation: false, estMinutes, brief,
    rotation: foundation && training,      // the moves are done as rounds, not one after another
    blocks: raw.map((b, i) => ({ key: 'ABCDEFGH'[i], ...b })),
  };
}
