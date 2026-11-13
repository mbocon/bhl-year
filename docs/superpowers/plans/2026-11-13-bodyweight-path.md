# Bodyweight Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second, open-ended "Bodyweight" program to the app, chosen in Settings, with its own day counter and log.

**Architecture:** A `path` setting routes `session(n, settings)` to a new pure module that builds Bodyweight days from the day number. The store stashes `{currentDay, currentRun}` for the path not in use, so every existing reader of `settings.currentDay` / `settings.currentRun` keeps working. A new `slowReps` engine rule derives rep speed and the day's ask from prior logs.

**Tech Stack:** Vanilla JS ES modules, localStorage, `node --test` with the fake DOM in `tests/helpers/fakedom.js`. No dependencies.

**Spec:** `docs/superpowers/specs/2026-11-13-bodyweight-path-design.md`

## Global Constraints

- No text copied from the purchased guides; every instruction is written fresh; no author or brand name on the path.
- No personal names anywhere in the UI.
- BHL days, targets, tests and the macro card do not change. The existing suite passes unmodified.
- No commits, pushes or deploys: the owner has not asked for them. Leave the work in the working tree.
- Path ids are exactly `bhl` and `bodyweight`; display names are exactly `BHL Year` and `Bodyweight`.
- Rep speed runs from 3 to 5 seconds each way. Foundation targets are 25 / 30 / 35 for weeks 1–4 / 5–8 / 9–12. Day 85 is the first split day.

## Review Focus

