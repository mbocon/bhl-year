// Movement rotations, pools, and equipment-tagged options (spec §4.4). Pure data + lookups.
// Option = { id, name, needs: string[] } ; needs keys: box, rope, kb, rings, climbRope, hurdles, vest, slamBall

const opt = (id, name, needs = []) => ({ id, name, needs });

export const MACHINE_OPTIONS = [opt('rower', 'Rower'), opt('bike', 'Air bike')];

export function visibleOptions(options, equipment = {}) {
  const vis = options.filter(o => o.needs.every(n => equipment && equipment[n]));
  return vis.length ? vis : [options[0]];
}

// ---------- Day 1 A: plyometrics ----------
const PLYO = [
  { name: 'Drop Jump → Vertical Jump', rx: ['5 × 3, rest 90 s'], cues: ['Step off, absorb into a quarter squat, jump as high as possible'],
    options: [opt('box20', 'Step off a 20″ box', ['box']), opt('bench', 'Step off the bench')] },
  { name: 'Seated Box Jump', rx: ['5 × 3, rest 2 min'], cues: ['Sit on the bench; raise the box each set if you can. Challenging, not a max'],
    options: [opt('boxjump', 'Seated box jump', ['box']), opt('broad', 'Seated jump into broad jump')] },
  { name: 'Kneeling Jump → Vertical Jump', rx: ['5 × 3, rest 90 s'], cues: ['From both knees, swing up to your feet and straight into a vertical jump'],
    options: [opt('kneel', 'Kneeling jump to vertical')] },
  { name: 'Standing Rebounding Hurdle Jumps', rx: ['5 × (2 × 3) consecutive jumps, rest 2–3 min'], cues: ['3 obstacles: 3 jumps out, turn, 3 back. Raise the height only if you still rebound off each one'],
    options: [opt('improv', 'Over med ball / sandbag / stacked plates'), opt('hurdles', 'Over hurdles', ['hurdles'])] },
  { name: 'Max Box Jump', rx: ['Work to a max height for today, rest 60–90 s between big attempts'], cues: ['One step in, plant both feet, jump to the top'],
    options: [opt('box', 'Max box jump', ['box']), opt('broad', 'Max broad jump for distance')] },
  { name: 'Lateral Single-Leg Hop-Overs', rx: ['5 × 10 alternating over a plate, rest 3 min'], cues: ['Stick each landing before the next hop'],
    options: [opt('plate', 'Over a plate or line')] },
];
export function plyoFor(week) {
  if (week === 13) return { ...PLYO[0], rx: ['3 × 3, easy, rest 90 s'] };
  if (week === 12) return { ...PLYO[4], test: 'jumpMax' };
  return PLYO[(week - 1) % 6];
}

// ---------- Core (Day 1 D, Day 5 D) ----------
const CORE = [
  { name: 'Barbell Rollouts', rx: ['4 × 10, rest 2 min'] },
  { name: 'Half-Kneeling Lateral Med-Ball Throw', rx: ['4 × 10/side @ 14–25 lb, rest 2 min'], cues: ['Throw to the side with the knee up; catch and brace the rebound each rep'] },
  { name: 'DB Turkish Get-Up', rx: ['3 × 5/side, increase weight if possible, rest 2–3 min'], cues: ['New to it? Spend 15 min practising positions with light weight'] },
  { name: 'Side-Plank Arch-Up + Side-Plank Twist', rx: ['3 × 8/side of each, rest 30 s between, 90 s after'] },
  { name: 'Seated Pike Hold', rx: ['4 × 30 s, rest 90 s'], cues: ['Hands as far forward as possible; slide them back as you fatigue to keep heels off the floor'] },
  { name: 'L-Hang on the Pull-Up Bar', rx: ['Accumulate 3 min in as few sets as possible'], cues: ['Bend one knee if you cannot hold 30 s on the first set'] },
  { name: 'Hollow Body Hold', rx: ['Accumulate 4–5 min in as few sets as possible, rest 90 s'] },
  { name: 'Half-Kneeling Landmine Twist', rx: ['Tempo 2011 · 4 × 8/side, empty bar up to 25 lb, rest 60 s'], cues: ['Set the bar in a corner or against two plates; keep the tempo'] },
  { name: 'DB Russian Twist', rx: ['4 × 14–18 alternating @ 35 lb, rest 2 min'], cues: ['Feet on the floor, half-second pause in the middle, DB to 1 cm off the floor each rep'] },
  { name: 'Front-Leaning Rest on Dip Bars', rx: ['3 sets for max time, rest 2 min'] },
  { name: 'Barbell Floor Wipers', rx: ['4 × 12 alternating @ 95 lb, rest 90 s–2 min'] },
  { name: 'Hanging Around-the-World', rx: ['4 × 10 alternating, rest 2 min'] },
];
export function coreFor(dow, week) {
  const idx = dow === 5 ? (week + 5) % 12 : (week - 1) % 12;
  return CORE[idx];
}

