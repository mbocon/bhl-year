// The Bodyweight program: slow, controlled reps on a handful of moves, with no last day. Every week has the same
// shape: full body on days 1, 4 and 6, a jiu-jitsu class on days 3, 5 and 7, rest on day 2. Rep targets rise for
// eight weeks, then stay put while the reps slow down and the moves get harder. Pure functions of the day number.
// Spec: docs/superpowers/specs/2026-11-13-bodyweight-path-design.md

export const BUILD_DAYS = 56;   // eight weeks of rising rep targets
const FULL_TARGET = 35;         // three sessions of 35 is about 100 reps of a move each week

const reps = (label, placeholder = 'reps') => ({ kind: 'reps', label, placeholder });
const minutes = () => ({ kind: 'duration' });

/**
 * @param {number} n 1 or more; there is no upper limit
 * @returns {{n:number, week:number, dow:number, phase:'B'|'S', ab:'A'|'B', rest:boolean}} phase B builds reps, S slows them
 */
export function bwDayInfo(n) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`day out of range: ${n}`);
  const week = Math.ceil(n / 7);
  const dow = ((n - 1) % 7) + 1;
  return { n, week, dow, phase: n <= BUILD_DAYS ? 'B' : 'S', ab: week % 2 ? 'A' : 'B', rest: dow === 2 };
}

/** Reps per move on a full-body day (per leg for leg moves). */
export const repTarget = week => (week <= 4 ? 25 : week <= 8 ? 30 : FULL_TARGET);

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
  ohp: { name: 'Overhead Press',
    how: 'Standing, with a barbell or dumbbells: press from the shoulders to straight arms overhead',
    cues: ['Squeeze your glutes and keep your ribs down so your lower back does not arch', 'Pick a load you could press 15 to 20 times when fresh', 'No leg drive: the knees stay locked'] },
  kneeraise: { name: 'Hanging Knee Raises',
    how: 'Hang from the bar and lift your knees above your hips',
    cues: ['No swinging: come to a still hang before each rep', 'Lower as slowly as you lifted', 'Grip giving out first? Do the same movement lying on a bench'] },
  calf: { name: 'Calf Raises',
    how: 'Balls of the feet on a plate or step, heels hanging off',
    cues: ['All the way up, hold a beat, then down into a full stretch', 'Touch the rack for balance, not for help', 'Target feeling easy? Hold a dumbbell or work one leg at a time'] },
};

function moveBlock(id, target) {
  const m = MOVES[id];
  const rule = { type: 'slowReps', target };
  if (m.perLeg) rule.perLeg = true;
  if (target < FULL_TARGET) rule.hold = true;     // reps first: the speed starts to slow only once the target stops rising
  return { slotKey: `bw.f.${id}`, name: m.name, rule, rx: [`${target} ${m.perLeg ? 'per leg' : 'total'}`, m.how], cues: m.cues,
    inputs: [reps(m.perLeg ? 'Per leg' : 'Total')] };
}
const stepsBlock = () => ({ slotKey: 'bw.walk', name: 'Steps', rule: { type: 'none' }, rx: ['Goal: 10,000 steps', 'Build toward it week by week; every walk in the day counts'],
  cues: ['Easy pace: you should be able to hold a conversation', 'Several short walks add up the same as one long one'], inputs: [reps('Steps', 'steps')] });
const classBlock = () => ({ slotKey: 'bw.class', name: 'Jiu-Jitsu Class', rule: { type: 'none' }, fig: '',
  rx: ["Class is today's training and today's cardio", 'Class canceled? Do one of the cardio options below in its place'], cues: [], inputs: [minutes()] });