1. A backup made before this change (no `settings.path`, no `paths`, untagged runs) restored while on Bodyweight: the app lands on BHL at the backup's day and renders. → Task 1 test.
2. A saved `settings.path` the app does not know: falls back to BHL instead of throwing. → Task 1 test.
3. "Start over at Day 1" on Bodyweight: starts a Bodyweight run only; switching to BHL still resumes BHL's day and run. → Task 1 test.
4. A block ticked done with reps left blank or 0: it is not a met target and never renders "Beat undefined". → Task 3 test.
5. Bodyweight is on Day 400 and the owner switches to BHL: Today, Days and Settings render (BHL's calendar throws past 365). → Task 4 test.

---

### Task 1: Paths and per-path progress in the store

**Files:**
- Create: `js/paths.js`
- Modify: `js/store.js`
- Test: `tests/paths.test.js`

**Interfaces:**
- Produces, `js/paths.js`:
  - `PATHS: Array<{id: string, name: string, lastDay: number}>` = `[{id:'bhl', name:'BHL Year', lastDay:365}, {id:'bodyweight', name:'Bodyweight', lastDay:Infinity}]`
  - `pathOf(settings): {id,name,lastDay}`: the entry for `settings.path`, or the `bhl` entry when missing or unknown
  - `lastDayOf(settings): number`
- Produces, store:
  - `settings.path` (default `'bhl'`), `state.paths: {[id]: {currentDay, currentRun}}`, `path` on every run
  - `store.switchPath(id): boolean`: false for the current or an unknown id. Otherwise stashes the active `{currentDay, currentRun}` under `state.paths[oldId]`, restores `state.paths[id]` or creates a run `{id, startedAt, endedAt: null, path: id}` at day 1, sets `settings.path`, saves, returns true.
  - `startRun()` tags the new run with `settings.path`.
  - `completeDay(n)` advances to `Math.min(n + 1, lastDayOf(settings))`.
  - `migrate()` sets `settings.path` to `'bhl'` when missing or unknown, `paths ??= {}`, and `path ??= 'bhl'` on each run.

- [ ] **Step 1: Write the failing tests** in `tests/paths.test.js` (use the `mem()` storage helper pattern from `tests/store.test.js`):

```js
test('pathOf falls back to bhl', () => {
  assert.equal(pathOf({}).id, 'bhl');
  assert.equal(pathOf({ path: 'nope' }).id, 'bhl');
  assert.equal(lastDayOf({ path: 'bodyweight' }), Infinity);
  assert.equal(lastDayOf({ path: 'bhl' }), 365);
});
test('a fresh store is on bhl with a tagged run', () => {
  const s = createStore(mem());
  assert.equal(s.settings().path, 'bhl');
  assert.equal(s.state.runs[0].path, 'bhl');
  assert.deepEqual(s.state.paths, {});
});
test('switching paths keeps a separate day and log, and switching back resumes', () => {
  const s = createStore(mem());
  s.setCurrentDay(9); const bhlRun = s.settings().currentRun;
  s.logBlock(9, 'A', { slotKey: 'd2.A.deadlift', done: true });
  assert.equal(s.switchPath('bodyweight'), true);
  assert.equal(s.settings().currentDay, 1);
  assert.notEqual(s.settings().currentRun, bhlRun);
  assert.equal(s.getLog(9), undefined);
  s.completeDay(1);
  assert.equal(s.switchPath('bhl'), true);
  assert.equal(s.settings().currentDay, 9);
  assert.equal(s.settings().currentRun, bhlRun);
  assert.equal(s.getLog(9).blocks.A.done, true);
  s.switchPath('bodyweight');
  assert.equal(s.settings().currentDay, 2);
});
test('switchPath refuses the current path and unknown ids', () => {
  const s = createStore(mem());
  assert.equal(s.switchPath('bhl'), false);
  assert.equal(s.switchPath('nope'), false);
  assert.equal(s.state.runs.length, 1);
});
test('bodyweight days run past 365; bhl stops there', () => {
  const s = createStore(mem());
  s.setCurrentDay(365); s.completeDay(365);
  assert.equal(s.settings().currentDay, 365);
  s.switchPath('bodyweight'); s.setCurrentDay(365); s.completeDay(365);
  assert.equal(s.settings().currentDay, 366);
});
test('start over on bodyweight leaves bhl progress alone', () => {
  const s = createStore(mem());
  s.setCurrentDay(40); const bhlRun = s.settings().currentRun;
  s.switchPath('bodyweight'); s.setCurrentDay(20);
  const id = s.startRun();
  assert.equal(s.state.runs.find(r => r.id === id).path, 'bodyweight');
  assert.equal(s.settings().currentDay, 1);
  s.switchPath('bhl');
  assert.equal(s.settings().currentDay, 40);
  assert.equal(s.settings().currentRun, bhlRun);
});
test('an old backup restores onto bhl even from the bodyweight path', () => {
  const old = createStore(mem()); old.setCurrentDay(12);
  const backup = JSON.parse(old.exportJSON());
  delete backup.settings.path; delete backup.paths; for (const r of backup.runs) delete r.path;
  const s = createStore(mem()); s.switchPath('bodyweight');
  assert.deepEqual(s.importJSON(JSON.stringify(backup)), { ok: true });
  assert.equal(s.settings().path, 'bhl');
  assert.equal(s.settings().currentDay, 12);
  assert.deepEqual(s.state.paths, {});
  assert.equal(s.state.runs[0].path, 'bhl');
});
test('an unknown saved path falls back to bhl on load', () => {
  const st = mem(); const a = createStore(st);
  const raw = JSON.parse(a.exportJSON()); raw.settings.path = 'future-thing';
  st.setItem('bhl-year-v1', JSON.stringify(raw));
  assert.equal(createStore(st).settings().path, 'bhl');
});
```

- [ ] **Step 2: Run** `node --test tests/paths.test.js`. Expected: FAIL, cannot find `js/paths.js`.
- [ ] **Step 3: Implement** `js/paths.js` and the store changes listed under Interfaces.
- [ ] **Step 4: Run** `node --test tests/paths.test.js tests/store.test.js`. Expected: all pass.

---

### Task 2: The Bodyweight program

**Files:**
- Create: `js/program/bodyweight.js`
- Modify: `js/program/index.js` (route by path)
- Test: `tests/bodyweight.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces, `js/program/bodyweight.js`:
  - `FOUNDATION_DAYS = 84`
  - `bwDayInfo(n): {n, week, dow, phase: 'F'|'S', ab: 'A'|'B', rest: boolean}`. `week = ceil(n/7)`, `dow = ((n-1) % 7) + 1`, `phase` is `'F'` through day 84, `ab` is `'A'` on odd weeks, `rest` is `dow === 7`. Throws `RangeError` when `n` is not an integer ≥ 1.
  - `foundationTarget(week): 25 | 30 | 35`
  - `bwTitle(n): string`
  - `bwSession(n): {n, path: 'bodyweight', cycle: null, week, dow, phase, phaseLabel, title, rest, graduation: false, estMinutes, brief: string[], blocks}`
  - `BW_MOVES: Array<{slotKey, name, phase: 'F'|'S', rule}>`: every slow-rep move, for the scorecard
- Produces, `js/program/index.js`: `session(n, settings)` returns `bwSession(n)` when `settings.path === 'bodyweight'`.

**Content the code must carry (from the spec):**

- Titles. Foundation: `Full Body` on dow 1/3/5, `Walk` on 2/4/6, `Rest` on 7. Split, dow 1–7: `Back + Calves`, `Chest`, `Legs + Calves`, `Arms`, `Shoulders + Calves`, `Core`, `Rest`.
- `phaseLabel`: `Foundation` or `One part a day`.
- Block keys are `A`, `B`, `C`… in display order.
- Slow-rep blocks: `rule: {type: 'slowReps', mode, target, perLeg?, capMinutes?}`.
  - Foundation (`mode: 'fixed'`, `target: foundationTarget(week)`, inputs `[{kind:'reps', label, placeholder:'reps'}]`), in this order: legs, push, pull, shoulders, core, calves. Slot keys `bw.f.splitsquat | bw.f.lunge | bw.f.stepup` (dow 1 | 3 | 5, `perLeg: true`), `bw.f.pushup | bw.f.dip`, `bw.f.pullup | bw.f.chinup`, `bw.f.ohp`, `bw.f.kneeraise`, `bw.f.calf`.
  - Push by (ab, dow): A → pushup, dip, pushup; B → dip, pushup, dip. Pull: A → pullup, chinup, pullup; B → chinup, pullup, chinup.
  - Split (`mode: 'build'`): `bw.s.pullup` 100 cap 45; `bw.s.chest` 100 cap 45; `bw.s.splitsquat` 35, `bw.s.lunge` 35, `bw.s.stepup` 30 (all `perLeg`, no cap, reps input only); `bw.s.chinup` 100 cap 45; `bw.s.ohp` 100 cap 45; `bw.s.kneeraise` 100 cap 45; `bw.s.calf` 100 cap 15 on dow 1, 3, 5. Capped blocks take inputs `[reps, {kind:'duration'}]`.
- Other blocks, `rule: {type: 'none'}`:
  - `bw.walk`: name `Walk` on foundation walk days, `Steps` as the last block on split dow 1–6; input `{kind:'reps', label:'Steps', placeholder:'steps'}`.
  - `bw.bike`: name `Bike Intervals`, `advanced: true`, input `{kind:'cal', label:'Total calories'}`; foundation dow 1 and 5, split dow 2 and 6. Always the last block.
  - `bw.rest`: name `Rest`, no inputs, on dow 7.
- Name labels: `Bulgarian Split Squats`, `Lunges`, `Step-Ups`, `Push-Ups`, `Dips, Then Push-Ups`, `Pull-Ups`, `Chin-Ups`, `Standing Overhead Press`, `Hanging Knee Raises`, `Calf Raises`.
- `rx[0]` is the short figure shown on the collapsed card: `25 total`, `25 per leg`, `Goal 100`, `Goal 35 per leg`.
- `estMinutes`: foundation training 30 / 35 / 40 by target tier, walk and rest days 0; split dow 1–7: 60, 45, 60, 45, 60, 30, 0.
- `brief`: foundation training days explain the rotation (one set of each move, round again until targets are met, 60–90 s between moves, stop 1–2 reps short of failure); split days explain slow sets, a rep short of failure, 30 s to 2 min rest, stop at 30 minutes until there is a number to beat and at 45 after. Empty on walk and rest days.
- Cues: 2–3 per move, written fresh, covering range of motion, the easier version (band, hands raised, lowering only) and the harder version.

- [ ] **Step 1: Write the failing tests** in `tests/bodyweight.test.js`:

```js
const S = n => session(n, { path: 'bodyweight' });
const slots = n => S(n).blocks.map(b => b.slotKey);

test('calendar: weeks, phases and no upper limit', () => {
  assert.deepEqual(bwDayInfo(1), { n: 1, week: 1, dow: 1, phase: 'F', ab: 'A', rest: false });
  assert.equal(bwDayInfo(8).ab, 'B');
  assert.equal(bwDayInfo(84).phase, 'F'); assert.equal(bwDayInfo(84).rest, true);
  assert.equal(bwDayInfo(85).phase, 'S'); assert.equal(bwDayInfo(85).dow, 1);
  assert.equal(bwDayInfo(5000).week, 715);
  assert.throws(() => bwDayInfo(0), RangeError);
  assert.throws(() => bwDayInfo(1.5), RangeError);
});
test('session() routes by path and bhl is untouched', () => {
  assert.equal(S(1).path, 'bodyweight');
  assert.equal(session(1, {}).title, 'Squat + Intervals');
  assert.equal(S(366).graduation, false);
});
test('foundation week: three full-body days, walks between, rest on day 7', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(n => S(n).title), ['Full Body', 'Walk', 'Full Body', 'Walk', 'Full Body', 'Walk', 'Rest']);
  assert.deepEqual(slots(2), ['bw.walk']);
  assert.deepEqual(slots(7), ['bw.rest']);
  assert.equal(S(7).rest, true);
});
test('week A and week B rotate legs, push and pull as designed', () => {
  assert.deepEqual(slots(1), ['bw.f.splitsquat', 'bw.f.pushup', 'bw.f.pullup', 'bw.f.ohp', 'bw.f.kneeraise', 'bw.f.calf', 'bw.bike']);
  assert.deepEqual(slots(3), ['bw.f.lunge', 'bw.f.dip', 'bw.f.chinup', 'bw.f.ohp', 'bw.f.kneeraise', 'bw.f.calf']);
  assert.deepEqual(slots(5), ['bw.f.stepup', 'bw.f.pushup', 'bw.f.pullup', 'bw.f.ohp', 'bw.f.kneeraise', 'bw.f.calf', 'bw.bike']);
  assert.deepEqual(slots(8).slice(1, 3), ['bw.f.dip', 'bw.f.chinup']);
  assert.deepEqual(slots(10).slice(1, 3), ['bw.f.pushup', 'bw.f.pullup']);
  assert.deepEqual(slots(12).slice(1, 3), ['bw.f.dip', 'bw.f.chinup']);
});
test('foundation targets step 25, 30, 35 and the bike block is optional', () => {
  const t = n => S(n).blocks[0].rule.target;
  assert.deepEqual([t(1), t(26), t(29), t(54), t(57), t(82)], [25, 25, 30, 30, 35, 35]);
  assert.equal(S(1).blocks[0].rule.perLeg, true);
  assert.equal(S(1).blocks.at(-1).advanced, true);
  assert.deepEqual([S(1).estMinutes, S(29).estMinutes, S(57).estMinutes, S(2).estMinutes], [30, 35, 40, 0]);
});
test('day 85 on: one part a day in the designed order, forever', () => {
  const week = start => [0, 1, 2, 3, 4, 5, 6].map(i => S(start + i).title);
  const expected = ['Back + Calves', 'Chest', 'Legs + Calves', 'Arms', 'Shoulders + Calves', 'Core', 'Rest'];
  assert.deepEqual(week(85), expected);
  assert.deepEqual(week(365), expected);          // day 365 is a Monday-slot day: (365-1) % 7 === 0
  assert.deepEqual(slots(85), ['bw.s.pullup', 'bw.s.calf', 'bw.walk']);
  assert.deepEqual(slots(86), ['bw.s.chest', 'bw.walk', 'bw.bike']);
  assert.deepEqual(slots(87), ['bw.s.splitsquat', 'bw.s.lunge', 'bw.s.stepup', 'bw.s.calf', 'bw.walk']);
  assert.deepEqual(slots(88), ['bw.s.chinup', 'bw.walk']);
  assert.deepEqual(slots(89), ['bw.s.ohp', 'bw.s.calf', 'bw.walk']);
  assert.deepEqual(slots(90), ['bw.s.kneeraise', 'bw.walk', 'bw.bike']);
  assert.deepEqual(slots(91), ['bw.rest']);
});
test('split goals: 100 a day, legs add up to 100 per leg, time caps', () => {
  const legs = S(87).blocks.filter(b => b.rule.perLeg);
  assert.equal(legs.reduce((a, b) => a + b.rule.target, 0), 100);
  assert.deepEqual(S(85).blocks.map(b => [b.rule.target, b.rule.capMinutes]).slice(0, 2), [[100, 45], [100, 15]]);
  assert.equal(S(85).blocks[0].rule.mode, 'build');
  assert.ok(S(85).blocks[0].inputs.some(i => i.kind === 'duration'));
});
test('every day from 1 to 1200 is well formed', () => {
  const kinds = new Set(['reps', 'duration', 'cal']);
  for (let n = 1; n <= 1200; n++) {
    const s = S(n);
    assert.ok(s.title && s.phaseLabel, `d${n}`);
    assert.equal(new Set(s.blocks.map(b => b.key)).size, s.blocks.length, `d${n} keys`);
    assert.deepEqual(s.blocks.map(b => b.key), [...'ABCDEFGH'].slice(0, s.blocks.length), `d${n} key order`);
    for (const b of s.blocks) {
      assert.match(b.slotKey, /^bw\./, `d${n}`);
      assert.ok(b.name && b.rule?.type && b.rx?.length && Array.isArray(b.inputs), `d${n} ${b.key}`);
      for (const i of b.inputs) assert.ok(kinds.has(i.kind), `d${n} ${b.key} ${i.kind}`);
    }
  }
});
test('BW_MOVES lists every slow-rep slot the sessions use', () => {
  const used = new Set();
  for (let n = 1; n <= 98; n++) for (const b of S(n).blocks) if (b.rule.type === 'slowReps') used.add(b.slotKey);
  assert.deepEqual(new Set(BW_MOVES.map(m => m.slotKey)), used);
});
test('no personal names in the copy', () => {
  const all = JSON.stringify([1, 3, 5, 8, 85, 86, 87, 88, 89, 90, 91].map(S));
  assert.doesNotMatch(all, /Mike/);
});
```

- [ ] **Step 2: Run** `node --test tests/bodyweight.test.js`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `js/program/bodyweight.js` and the routing line in `js/program/index.js`.
- [ ] **Step 4: Run** `node --test tests/bodyweight.test.js tests/program.test.js`. Expected: all pass.

---

### Task 3: The slow-reps target rule

**Files:**
- Modify: `js/engine.js`
- Test: `tests/slowreps.test.js`

**Interfaces:**
- Consumes: block rule shape from Task 2. Log entries are `{day, block: {reps, duration, target, ...}}` from `history.logsFor(slotKey)`.
- Produces:
  - `repSpeed(entries, rule): {speed: 3|4|5, last: entry|null, lastHit: boolean, bumped: boolean}`. Considers only entries with a finite `reps > 0`, in day order. An entry is a hit when `reps >= (entry.block.target ?? rule.target)` and, when `rule.capMinutes` is set and `entry.block.duration` is finite, `duration <= rule.capMinutes`. Speed starts at 3 and rises by 1 per hit up to 5. `bumped` is true when the last entry raised the speed.
  - `RULES.slowReps(block, ctx, rule)`, using entries with `day < (ctx.info?.n ?? Infinity)`. With `leg = rule.perLeg ? ' per leg' : ''` and `pace = `${speed} s down, ${speed} s up``:

| Case | `text` | `sub` |
|---|---|---|
| fixed, no entries | `${target} reps${leg} · ${pace}` | `First time: pick a version you can do for sets of 5 or more` |
| build, no entries | `Count every rep · ${pace}` | `${target}${leg} is the goal, not today's number` |
| last hit, speed rose | `${target} reps${leg} · ${pace}` | `Target met last time, so each rep is a second slower` |
| last hit at 5 s | `${target} reps${leg} · ${pace}` | `Target met at 5-second reps: make the move harder` |
| fixed, last missed | `${target} reps${leg} · ${pace}` | `Last time: ${last.block.reps}${leg}` |
| build, last missed | `Beat ${last.block.reps}${leg} · ${pace}` | `Goal: ${target}${leg}` plus ` inside ${cap} minutes` when capped |