// ---------- Day 2 B: single-leg ----------
const SL = {
  brl: { id: 'brl', name: 'Barbell Back-Rack Reverse Lunge', rx: ['3 × 8/leg, not alternating, rest 3 min'] },
  stepup: { id: 'stepup', name: 'DB Front-Rack Step-Up to Bench', rx: ['3 × 8/leg, not alternating, rest 3 min'] },
  rfe: { id: 'rfe', name: 'Rear-Foot-Elevated DB Split Squat', rx: ['3 × 8/leg @ 35–50 lb/hand, rest 2 min'], cues: ['Set a target to touch with the knee; work sideways to a mirror and keep the torso upright'] },
  rfe2: { id: 'rfe', name: 'Rear-Foot-Elevated DB Split Squat', rx: ['3 × 8/leg @ 40–55 lb/hand, rest 2 min'], cues: ['Heavier than last time; full range, upright torso'] },
  frl: { id: 'frl', name: 'Barbell Front-Rack Reverse Lunge', rx: ['3 × 8/leg, not alternating, rest 3 min'] },
  bwl: { id: 'bwl', name: 'Barbell Back-Rack Walking Lunge', rx: ['4 × 10 alternating, rest 3–4 min'] },
  fwl: { id: 'fwl', name: 'Barbell Front-Rack Walking Lunge', rx: ['4 × 10 alternating, rest 3–4 min'] },
};
const SL_WEEKS = { 1: ['brl', 'introduce'], 2: ['brl', 'repeat'], 3: ['stepup', 'introduce'], 4: ['rfe', 'introduce'], 5: ['frl', 'introduce'], 6: ['frl', 'repeat'],
  7: ['bwl', 'introduce'], 8: ['bwl', 'repeat'], 9: ['rfe2', 'introduce'], 10: ['stepup', 'introduce'], 11: ['fwl', 'introduce'], 12: ['fwl', 'repeat'] };
export function singleLegFor(week) {
  if (week === 13) return { ...SL.brl, rx: ['2 × 8/leg, bodyweight or light, rest 2 min'], mode: 'deload' };
  const [key, mode] = SL_WEEKS[week];
  const base = SL[key];
  const note = mode === 'introduce' ? 'Increase weight each set if possible' : 'All sets at the peak weight you reached last time';
  return { ...base, cues: [...(base.cues || []), note], mode };
}

// ---------- Day 2 D: bodyweight circuits ----------
const BW = {
  A: ['Inverted rows under a bar in the rack (shoulders under the bar, body as parallel to the floor as possible)', 'Dips on the rack attachment', 'Jumping switch lunges', 'Hanging knee raises'],
  B: ['Strict pull-ups', 'Hand-release push-ups', 'Air squats', 'Sit-ups'],
};
export function bwCircuitFor(week) {
  const id = week % 2 === 1 ? 'A' : 'B';
  return { id, stations: BW[id] };
}