// One optional cardio block a day, with three sessions to pick from. The last line says when it fits that kind of day.
const CARDIO = [
  { id: 'easy', name: 'Easy', rx: ['30 to 40 minutes', 'Bike, rower or a brisk walk at a pace where you can hold a conversation'],
    cues: ['Costs the least recovery, so it is the safe pick when tomorrow is a full-body day'] },
  { id: 'steady', name: 'Steady', rx: ['20 minutes', 'Bike or rower at one pace you can hold the whole way, where you can say a few words at a time'],
    cues: ['Start easier than you think you need to: the last 5 minutes should be the hard part'] },
  { id: 'intervals', name: 'Intervals', rx: ['16 minutes', '8 rounds on the bike or rower: 20 seconds hard, 100 seconds easy'],
    cues: ['Hard is a pace you could hold for about a minute, not an all-out sprint', 'Skip this one when you feel run down'] },
];
const CARDIO_NOTE = {
  lift: 'Only after the session, and only if you still feel good',
  rest: 'Only if you feel good: a full rest day does just as much for you',
  class: 'For a day class is canceled, or a day you still feel fresh after it',
};
function cardioBlock(kind) {
  const [first, ...others] = CARDIO.map(o => ({ rule: { type: 'none' }, rx: [...o.rx, CARDIO_NOTE[kind]], cues: o.cues }));
  return { slotKey: 'bw.cardio', name: 'Cardio', advanced: true, ...first, inputs: [minutes()],   // `advanced` renders as Optional
    fig: '',      // nothing beside the name on a closed card: the Optional tag and the chosen option already fill the row
    options: CARDIO.map(o => ({ id: o.id, name: o.name, needs: [] })),
    altRules: Object.fromEntries(others.map((o, i) => [CARDIO[i + 1].id, o])) };
}

// ----- the week -----
const WEEK = ['lift', 'rest', 'class', 'lift', 'class', 'lift', 'class'];
const TITLES = { lift: 'Full Body', rest: 'Rest', class: 'Jiu-Jitsu' };
const LIFT_DAYS = [1, 4, 6];
const LEGS = ['splitsquat', 'lunge', 'stepup'];
const PUSH = { A: ['pushup', 'dip', 'pushup'], B: ['dip', 'pushup', 'dip'] };
const PULL = { A: ['pullup', 'chinup', 'pullup'], B: ['chinup', 'pullup', 'chinup'] };
const LIFT_BRIEF = [
  'Each pair is two moves back to back: one set of the first, straight into one set of the second, then rest 60 to 90 seconds.',
  'Go through all three pairs, then round again until every target is met. Stop each set 1 or 2 reps short of failure.',
  'Every rep at the speed shown in the target box.',
];
const LIFT_MINUTES = { 25: 35, 30: 40, 35: 45 };
const ALSO = 'Also today';

function liftBlocks(info) {
  const i = LIFT_DAYS.indexOf(info.dow);
  const t = repTarget(info.week);
  const pairs = [[PULL[info.ab][i], PUSH[info.ab][i]], [LEGS[i], 'kneeraise'], ['ohp', 'calf']];
  const paired = pairs.flatMap((pair, p) => pair.map(id => ({ ...moveBlock(id, t), group: `Pair ${p + 1}` })));
  return [...paired, { ...stepsBlock(), group: ALSO }, { ...cardioBlock('lift'), group: ALSO }];
}

/** Every slow-rep move with the slot its history lives under and its rule in the given week, for the scorecard. */
export const bwMoves = week => Object.keys(MOVES).map(id => moveBlock(id, repTarget(week))).map(b => ({ slotKey: b.slotKey, name: b.name, rule: b.rule }));

export const bwTitle = n => TITLES[WEEK[bwDayInfo(n).dow - 1]];

export function bwSession(n) {
  const info = bwDayInfo(n);
  const kind = WEEK[info.dow - 1];
  const lift = kind === 'lift';
  const raw = lift ? liftBlocks(info) : kind === 'class' ? [classBlock(), stepsBlock(), cardioBlock('class')] : [stepsBlock(), cardioBlock('rest')];
  return {
    n, path: 'bodyweight', cycle: null, week: info.week, dow: info.dow, phase: info.phase,
    phaseLabel: info.phase === 'B' ? 'Building reps' : 'Slow reps',
    title: TITLES[kind], rest: info.rest, graduation: false,
    estMinutes: lift ? LIFT_MINUTES[repTarget(info.week)] : 0,
    brief: lift ? LIFT_BRIEF : [],
    rotation: raw.filter(b => b.rule.type === 'slowReps').length,      // how many of the blocks are the paired moves, done as rounds
    blocks: raw.map((b, i) => ({ key: 'ABCDEFGH'[i], ...b })),
  };
}