- [ ] **Step 1: Write the failing tests** in `tests/slowreps.test.js`, with `const E = (day, reps, extra = {}) => ({ day, block: { reps, ...extra } })` and `const ctx = (entries, n = 99) => ({ history: { logsFor: () => entries }, settings: {}, info: { n } })`:

```js
test('speed starts at 3, rises one second per met target, and stops at 5', () => {
  const rule = { type: 'slowReps', mode: 'fixed', target: 25 };
  assert.equal(repSpeed([], rule).speed, 3);
  assert.equal(repSpeed([E(1, 24)], rule).speed, 3);
  assert.equal(repSpeed([E(1, 25)], rule).speed, 4);
  assert.equal(repSpeed([E(1, 25), E(3, 20), E(5, 26)], rule).speed, 5);
  const capped = repSpeed([E(1, 25), E(3, 25), E(5, 25)], rule);
  assert.equal(capped.speed, 5); assert.equal(capped.lastHit, true); assert.equal(capped.bumped, false);
});
test('the target saved with a log wins over today\'s target', () => {
  const rule = { type: 'slowReps', mode: 'fixed', target: 35 };
  assert.equal(repSpeed([E(1, 25, { target: 25 })], rule).speed, 4);
  assert.equal(repSpeed([E(1, 25)], rule).speed, 3);
});
test('a capped move needs the minutes too, unless none were logged', () => {
  const rule = { type: 'slowReps', mode: 'build', target: 100, capMinutes: 45 };
  assert.equal(repSpeed([E(85, 100, { duration: 50 })], rule).speed, 3);
  assert.equal(repSpeed([E(85, 100, { duration: 45 })], rule).speed, 4);
  assert.equal(repSpeed([E(85, 100)], rule).speed, 4);
});
test('blank or zero reps are ignored, even when the block was ticked done', () => {
  const rule = { type: 'slowReps', mode: 'build', target: 100, capMinutes: 45 };
  const t = targets({ slotKey: 'x', rule }, ctx([{ day: 85, block: { done: true } }, E(92, 0)]));
  assert.equal(t.text, 'Count every rep · 3 s down, 3 s up');
  assert.doesNotMatch(t.text + t.sub, /undefined|NaN/);
});
test('fixed mode wording', () => {
  const block = { slotKey: 'x', rule: { type: 'slowReps', mode: 'fixed', target: 25, perLeg: true } };
  assert.deepEqual(targets(block, ctx([])), { text: '25 reps per leg · 3 s down, 3 s up', sub: 'First time: pick a version you can do for sets of 5 or more' });
  assert.deepEqual(targets(block, ctx([E(1, 18)])), { text: '25 reps per leg · 3 s down, 3 s up', sub: 'Last time: 18 per leg' });
  assert.deepEqual(targets(block, ctx([E(1, 25)])), { text: '25 reps per leg · 4 s down, 4 s up', sub: 'Target met last time, so each rep is a second slower' });
  assert.equal(targets(block, ctx([E(1, 25), E(3, 25), E(5, 25)])).sub, 'Target met at 5-second reps: make the move harder');
});
test('build mode wording', () => {
  const block = { slotKey: 'x', rule: { type: 'slowReps', mode: 'build', target: 100, capMinutes: 45 } };
  assert.deepEqual(targets(block, ctx([])), { text: 'Count every rep · 3 s down, 3 s up', sub: "100 is the goal, not today's number" });
  assert.deepEqual(targets(block, ctx([E(85, 42, { duration: 30 })])), { text: 'Beat 42 · 3 s down, 3 s up', sub: 'Goal: 100 inside 45 minutes' });
  assert.equal(targets(block, ctx([E(85, 100, { duration: 44 })])).text, '100 reps · 4 s down, 4 s up');
  const legs = { slotKey: 'y', rule: { type: 'slowReps', mode: 'build', target: 35, perLeg: true } };
  assert.deepEqual(targets(legs, ctx([E(87, 20)])), { text: 'Beat 20 per leg · 3 s down, 3 s up', sub: 'Goal: 35 per leg' });
});
test('looking back at an earlier day shows the speed that applied then', () => {
  const block = { slotKey: 'x', rule: { type: 'slowReps', mode: 'fixed', target: 25 } };
  const entries = [E(1, 25), E(3, 25)];
  assert.match(targets(block, ctx(entries, 3)).text, /4 s down/);
  assert.match(targets(block, ctx(entries, 5)).text, /5 s down/);
});
```