// ---------- Day 2 E: mixed modal ----------
const DBSWING = [opt('db', '15 DB swings @ 50–70 lb'), opt('kb', '15 KB swings @ 24 kg', ['kb'])];
const MM = [
  { id: 'MM1', items: [{ text: '30 s air bike', options: [opt('bike', '30 s air bike'), opt('du', '50 double-unders', ['rope'])] }, { text: '15 thrusters @ 75–95 lb' }, { text: '10 lateral burpees over the bar' }, { text: '400 m run' }] },
  { id: 'MM2', items: [{ text: '15 DB swings @ 50–70 lb', options: DBSWING }, { text: '4 towel pull-ups', options: [opt('towel', '4 towel pull-ups'), opt('rope', '2 rope climbs', ['climbRope'])] }, { text: '10 × 50 ft burpee shuttle (1 burpee at the start of each length)' }] },
  { id: 'MM3', items: [{ text: '10 pull-ups' }, { text: '15 step-overs on the bench', options: [opt('bench', '15 step-overs on the bench'), opt('box', '15 step-down box jumps @ 24″', ['box'])] }, { text: '200 ft bear crawl' }, { text: '400 m run' }] },
  { id: 'MM4', items: [{ text: '200 m run' }, { text: '15 sandbag ground-to-shoulder', options: [opt('sb', '15 sandbag ground-to-shoulder'), opt('slam', '15 med-ball slams @ 20–30 lb', ['slamBall'])] }, { text: '10 burpees + jump over the bar', options: [opt('bar', '10 burpees + jump over the bar'), opt('bbjo', '10 burpee box jump-overs @ 24″', ['box'])] }, { text: '5 power cleans @ 135–155 lb (should feel easy while fresh)' }, { text: '250 m row' }] },
  { id: 'MM5', items: [{ text: '15 DB swings @ 50–70 lb', options: DBSWING }, { text: '15 cal row' }, { text: '15 lateral burpees over the rower' }, { text: '200 ft farmer carry @ 75 lb/hand' }] },
  { id: 'MM6', items: [{ text: '20 deadlifts @ 45–55% of your max' }, { text: '20 cal bike' }, { text: '20 V-ups' }, { text: '90 s easy air bike', options: [opt('bike', '90 s easy air bike'), opt('su', '200 single-unders', ['rope'])] }] },
  { id: 'MM7', items: [{ text: '250 m row' }, { text: '20 lateral bar hops' }, { text: '15 thrusters @ 75–95 lb' }, { text: '10 burpee step-ups to the bench', options: [opt('bench', '10 burpee step-ups to the bench'), opt('bbj', '10 burpee box jumps @ 24″', ['box'])] }] },
  { id: 'MM8', items: [{ text: '200 m run' }, { text: '12 alternating DB power snatch @ 40–60 lb' }, { text: '10 no-jump burpees' }, { text: '60 s walk' }] },
];
export const mmWorkout = week => MM[(week - 1) % 8];

// ---------- Day 3 A: run formats ----------
const RUNS = {
  R1: { name: 'Moderate / Fast / Walk × 10', rx: ['10 rounds: 1:00 moderate · 1:00 fast · 1:00 walk'], cues: ['Hold the moderate pace all the way; push the fast minute if you can'] },
  R2: { name: 'Build 2-3-4', rx: ['3 × (2:00 run, pace rising each round · 1:00 walk)', '2 × (3:00 at your fastest 2:00 pace · 1:00 walk)', '1 × 4:00 at that pace · 2:00 walk'], cues: ['No rest between blocks'] },
  R3: { name: 'Row-Run-Bike Ladder', rx: ['3 rounds; 30 s walk between rungs, 3:00 walk between rounds', '45 s row · 45 s run (shuttle) · 45 s bike', '60 s · 60 s · 60 s', '75 s · 75 s · 75 s', '90 s · 90 s · 90 s'], cues: ['Set a comfortable but challenging pace on the first rung and hold it'] },
  R4: { name: 'Run-Ruck-Run', rx: ['20 min moderate run (about 5k pace)', '20 min ruck march at the cycle load', '20 min easy run'], cues: ['No rest: run out and back, ruck up and go out and back, dump the ruck and go straight back out'] },
  R5: { name: 'Descending 6-5-4-3-2-1', rx: ['6:00 run · 1:00 walk', '5:00 · 1:00', '4:00 · 1:00', '3:00 · 1:00', '2:00 · 1:00', '1:00 · 1:00'], cues: ['Start at a moderate pace; each run faster than the last'] },
  R6: { name: 'Pyramid', rx: ['4 × (1:00 easy · 1:00 walk)', '3 × (2:00, pace rising · 1:00 walk)', '2 × (3:00 at your fastest 2:00 pace · 1:00 walk)', '1 × 4:00 at that pace · 2:00 walk', '4 × (1:00 easy · 1:00 walk)'] },
  TT5K: { name: '5k Run Time Trial', rx: ['Warm up 10 min easy', '5000 m for time'], cues: ['This sets your run paces for the next weeks'] },
  TEST1_5: { name: '1.5-Mile Run Test', rx: ['1.5 miles (2414 m) for time', 'Then 20 min easy'] },
};
export function runFormatText(code, week) {
  const f = RUNS[code];
  if (code === 'R4' && week === 12) return { ...f, rx: f.rx.map(l => l.replace('20 min ruck', '30 min ruck')) };
  return f;
}