- [ ] **Step 2: Run** `node --test tests/slowreps.test.js`. Expected: FAIL, `repSpeed` is not exported.
- [ ] **Step 3: Implement** `repSpeed` and `RULES.slowReps` in `js/engine.js`.
- [ ] **Step 4: Run** `node --test tests/slowreps.test.js tests/engine.test.js`. Expected: all pass.

---

### Task 4: Screens follow the path

**Files:**
- Modify: `js/ui/today.js`, `js/ui/days.js`, `js/ui/settings.js`, `js/ui/scorecard.js`, `js/nutrition.js`, `sw.js`
- Test: `tests/ui-bodyweight.test.js`

**Interfaces:**
- Consumes: `lastDayOf`, `pathOf`, `PATHS` (Task 1); `bwDayInfo`, `bwTitle`, `FOUNDATION_DAYS`, `BW_MOVES` (Task 2); `repSpeed` (Task 3); `store.switchPath` (Task 1).
- Produces: `trendText(trend, goalWeight, day, lastDay = 365)`: when the projected day is past `lastDay` the text reads `is past Day ${lastDay} at this pace`; with `Infinity` it always reads `around Day ${d}`.

**Behaviour:**

- `today.js`
  - Replace the fixed 365 with `lastDayOf(settings)` for the peek clamp and the next-day button.
  - Header line on Bodyweight: `Week ${s.week} · ${s.phaseLabel}` plus ` · ~${s.estMinutes} min` when non-zero.
  - Progress bar on Bodyweight: shown only while the viewed day is in the foundation, as completed days ÷ 84 capped at 100, with title `${pct}% of the first 12 weeks`. BHL unchanged.
  - When `s.brief` has lines, render them in a `div.banner.brief` between the weigh-in row and the blocks.
  - Add `target: resolved.rule.target` to the per-block log `meta`.
  - The `reps` input uses `inp.placeholder || 'reps'`.
  - Pass `lastDayOf(settings)` to `trendText`.
- `days.js` on Bodyweight: list days 1 to `max(84, ceil((current + 28) / 7) * 7)`; a `div.section > h2` reading `First 12 weeks` before week 1 and `One part a day` before week 13; a `div.week-h` reading `Week ${w}` per week; item titles from `bwTitle(n)`. The jump box accepts `1..lastDayOf(settings)` on both paths. BHL list unchanged.
- `settings.js`
  - First field in Program: label `Program`, a `select` with one option per `PATHS` entry, note `Each program keeps its own day and log`. On change: `store.switchPath(value)`, clear `ui.peekDay` and `ui.openKey`, re-render.
  - The current-day box accepts `1..lastDayOf(s)`.
  - The Advanced field and the Equipment section render only on `bhl`.
  - Pass `lastDayOf(s)` to `trendText`.
- `scorecard.js` on Bodyweight: before the Tests section, a section headed `Slow-rep moves` with a table `Move | Rep speed | Last | Best` for each `BW_MOVES` entry that has a logged rep count in this run (`history.logsFor(slotKey, undefined, {includeToday: true})`); rep speed from `repSpeed`, shown as `${speed} s`. With none logged, a muted line: `Log a session and your moves appear here.`
- `sw.js`: add `./js/paths.js` and `./js/program/bodyweight.js` to `ASSETS`; `VERSION = 'v8'`.