// ---------- Day 3 B: ruck formats ----------
const RUCK = ['Continuous at a comfortable pace', '1 min fast / 2 min comfortable', '2 min fast / 1 min comfortable', 'Pick a target distance that will be hard to reach: 15 min out, 15 min back at the same pace'];
export const ruckFormat = week => RUCK[(week - 1) % 4];

// ---------- Day 3 C: crawls, drags, odd objects ----------
const WED = [
  { name: 'Backward Sled Drag + Supine Sprint Starts', rx: ['Backward sled drag 3 × 150 ft, moderate load, rest 1 min', 'Supine sprint starts 3 × 6: start on your back, flip prone, jump up and sprint 50 ft; reset and go again'] },
  { name: 'Ruck Burpees + Ruck Bear Crawl', rx: ['Ruck burpees 5 × 8, rest 90 s: start prone with the ruck on, roll to seated, stand up, drop to one knee and roll back to prone; alternate legs, go slow', 'Ruck bear crawl 5 × (1:00 on / 1:00 off)'] },
  { name: 'Cossack Squats + Backwards Running + Burden Carry', rx: ['Goblet Cossack squat 3 × 12 alternating @ 35 lb, rest 30 s', 'Backwards running 3 × 200 m as fast as safely possible, rest 2 min: long strides, not a backpedal', 'Burden carry: 20 min loaded walk with the sandbag or an odd object around 50 lb'] },
  { name: 'Ruck Lunges + Inchworms', rx: ['EMOM 10 min', 'Min 1: 30 s ruck bear-hug walking lunge (ruck worn on the front)', 'Min 2: 30 s inchworms'] },
  { name: 'Single-Leg RDL + Lateral Bench Step-Over', rx: ['Single-leg DB RDL 3 × 6/leg @ 35 lb/hand, rest 1 min', 'Goblet lateral bench step-over into balance 3 × 12 alternating @ 35 lb, rest 2 min'] },
  { name: 'Sled Push + Bear Crawl', rx: ['Forward sled push 4 × 100 ft, rest 1 min', 'Bear crawl 4 × 100 ft, rest 1 min'] },
];
export function wedOddFor(week) {
  if (week === 13) return { name: 'Bird Dog + Dead Bug', rx: ['Bird dog 4 × 5/side, slow', 'Alternating dead bug 4 × 10, rest 60 s'] };
  return WED[(week - 1) % 6];
}