- [ ] **Step 1: Write the failing tests** in `tests/ui-bodyweight.test.js` (same `installFakeDom` / `fresh()` setup as `tests/ui-render.test.js`):

```js
const view = () => text(document.getElementById('view'));
function onBodyweight() { const app = fresh(); app.store.switchPath('bodyweight'); return app; }

test('bodyweight days 1 to 400 render with every block opened', () => {
  const app = onBodyweight();
  const errs = [];
  for (let n = 1; n <= 400; n++) {
    app.ui.peekDay = n; app.ui.openKey = null;
    try { app.render(); } catch (e) { errs.push(`d${n}: ${e.message}`); continue; }
    for (const k of findAll('.letter').map(l => l.children[0]?.data)) { app.ui.openKey = k; try { app.render(); } catch (e) { errs.push(`d${n} ${k}: ${e.message}`); } }
  }
  assert.deepEqual(errs.slice(0, 5), [], `${errs.length} render errors`);
});
test('today shows the week line, the brief and the day target', () => {
  const app = onBodyweight();
  app.ui.openKey = 'A'; app.render();
  assert.match(view(), /Week 1 · Foundation · ~30 min/);
  assert.doesNotMatch(view(), /Cycle/);
  assert.equal(findAll('.brief').length, 1);
  assert.match(text(findAll('.target')[0]), /25 reps per leg · 3 s down, 3 s up/);
});
test('logging a met target slows the same move next time', () => {
  const app = onBodyweight();
  app.ui.openKey = 'A'; app.render();
  typeInto('reps', '25'); clickCta();                      // day 1: split squats, 25 per leg
  app.store.setCurrentDay(15); app.ui.peekDay = null; app.ui.openKey = 'A'; app.render();   // day 15: split squats again
  assert.match(text(findAll('.target')[0]), /25 reps per leg · 4 s down, 4 s up/);
  assert.equal(app.store.getLog(1).blocks.A.target, 25);
});
test('the day counter runs past 365 on bodyweight', () => {
  const app = onBodyweight();
  app.store.setCurrentDay(365); app.render(); clickCta();
  assert.equal(app.store.settings().currentDay, 366);
  app.render();
  assert.match(view(), /Day 366/);
  assert.equal(findAll('.bar').length, 0);
});
test('the Settings select switches programs and hides bhl-only settings', () => {
  const app = fresh();
  app.route = 'settings'; app.render();
  assert.match(view(), /Equipment/);
  const sel = findAll('select').find(s => s.children.some(o => text(o) === 'Bodyweight'));
  sel.change('bodyweight');
  assert.equal(app.store.settings().path, 'bodyweight');
  assert.doesNotMatch(view(), /Equipment|Advanced/);
  assert.doesNotMatch(view(), /Mike/);
});
test('switching back to bhl from a late bodyweight day renders every screen', () => {
  const app = onBodyweight();
  app.store.setCurrentDay(400); app.ui.peekDay = 400;
  for (const r of ['today', 'days', 'scorecard', 'settings']) { app.route = r; app.render(); }
  app.route = 'settings'; app.render();
  findAll('select').find(s => s.children.some(o => text(o) === 'BHL Year')).change('bhl');
  for (const r of ['today', 'days', 'scorecard', 'settings']) { app.route = r; app.render(); }
  assert.equal(app.store.settings().currentDay, 1);
});
test('days view lists bodyweight weeks beyond the current day', () => {
  const app = onBodyweight();
  app.route = 'days'; app.render();
  assert.match(view(), /First 12 weeks/);
  assert.equal(findAll('.item').length, 84);
  app.store.setCurrentDay(400); app.render();
  assert.match(view(), /One part a day/);
  assert.equal(findAll('.item').length, 434);
});
test('scorecard lists logged slow-rep moves on bodyweight', () => {
  const app = onBodyweight();
  app.route = 'scorecard'; app.render();
  assert.match(view(), /Log a session and your moves appear here/);
  app.store.logBlock(1, 'A', { slotKey: 'bw.f.splitsquat', reps: 25, target: 25 });
  app.store.setCurrentDay(2); app.render();
  assert.match(view(), /Bulgarian Split Squats/);
  assert.match(view(), /4 s/);
});
test('the goal projection has no day-365 wording on an open-ended path', () => {
  const tr = { avg7: 270, rate: 0.5 };
  assert.match(trendText(tr, 220, 10, 365), /past Day 365/);
  assert.match(trendText(tr, 220, 10, Infinity), /220 lb around Day 710/);
});
```

- [ ] **Step 2: Run** `node --test tests/ui-bodyweight.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** the behaviour above.
- [ ] **Step 4: Run** `npm test`. Expected: every test passes, including the untouched BHL suite and `tests/pwa.test.js` (which checks that `sw.js` caches every file under `js/`).

---

### Task 5: See it in the app

- [ ] **Step 1:** Serve the folder locally (`python3 -m http.server`) and open it in a browser. localhost has its own storage, so the owner's real log on the live site is not touched.
- [ ] **Step 2:** In Settings choose Bodyweight. Confirm Day 1 shows six moves plus the optional bike block, the brief card, and the target box; log reps and complete the day; confirm Day 2 is a Walk.
- [ ] **Step 3:** Jump to Day 85 and Day 400 and confirm the split days render. Switch back to BHL Year and confirm it is on its own day.