// ---------- Day 4 ----------
export const pullVariant = week => (week % 2 === 1 ? 'a' : 'b');
export function pullRx(variant) {
  return variant === 'a'
    ? { rx: ['Weighted pull-ups 5 × 3–5, rest 2–3 min (DB between the feet or wear the ruck)', 'DB row 4 × 10/arm, rest 90 s'], cues: ['No 5 strict pull-ups yet? Do 5 × 8 inverted rows and 5 × 3 slow eccentric pull-ups instead'] }
    : { rx: ['Pull-up ladder for 10 min: 1, 2, 3, 4, 5 … rest as needed; restart at 1 when you fail', 'Barbell row 4 × 8, rest 2 min'], cues: ['No 5 strict pull-ups yet? Do 5 × 8 inverted rows and 5 × 3 slow eccentric pull-ups instead'] };
}
export const armsRx = () => ({ rx: ['EZ-bar curl 3 × 10–12', 'EZ-bar skull crusher or dips 3 × 10–12', 'DB lateral raise 3 × 12–15', 'DB rear-delt fly 3 × 15'], cues: ['Rest 60–90 s between sets; beat last week by a rep or 5 lb'] });
export const mobilityRx = () => ['10 min: hips (90/90 switches, couch stretch) · thoracic spine (open books, bench T-spine extension) · ankles (knee-to-wall)'];

// ---------- Day 5 C: interval stations ----------
const POOL = {
  jump: [opt('njb', 'No-jump burpees'), opt('sdbj', 'Step-down box jumps @ 24″', ['box']), opt('ljob', 'Lateral jumps over the bar'), opt('towel', 'Towel pull-ups'), opt('btt', 'Burpee to target (touch 6″ above your reach)')],
  machine: [opt('row', 'Rower'), opt('bike', 'Air bike'), opt('shuttle', 'Shuttle run 50 ft'), opt('du', 'Double-unders or fast single-unders', ['rope'])],
  loaded: [opt('dbs', 'DB swings @ 50–70 lb'), opt('dbhpc', 'DB hang power clean @ 40–60 lb/hand'), opt('pcpp', 'Power clean + push press @ 75 lb'), opt('sbc', 'Sandbag clean'), opt('slam', 'Med-ball slam', ['slamBall']), opt('kbs', 'KB swing @ 24 kg', ['kb'])],
  crawl: [opt('sled', 'Sled push'), opt('bear', 'Bear crawl'), opt('mc', 'Mountain climbers'), opt('bsd', 'Backward sled drag')],
};
const COMBOS = [[0, 0, 1, 0], [1, 3, 2, 1], [2, 1, 0, 2], [3, 2, 3, 3], [4, 0, 0, 1], [0, 1, 2, 0]];
export function intervalCombo(week) {
  const picks = COMBOS[(week - 1) % 6];
  const cats = ['jump', 'machine', 'loaded', 'crawl'];
  return {
    stations: cats.map((category, i) => {
      const pool = POOL[category];
      const pick = pool[picks[i]];
      return { category, name: pick.name, options: [pick, ...pool.filter(o => o !== pick)] };
    }),
  };
}

// ---------- Day 6 odd weeks: easy circuits ----------
const SAT = [
  { circuits: [['20 cal row or bike', '100 ft farmer carry @ 75 lb/hand', '60 s inchworm'], ['2 min shuttle run', '100 ft bear crawl', '100 ft DB front-rack carry @ 50 lb/hand'], ['30 alternating step-ups to the bench', '20 DB swings @ 50 lb', '1 min plank']],
    coreEmom: ['Min 1: 45 s plank jacks', 'Min 2: 45 s flutter kicks'] },
  { circuits: [['20 cal row', '100 ft sandbag bear-hug carry', '100 ft backward sled drag'], ['2 min shuttle run', '10 DB burpee step-ups to the bench @ 35–50 lb/hand', '1 min plank hold'], ['400 m run', '100 ft walking lunge', '10 alternating DB Turkish get-ups @ 35 lb']],
    coreEmom: ['Min 1: 45 s crab hip swivel on elbows', 'Min 2: 40 s plank shift with reach, switch arms every 10 s'] },
  { circuits: [['400 m run', '20 DB swings @ 50 lb', '10 renegade rows with push-up @ 35 lb/hand'], ['3 min bike or row', '100 ft bear crawl', '100 ft cross carry (one DB overhead, one at the side), switch at 50 ft'], ['20 cal row', '30 alternating step-ups to the bench', '50 lateral plate hops']],
    coreEmom: ['Min 1: 45 s plank hip swivel, slow', 'Min 2: 20 s/leg wolf raises with a plate'] },
];
export const satCircuit = week => SAT[Math.floor((week - 1) / 2) % 3];
