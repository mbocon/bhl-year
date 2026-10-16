# BHL Year Program App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone-first, offline-capable static web app that serves a 365-day BHL-style training program, computes each day's targets from what the user logged before, and deploys to GitHub Pages.

**Architecture:** Pure-function modules generate any day's session from rules (`js/calendar.js`, `js/program/*`) and compute targets from history (`js/engine.js`); a store module owns local-storage state with runs, logs, tests, and choices (`js/store.js`); thin DOM views render four tabs (`js/ui/*`). No framework, no build step, no runtime network. Logic modules are tested with `node --test`; the UI is verified in a browser.

**Tech Stack:** Vanilla JavaScript ES modules, HTML, CSS; Node 23 built-in test runner; Python 3 + Pillow for icon generation; GitHub Pages (branch deploy from `main` root).

**Spec:** `docs/superpowers/specs/2026-10-16-bhl-year-program-app-design.md` (read it first; this plan cites its sections as §N and does not repeat its tables).

## Global Constraints

- Static files at the repository root: `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, `js/`, `icons/`. No bundler, no `node_modules` at runtime, no network calls at runtime (§5.8).
- Tests: `node --test tests/` on Node ≥ 18; `package.json` has `"type": "module"`.
- Units: lb default, kg optional; round lb to 5, kg to 2.5 (§4.5).
- Every read or write of `localStorage` is wrapped in try/catch; the app renders fully with storage unavailable and says it cannot save (§5.8).
- Light and dark theme follow the phone; tap targets at least 44 px; numeric keypad inputs (§5.2, §5.8).
- Total transferred size under 500 KB; loads in under two seconds on a mid-range phone (§5.8).
- `data/` (contains Mike's raw emails and email address) and `.superpowers/` are git-ignored and never committed.
- Day numbering: cycle = ceil(N/91); week = ceil(((N−1) mod 91 + 1)/7); dow = ((N−1) mod 7)+1; Day 365 is Graduation (§4.1).
- Weights are stored in lb internally; kg is a display and input conversion only, so switching units never changes stored history.
- Commit messages end with the two attribution lines given in the session's system reminder (`Co-Authored-By: …` and `Claude-Session: …`).

## Review Focus

1. **Time typed without a colon** ("728", "7.28", "7:28", "07:28") into a 2k or 5k field: parse all four as 7:28; reject "abc" and empty with no crash and no saved test. Test lives in Task 3 (`parseTime`).
2. **Switching the Monday machine when only the other machine has a test**: the target must read "comfortable but challenging" rather than borrowing the rower's split for the bike. Test in Task 8 (`rowPace`/`bikePace` fallback).
3. **A missed or lighter top set** (e.g., 255×6 when the target was 265 with e1RM 330): e1RM must not rise from a weak set, and must not fall either; the next wave target stays at 330-based. Test in Task 8 (`estimate1RM`).
4. **Importing a corrupt or newer-version backup**: state is untouched and an error is returned. Test in Task 4 (`importJSON`).
5. **Completing a day twice, or a day that is not the current day**: completion is idempotent; the current-day pointer advances only when the completed day equals it. Test in Task 4 (`completeDay`).

---

### Task 1: Repository scaffold and test runner

**Files:**
- Create: `package.json`, `.gitignore`, `README.md`, `tests/smoke.test.js`

**Interfaces:**
- Produces: `npm test` runs `node --test tests/`.

- [ ] **Step 1: Initialise git and write `.gitignore`**

```
data/
.superpowers/
node_modules/
.DS_Store
```

Run: `cd /Users/mikebocon/coding/BHL-workouts && git init -b main`

- [ ] **Step 2: Write `package.json`**

```json
{ "name": "bhl-year", "private": true, "type": "module",
  "scripts": { "test": "node --test tests/", "serve": "python3 -m http.server 8080" } }
```

- [ ] **Step 3: Write the smoke test `tests/smoke.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('runner works', () => { assert.equal(1 + 1, 2); });
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: `# pass 1`

- [ ] **Step 5: Write `README.md`** with: what the app is (two sentences), how to run tests, how to serve locally (`npm run serve` then open `http://localhost:8080`), and a "Put it on your phone" section placeholder to be filled in Task 12.

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json README.md tests/smoke.test.js docs/
git commit -m "chore: scaffold repo, test runner, and design docs"
```

---

### Task 2: Calendar math

**Files:**
- Create: `js/calendar.js`, `tests/calendar.test.js`

**Interfaces:**
- Produces: `dayInfo(n: number) → { n, cycle: 1..4, week: 1..13, dow: 1..7, phase: 'A'|'B'|'D'|'G', rest: boolean, graduation: boolean }` where phase A = weeks 1–6, B = 7–12, D = 13, G = day 365; `rest` is true when dow === 7 or graduation. Throws `RangeError` outside 1..365.
- Produces: `DAY_NAMES: string[7]` = `['Squat + Intervals','Hinge + Press + Work Capacity','Run + Ruck','Zone 2 + Pull','Clean + Front Squat + Intervals','Long Easy','Rest']`.

- [ ] **Step 1: Write failing tests**

```js
import { dayInfo, DAY_NAMES } from '../js/calendar.js';
test('day 1', () => assert.deepEqual(dayInfo(1), { n:1, cycle:1, week:1, dow:1, phase:'A', rest:false, graduation:false }));
test('day 43 is cycle 1 week 7 day 1 phase B', () => { const d = dayInfo(43); assert.equal(d.week, 7); assert.equal(d.dow, 1); assert.equal(d.phase, 'B'); });
test('day 91 is deload rest day', () => { const d = dayInfo(91); assert.equal(d.week, 13); assert.equal(d.dow, 7); assert.equal(d.phase, 'D'); assert.equal(d.rest, true); });
test('day 92 starts cycle 2', () => assert.equal(dayInfo(92).cycle, 2));
test('day 364 is cycle 4 week 13 day 7', () => { const d = dayInfo(364); assert.equal(d.cycle, 4); assert.equal(d.week, 13); assert.equal(d.dow, 7); });
test('day 365 is graduation', () => { const d = dayInfo(365); assert.equal(d.phase, 'G'); assert.equal(d.graduation, true); assert.equal(d.rest, true); });
test('out of range throws', () => { assert.throws(() => dayInfo(0), RangeError); assert.throws(() => dayInfo(366), RangeError); });
test('day names', () => assert.equal(DAY_NAMES.length, 7));
```

- [ ] **Step 2: Run to verify failure** — Run: `node --test tests/calendar.test.js` Expected: FAIL, module not found.
- [ ] **Step 3: Implement `dayInfo` and `DAY_NAMES` in `js/calendar.js`** using the formulas in Global Constraints.
- [ ] **Step 4: Run to verify pass** — Expected: all calendar tests pass.
- [ ] **Step 5: Commit** — `git commit -m "feat: calendar math for 365-day program"`

---

### Task 3: Formatting and parsing helpers

**Files:**
- Create: `js/format.js`, `tests/format.test.js`

**Interfaces:**
- Produces:
  - `roundLoad(w: number, units: 'lb'|'kg') → number` (lb to nearest 5, kg to nearest 2.5)
  - `parseTime(s: string) → number|null` seconds; accepts `m:ss`, `mm:ss`, `m.ss`, and 3–4 digit `mss`/`mmss`; null for anything else or empty
  - `fmtTime(sec: number) → string` `m:ss`
  - `splitFrom2k(sec: number) → number` seconds per 500 m (= sec/4)
  - `pacePerKm(sec5k: number) → number` seconds per km (= sec/5)
  - `fmtPace(secPerUnit: number, unit: '/500m'|'/km') → string` e.g. `"1:52 /500m"`
  - `hrRange(maxHR: number) → [low, high]` = `[round(0.65·max), round(0.75·max)]`
  - `maxHRFrom({ maxHR, age }) → number|null` (explicit maxHR wins; else 220 − age; else null)
  - `lbToKg(lb) / kgToLb(kg)` plain conversions (1 lb = 0.45359237 kg)

- [ ] **Step 1: Write failing tests**

```js
test('roundLoad', () => { assert.equal(roundLoad(263, 'lb'), 265); assert.equal(roundLoad(262, 'lb'), 260); assert.equal(roundLoad(101.3, 'kg'), 102.5); });
test('parseTime accepts the four common forms', () => { for (const s of ['7:28','07:28','7.28','728']) assert.equal(parseTime(s), 448); assert.equal(parseTime('12:05'), 725); assert.equal(parseTime('1205'), 725); });
test('parseTime rejects garbage', () => { for (const s of ['abc','',':','7:','7:99']) assert.equal(parseTime(s), null); });
test('fmtTime', () => { assert.equal(fmtTime(448), '7:28'); assert.equal(fmtTime(65), '1:05'); });
test('split and pace', () => { assert.equal(splitFrom2k(448), 112); assert.equal(fmtPace(112, '/500m'), '1:52 /500m'); assert.equal(pacePerKm(1320), 264); assert.equal(fmtPace(264, '/km'), '4:24 /km'); });
test('hr', () => { assert.deepEqual(hrRange(190), [124, 143]); assert.equal(maxHRFrom({ maxHR: 185, age: 40 }), 185); assert.equal(maxHRFrom({ age: 40 }), 180); assert.equal(maxHRFrom({}), null); });
```

- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement `js/format.js`** with the signatures above.
- [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `git commit -m "feat: load rounding, time parsing, pace and HR helpers"`

---

### Task 4: Store (state, runs, logs, tests, choices, backup)

**Files:**
- Create: `js/store.js`, `tests/store.test.js`

**Interfaces:**
- Consumes: `dayInfo` from Task 2 (pure, Node-safe) to stamp `week` and `phase` on lift evidence.
- Produces: `createStore(storage?) → Store`. `storage` is any object with `getItem/setItem/removeItem` (default `globalThis.localStorage` if present). Key: `'bhl-year-v1'`. State shape exactly as §5.3 with `version: 1`.

```ts
Store = {
  state,                        // live object
  persistent: boolean,          // false if storage threw on load or save
  settings(): Settings; updateSettings(patch): void;
  // Settings defaults: { currentDay:1, currentRun:<id>, units:'lb', advanced:false, maxHR:null, age:null, bodyweight:null, lastExportAt:null,
  //   equipment:{ box:true, rope:true, kb:false, rings:false, climbRope:false, hurdles:false, vest:false, slamBall:false, hrm:true } }
  startRun(): string;           // closes current run (endedAt), creates new {id, startedAt}, sets currentRun, currentDay=1
  setCurrentDay(n): void;
  getLog(n): DayLog|undefined;  // within current run
  logBlock(n, blockKey, patch): void;   // deep-merges patch into logs[run][n].blocks[blockKey]; stores {optionId, sets, time, cal, reps, distance, duration, notes, done, ruleType, lift}
  completeDay(n): void;         // sets completedAt (idempotent, keeps first timestamp); if n === currentDay, currentDay = min(n+1, 365)
  recordTest(testId, value, n): void;  // pushes {runId, day:n, at:Date.now(), value}
  getChoice(slotKey): string|undefined; setChoice(slotKey, optionId): void;
  history: HistoryAPI;          // see below, always scoped to current run
  exportJSON(): string;         // pretty JSON of state; sets settings.lastExportAt
  importJSON(text): { ok:true } | { ok:false, error:string }; // validates object with version===1 and logs/runs/settings present; replaces state; never partial
  eraseAll(): void;             // fresh default state, new run
}
HistoryAPI = {
  logsFor(slotKey, optionId?): Array<{ day, block }>   // current run, day < currentDay unless opts.includeToday, ascending by day; optionId undefined = any
  lastLog(slotKey, optionId?): { day, block } | null
  latestTest(testId, { maxAgeDays }?): { value, day, at, runId } | null   // across runs; filtered by age when given
  liftEvidence(liftKey): Array<{ kind:'1rm'|'single'|'topset', weight, reps, day, at, week, phase }>  // current run; derived from blocks whose block.lift===liftKey using block.ruleType: 'max'→'1rm' (heaviest set), 'single'→'single' (heaviest set), 'wave'→'topset' (heaviest set with its reps); week/phase from dayInfo(day); at = the block's loggedAt timestamp (store stamps loggedAt on every logBlock)
}
```

Every block log stores `slotKey` (callers pass it in the patch) so `logsFor`/`lastLog` can look up by slot.

- [ ] **Step 1: Write failing tests** (use an in-memory `Map`-backed fake storage; also a storage whose methods throw)

```js
test('defaults and persistence', () => { const s = createStore(mem()); assert.equal(s.settings().currentDay, 1); assert.equal(s.settings().equipment.box, true); assert.equal(s.persistent, true); });
test('throwing storage still works in memory', () => { const s = createStore(throwing()); s.setCurrentDay(5); assert.equal(s.settings().currentDay, 5); assert.equal(s.persistent, false); });
test('logBlock merges and getLog reads back', () => { const s = createStore(mem()); s.logBlock(2, 'A', { slotKey:'d2.A.deadlift', sets:[{w:315,r:7}], ruleType:'ladder', lift:'deadlift' }); s.logBlock(2, 'A', { notes:'felt good' }); assert.deepEqual(s.getLog(2).blocks.A.sets, [{w:315,r:7}]); assert.equal(s.getLog(2).blocks.A.notes, 'felt good'); assert.ok(s.getLog(2).blocks.A.loggedAt); });
test('completeDay advances pointer only for current day and is idempotent', () => { const s = createStore(mem()); s.completeDay(1); assert.equal(s.settings().currentDay, 2); const t = s.getLog(1).completedAt; s.completeDay(1); assert.equal(s.getLog(1).completedAt, t); assert.equal(s.settings().currentDay, 2); s.completeDay(10); assert.equal(s.settings().currentDay, 2); });
test('startRun keeps old logs and resets pointer', () => { const s = createStore(mem()); s.logBlock(3,'B',{slotKey:'d1.B.backsquat', sets:[{w:200,r:5}]}); const r1 = s.settings().currentRun; s.setCurrentDay(40); s.startRun(); assert.notEqual(s.settings().currentRun, r1); assert.equal(s.settings().currentDay, 1); assert.equal(s.getLog(3), undefined); assert.ok(s.state.logs[r1][3]); assert.equal(s.state.runs.length, 2); assert.ok(s.state.runs[0].endedAt); });
test('history is scoped to run; tests cross runs with age filter', () => { const s = createStore(mem()); s.setCurrentDay(5); s.logBlock(2,'A',{slotKey:'d2.A.deadlift', sets:[{w:315,r:7}]}); assert.equal(s.history.lastLog('d2.A.deadlift').day, 2); s.recordTest('row2k', 448, 1); s.startRun(); assert.equal(s.history.lastLog('d2.A.deadlift'), null); assert.equal(s.history.latestTest('row2k').value, 448); assert.equal(s.history.latestTest('row2k', { maxAgeDays: 0 }), null); });
test('liftEvidence derives kinds from ruleType and stamps week', () => { const s = createStore(mem()); s.setCurrentDay(50); s.logBlock(36,'B',{ slotKey:'d1.B.backsquat', sets:[{w:305,r:1}], ruleType:'single', lift:'backsquat' }); s.logBlock(43,'B',{ slotKey:'d1.B.backsquat', sets:[{w:225,r:6},{w:265,r:6}], ruleType:'wave', lift:'backsquat' }); const ev = s.history.liftEvidence('backsquat'); assert.deepEqual(ev.map(e => [e.kind, e.weight, e.reps, e.week, e.phase]), [['single',305,1,6,'A'],['topset',265,6,7,'B']]); });
test('export/import round-trip; corrupt import rejected', () => { const s = createStore(mem()); s.logBlock(1,'A',{done:true}); const txt = s.exportJSON(); assert.ok(s.settings().lastExportAt); const s2 = createStore(mem()); assert.deepEqual(s2.importJSON(txt), { ok:true }); assert.equal(s2.getLog(1).blocks.A.done, true); assert.equal(s2.importJSON('{"version":2}').ok, false); assert.equal(s2.importJSON('not json').ok, false); assert.equal(s2.getLog(1).blocks.A.done, true); });
test('eraseAll', () => { const s = createStore(mem()); s.logBlock(1,'A',{done:true}); s.eraseAll(); assert.equal(s.getLog(1), undefined); assert.equal(s.state.runs.length, 1); });
```

Note: `logsFor`/`lastLog` key on `slotKey`, so `logBlock` must also accept and store `slotKey` in the patch; tests above that call `lastLog('d2.A.deadlift')` should log with `{ slotKey:'d2.A.deadlift', ... }`. Make `slotKey` a stored field of every block log.

- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement `js/store.js`.** Run ids: `'run-' + Date.now().toString(36)`. Save after every mutation inside try/catch; on throw set `persistent=false` once.
- [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `git commit -m "feat: local-storage store with runs, logs, tests, choices, backup"`

---

### Task 5: Week schemes (the numbers from §4.4 as data)

**Files:**
- Create: `js/program/schemes.js`, `tests/schemes.test.js`

**Interfaces:**
- Produces (all pure, `week` 1..13, `cycle` 1..4):
  - `squatScheme(week) → { kind:'tempo', tempo:'42X1', sets, reps } | { kind:'single', tempo:'42X1', sets:5, reps:1 } | { kind:'wave', tempo:'20X1', reps, pct } | { kind:'max' } | { kind:'percent', sets:3, reps:5, pct:0.75 }` per §4.4 Day 1 B; wave pct map `{6:.80,5:.83,4:.86,3:.89,2:.92}`.
  - `frontSquatScheme(week)` same but Phase B reps order `[6,4,5,2,3]` then max.
  - `ladderScheme(week) → { reps:number[], grip:'doh'|'hookOk'|'max', pct? }` reps per §4.4 Day 2 A (w13 → `{ kind:'percent', sets:3, reps:3, pct:0.75 }` for deadlift; press w13 is `sets:3, reps:5`) — expose `deadliftScheme(week)` and `pressScheme(week)` wrappers.
  - `cleanScheme(week) → { kind:'single' } | { kind:'pctSingle', sets:6, reps:3, pct:0.9, refWeek:1 } | { kind:'plusFive', sets:5, reps:3 } | { kind:'emom', minutes:10, every:60|90, reps:3, pct?:0.6, refWeek?:6 } | { kind:'percent', sets:3, reps:3, pct:0.6 }` per §4.4 Day 5 A.
  - `rowScheme(week, { firstCycle }) → { kind:'tt' } | { kind:'intervals', rounds:12, meters, offset:0|-2, rest:'1:30'|'2:00' } | { kind:'primerTT' } | { kind:'ladder1200' } | { kind:'easy', minutes:20 }` per the rower table.
  - `bikeScheme(week, { firstCycle })` analogous with `{ seconds, mult }` per the air-bike table.
  - `runFormat(week) → 'R1'|'R2'|'R3'|'R4'|'R5'|'R6'|'TT5K'|'TEST1_5'` per the Day 3 A table.
  - `densityFormat(week) → { kind:'emom', minutes:16|20, work:30 } | { kind:'e90', sets:16, work:45 } | { kind:'tests' }`.
  - `mmRounds(week) → number|0` and `mmVest(week) → boolean` (20 lb ruck in w11, w12).
  - `longDuration(cycle, week) → number` minutes for Day 6 long run/ruck weeks per §4.7 (w2/4 → first value, w6/8 → second, w10/12 → third); `zone2Minutes(cycle, week)` (start per §4.7 + 2/week, cap 60, 30 in w13); `ruckLoad(cycle) → 35|45|50|55`; `ruckTestMiles(cycle) → 3|4`.
  - `pressLiftFor(cycle, phase) → 'bench'|'ohp'` and `cleanVariantFor(cycle) → 'hpc'|'pc'` per §4.7.

- [ ] **Step 1: Write failing tests** pinning spec values (one assertion per table row class is enough):

```js
test('squat', () => { assert.deepEqual(squatScheme(1), { kind:'tempo', tempo:'42X1', sets:4, reps:6 }); assert.deepEqual(squatScheme(5), { kind:'tempo', tempo:'42X1', sets:5, reps:2 }); assert.equal(squatScheme(6).kind, 'single'); assert.deepEqual(squatScheme(7), { kind:'wave', tempo:'20X1', reps:6, pct:0.80 }); assert.equal(squatScheme(9).reps, 2); assert.equal(squatScheme(12).kind, 'max'); assert.deepEqual(squatScheme(13), { kind:'percent', sets:3, reps:5, pct:0.75 }); });
test('front squat wave order', () => assert.deepEqual([7,8,9,10,11].map(w => frontSquatScheme(w).reps), [6,4,5,2,3]));
test('ladders', () => { assert.deepEqual(deadliftScheme(1).reps, [8,7,6]); assert.deepEqual(deadliftScheme(6).reps, [3,2,1,1]); assert.equal(deadliftScheme(6).grip, 'doh'); assert.equal(deadliftScheme(9).grip, 'hookOk'); assert.equal(deadliftScheme(12).grip, 'max'); assert.deepEqual(deadliftScheme(13), { kind:'percent', sets:3, reps:3, pct:0.75 }); assert.deepEqual(pressScheme(13), { kind:'percent', sets:3, reps:5, pct:0.75 }); });
test('clean', () => { assert.equal(cleanScheme(1).kind, 'single'); assert.deepEqual(cleanScheme(2), { kind:'pctSingle', sets:6, reps:3, pct:0.9, refWeek:1 }); assert.equal(cleanScheme(4).kind, 'plusFive'); assert.deepEqual(cleanScheme(7), { kind:'emom', minutes:10, every:60, reps:3, pct:0.6, refWeek:6 }); assert.equal(cleanScheme(11).every, 90); assert.equal(cleanScheme(12).kind, 'single'); assert.deepEqual(cleanScheme(13), { kind:'percent', sets:3, reps:3, pct:0.6 }); });
test('row', () => { assert.equal(rowScheme(1, { firstCycle:true }).kind, 'tt'); assert.deepEqual(rowScheme(1, { firstCycle:false }), { kind:'intervals', rounds:12, meters:400, offset:0, rest:'1:30' }); assert.deepEqual(rowScheme(4, {}), { kind:'intervals', rounds:12, meters:400, offset:-2, rest:'1:30' }); assert.equal(rowScheme(7, {}).kind, 'primerTT'); assert.equal(rowScheme(11, {}).kind, 'ladder1200'); assert.equal(rowScheme(13, {}).kind, 'easy'); });
test('bike', () => { assert.deepEqual(bikeScheme(2, {}), { kind:'intervals', rounds:12, seconds:90, mult:1.05, rest:'2:00' }); assert.equal(bikeScheme(5, {}).mult, 1.10); assert.equal(bikeScheme(7, {}).kind, 'primerTT'); });
test('run formats', () => assert.deepEqual([1,2,3,4,5,6,7,8,9,10,11,12,13].map(runFormat), ['R1','R2','R5','TT5K','R3','R4','R6','R1','TT5K','R2','R3','R4','TEST1_5']));
test('density and mm', () => { assert.deepEqual(densityFormat(1), { kind:'emom', minutes:16, work:30 }); assert.equal(densityFormat(6).minutes, 20); assert.deepEqual(densityFormat(11), { kind:'e90', sets:16, work:45 }); assert.equal(densityFormat(13).kind, 'tests'); assert.deepEqual([1,7,8,11,12,13].map(mmRounds), [5,5,6,8,7,0]); assert.equal(mmVest(11), true); assert.equal(mmVest(10), false); });
test('durations and loads', () => { assert.equal(longDuration(1,2), 40); assert.equal(longDuration(1,10), 60); assert.equal(longDuration(4,12), 120); assert.equal(zone2Minutes(1,1), 40); assert.equal(zone2Minutes(1,11), 60); assert.equal(zone2Minutes(3,1), 50); assert.equal(zone2Minutes(2,13), 30); assert.deepEqual([1,2,3,4].map(ruckLoad), [35,45,50,55]); assert.deepEqual([1,2,3,4].map(ruckTestMiles), [3,3,4,4]); });
test('cycle variants', () => { assert.equal(pressLiftFor(1,'A'), 'bench'); assert.equal(pressLiftFor(1,'B'), 'ohp'); assert.equal(pressLiftFor(2,'A'), 'ohp'); assert.deepEqual([1,2,3,4].map(cleanVariantFor), ['hpc','pc','hpc','pc']); });
```

- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement `js/program/schemes.js`** as lookup tables; copy every number from §4.4 and §4.7.
- [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `git commit -m "feat: week-by-week scheme tables"`

---

### Task 6: Rotations, movement pools, and option lists

**Files:**
- Create: `js/program/rotations.js`, `tests/rotations.test.js`

**Interfaces:**
- Produces an `Option` type `{ id: string, name: string, needs: string[] }` where `needs` values are equipment keys from the Store defaults (`box, rope, kb, rings, climbRope, hurdles, vest, slamBall`). Empty `needs` means default equipment suffices.
- Produces (pure):
  - `plyoFor(week) → { name, rx: string[], options: Option[] }` — six variants of §4.4 Day 1 A, index `(week−1) mod 6`, w12 variant 5 flagged `{ test:'jumpMax' }`, w13 variant 1 with `3×3`.
  - `coreFor(dow: 1|5, week) → { name, rx: string[] }` from the 12-item list; Day 1 uses index `(week−1) mod 12`, Day 5 uses `(week+5) mod 12` so the two never coincide in a week.
  - `singleLegFor(week) → { id, name, rx: string[], mode:'introduce'|'repeat'|'deload' }` per §4.4 Day 2 B.
  - `bwCircuitFor(week) → { id:'A'|'B', stations: string[] }` (A in odd weeks, B in even weeks).
  - `mmWorkout(week) → { id:'MM1'..'MM8', items: Array<{ text, options?: Option[] }> }` with the 8 workouts of §4.4 and the bracketed options as `Option`s.
  - `runFormatText(code) → { name, rx: string[] }` for R1–R6, TT5K, TEST1_5.
  - `ruckFormat(week) → string` rotating the four formats; `wedOddFor(week) → { name, rx: string[], options?: Option[] }` rotating the six items (w13 → bird dog + dead bug).
  - `pullVariant(week) → 'a'|'b'` and `pullRx(variant) → string[]`; `armsRx → string[]`; `mobilityRx → string[]`.
  - `intervalCombo(week) → { stations: Array<{ category, name, options: Option[] }> }` — six presets rotating, one station per category (jump, machine, loaded, crawl), each with its alternatives as options (e.g. machine station options: rower, air bike, shuttle run, `{id:'du', name:'Double-unders', needs:['rope']}`).
  - `satCircuit(week) → { circuits: string[][] /* 3 × items */, coreEmom: string[] }` — three presets rotating by odd week index.
  - `MACHINE_OPTIONS: Option[]` = `[{id:'rower',name:'Rower',needs:[]},{id:'bike',name:'Air bike',needs:[]}]`.
  - `visibleOptions(options: Option[], equipment) → Option[]` keeps options whose every `needs` key is true in `equipment`; always returns at least the first option if all are filtered (never an empty list).

- [ ] **Step 1: Write failing tests**

```js
test('plyo rotation and options', () => { const p1 = plyoFor(1); assert.match(p1.name, /Drop Jump/); assert.equal(plyoFor(7).name, p1.name); assert.equal(plyoFor(12).test, 'jumpMax'); assert.ok(plyoFor(2).options.some(o => o.needs.includes('box'))); assert.ok(plyoFor(2).options.some(o => o.needs.length === 0)); });
test('core never coincides', () => { for (let w = 1; w <= 13; w++) assert.notEqual(coreFor(1, w).name, coreFor(5, w).name); });
test('single leg modes', () => { assert.equal(singleLegFor(1).mode, 'introduce'); assert.equal(singleLegFor(2).mode, 'repeat'); assert.equal(singleLegFor(2).id, singleLegFor(1).id); assert.equal(singleLegFor(3).mode, 'introduce'); assert.equal(singleLegFor(13).mode, 'deload'); });
test('bw circuits alternate', () => { assert.equal(bwCircuitFor(1).id, 'A'); assert.equal(bwCircuitFor(2).id, 'B'); assert.equal(bwCircuitFor(1).stations.length, 4); });
test('mm rotation', () => { assert.equal(mmWorkout(1).id, 'MM1'); assert.equal(mmWorkout(9).id, 'MM1'); assert.ok(mmWorkout(2).items.some(i => i.options && i.options.some(o => o.needs.includes('climbRope')))); });
test('interval combos cover four categories', () => { for (let w = 1; w <= 12; w++) assert.deepEqual(intervalCombo(w).stations.map(s => s.category), ['jump','machine','loaded','crawl']); });
test('visibleOptions filters by equipment but never empties', () => { const opts = [{id:'a',name:'A',needs:['box']},{id:'b',name:'B',needs:[]}]; assert.deepEqual(visibleOptions(opts, { box:false }).map(o=>o.id), ['b']); assert.deepEqual(visibleOptions([{id:'a',name:'A',needs:['box']}], { box:false }).map(o=>o.id), ['a']); });
test('sat circuits', () => { const s = satCircuit(1); assert.equal(s.circuits.length, 3); assert.ok(s.coreEmom.length >= 2); });
```

- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement `js/program/rotations.js`** copying the movement text from §4.4; keep each pool as a const array near its function.
- [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `git commit -m "feat: movement rotations, pools, and equipment options"`

---

### Task 7: Session generator

**Files:**
- Create: `js/program/days.js`, `js/program/index.js`, `tests/program.test.js`

**Interfaces:**
- Consumes: `dayInfo`, everything from Tasks 5 and 6.
- Produces: `session(n: number, settings) → Session`

```ts
Session = { n, cycle, week, dow, phase, title: string, estMinutes: number, rest: boolean, graduation: boolean, blocks: Block[] }
Block = {
  key: string,            // 'A'..'F', 'PM', or 'R' for rest-day card
  slotKey: string,        // e.g. 'd1.B.backsquat', 'd2.C.press.bench', 'd5.A.clean.hpc', 'd1.C.machine'
  name: string,
  rx: string[],
  note?: string,
  options?: Option[],     // from Task 6; absent when there is nothing to choose
  pickDefault?: 'olderTest',  // w13 Day 5 machine test: UI defaults to the machine whose latest test is older
  advanced?: boolean,     // Day 7 session and PM cards
  lift?: 'backsquat'|'frontsquat'|'deadlift'|'bench'|'ohp'|'clean',
  rule: Rule,             // see list
  inputs: Input[],        // [{kind:'sets', count}, {kind:'time', label}, {kind:'cal'}, {kind:'reps', label}, {kind:'distance', unit}, {kind:'duration'}, {kind:'rounds', count}, {kind:'height'}, {kind:'hr'}]
  test?: string           // testId when logging this block records a test: 'row2k','bike10','run5k','run1_5mi','pushups2','situps2','pullupsMax','ruck3mi','ruck4mi','max_backsquat','max_frontsquat','max_deadlift','max_bench','max_ohp','max_clean','jumpMax'
}
Rule =
  | { type:'ladder', reps:number[], phase:'A'|'B' }
  | { type:'tempoProg', sets, reps }
  | { type:'wave', reps, pct }
  | { type:'single' }                         // w6 heavy single (evidence kind 'single')
  | { type:'max' }                            // w12 1RM (evidence kind '1rm', also records test)
  | { type:'percent', sets, reps, pct }
  | { type:'pctSingle', sets, reps, pct, refWeek }
  | { type:'plusFive', sets, reps }
  | { type:'emom', minutes, every, reps, pct?, refWeek? }
  | { type:'rowPace', scheme }               // scheme from rowScheme
  | { type:'bikePace', scheme }
  | { type:'runPace', format }
  | { type:'peakRepeat' } | { type:'introduce' }
  | { type:'density', format } | { type:'consistency', rounds } | { type:'beatLast' }
  | { type:'zone2', minutes } | { type:'none' }
```

Day-by-day builders in `js/program/days.js`: `day1(ctx)`, … `day7(ctx)`, `graduation()`, where `ctx = { info, settings, firstCycle: cycle===1 }`. `estMinutes` per §4.3 (use the midpoints: 98, 112, 98, 60, 88, long-day = max(70, longDuration+10) or 90 for circuits, 0 for rest; w13 days 20% less). Day 1 C: `options: MACHINE_OPTIONS`, rule `rowPace` with `scheme: rowScheme(week, {firstCycle})` and the block also carries `altRules: { bike: { type:'bikePace', scheme: bikeScheme(...) } }` so the engine can switch by chosen option; `test` is `'row2k'`/`'bike10'` when the scheme kind is `tt`/`primerTT`. Day 5 C in w13 is the machine test block (`options: MACHINE_OPTIONS`, `pickDefault:'olderTest'`, `test` by option). Day 2 D in w13 emits three blocks `D1 D2 D3` with tests `pushups2, situps2, pullupsMax`. Day 3 A in w4/w9 has `test:'run5k'`, w13 `test:'run1_5mi'`. Day 6 w13 has `test: ruckTestMiles(cycle)===3 ? 'ruck3mi' : 'ruck4mi'`. Day 1 A w12 has `test:'jumpMax'`. w12 lifts have `test:'max_<lift>'`. Day 2 F only when week ≤ 4. PM block `{ key:'PM', advanced:true, rule:{type:'zone2', minutes:45} }` on dows 1,2,3,5. Day 7: rest card (`key:'R'`), plus an advanced block `{ key:'A', advanced:true, rule:{type:'zone2', minutes: longDuration(cycle, evenWeek)} }` where `evenWeek` is the largest even week ≤ current week, or 2 when week is 1. In R4 weeks (w6, w12) Day 3 has no ruck block and the remaining blocks are relettered A, B; in w13 Day 3 is A (1.5-mile test + 20 min easy) and B (bird dog + dead bug).

- [ ] **Step 1: Write failing tests**

```js
const S = (n, extra={}) => session(n, { advanced:false, equipment:{ box:true, rope:true }, ...extra });
test('day 1 shape', () => { const s = S(1); assert.equal(s.title, 'Squat + Intervals'); assert.deepEqual(s.blocks.map(b => b.key), ['A','B','C','D']); assert.equal(s.blocks[1].rule.type, 'tempoProg'); assert.equal(s.blocks[2].rule.scheme.kind, 'tt'); assert.equal(s.blocks[2].test, 'row2k'); assert.deepEqual(s.blocks[2].options.map(o=>o.id), ['rower','bike']); });
test('day 2 shape and press lift by cycle', () => { const s = S(2); assert.deepEqual(s.blocks.map(b => b.key), ['A','B','C','D','E','F']); assert.equal(s.blocks[2].lift, 'bench'); assert.equal(s.blocks[2].slotKey, 'd2.C.press.bench'); assert.equal(S(93).blocks[2].lift, 'ohp'); assert.equal(S(30).blocks.length, 5); /* w5: no F */ });
test('week 7 day 1 is a wave with 2k retest', () => { const s = S(43); assert.deepEqual(s.blocks[1].rule, { type:'wave', reps:6, pct:0.80 }); assert.equal(s.blocks[1].lift, 'backsquat'); assert.equal(s.blocks[2].rule.scheme.kind, 'primerTT'); assert.equal(s.blocks[2].test, 'row2k'); });
test('week 7 day 5 clean emom at 60%', () => { const s = S(47); assert.equal(s.blocks[0].rule.type, 'emom'); assert.equal(s.blocks[0].rule.pct, 0.6); assert.equal(s.blocks[0].slotKey, 'd5.A.clean.hpc'); assert.equal(S(47+91).blocks[0].slotKey, 'd5.A.clean.pc'); });
test('week 12 maxes record tests', () => { assert.equal(S(78).blocks[1].test, 'max_backsquat'); assert.equal(S(78).blocks[0].test, 'jumpMax'); assert.equal(S(79).blocks[0].test, 'max_deadlift'); });
test('week 13 is deload and tests', () => { const d1 = S(85); assert.deepEqual(d1.blocks[1].rule, { type:'percent', sets:3, reps:5, pct:0.75 }); const d2 = S(86); assert.deepEqual(d2.blocks.filter(b => b.test).map(b => b.test), ['pushups2','situps2','pullupsMax']); assert.ok(!d2.blocks.some(b => b.key === 'E')); assert.equal(S(87).blocks[0].test, 'run1_5mi'); assert.equal(S(89).blocks[2].pickDefault, 'olderTest'); assert.equal(S(90).blocks[0].test, 'ruck3mi'); assert.equal(S(90+182).blocks[0].test, 'ruck4mi'); });
test('rest, advanced, graduation', () => { assert.equal(S(7).rest, true); assert.equal(S(7).blocks.filter(b => !b.advanced).length, 1); assert.ok(S(7, { advanced:true }).blocks.some(b => b.advanced && b.rule.type === 'zone2')); assert.ok(S(1, { advanced:true }).blocks.some(b => b.key === 'PM')); assert.ok(!S(1).blocks.some(b => b.key === 'PM')); assert.equal(S(365).graduation, true); });
test('cycle 2 week 1 trains at test pace instead of testing', () => { const s = S(92); assert.equal(s.blocks[2].rule.scheme.kind, 'intervals'); assert.equal(s.blocks[2].test, undefined); });
test('long days', () => { assert.match(S(13).blocks[0].name, /Long Run/); assert.match(S(27).blocks[0].name, /Long Ruck/); assert.match(S(6).blocks[0].name, /Circuits/); assert.equal(S(13).blocks[0].rule.minutes, 40); });
test('run-ruck-run weeks fold the ruck into A and reletter', () => { const s = S(38); /* w6 day 3 */ assert.equal(s.blocks[0].rule.format, 'R4'); assert.deepEqual(s.blocks.map(b => b.key), ['A','B']); assert.equal(S(87).blocks.map(b => b.key).join(''), 'AB'); /* w13: test + easy, then bird dog/dead bug */ });
test('day 7 advanced duration tracks the nearest long week', () => { assert.equal(S(7, { advanced:true }).blocks.find(b => b.advanced).rule.minutes, 40); assert.equal(S(42, { advanced:true }).blocks.find(b => b.advanced).rule.minutes, 50); });
test('every training day has unique block keys and slotKeys', () => { for (let n = 1; n <= 365; n++) { const s = S(n, { advanced:true }); const keys = s.blocks.map(b => b.key); assert.equal(new Set(keys).size, keys.length, `day ${n}`); for (const b of s.blocks) assert.ok(b.slotKey && b.rule && Array.isArray(b.rx) && Array.isArray(b.inputs), `day ${n} ${b.key}`); } });
```

- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement `days.js` and `index.js`.** Each day builder returns `Block[]`; `session()` wraps with title from `DAY_NAMES[dow-1]` (w13 Day 6 title "Ruck Test"), `estMinutes`, flags.
- [ ] **Step 4: Run to verify pass**, including the all-365 sweep.
- [ ] **Step 5: Commit** — `git commit -m "feat: session generator for all 365 days"`

---

### Task 8: Target engine

**Files:**
- Create: `js/engine.js`, `tests/engine.test.js`

**Interfaces:**
- Consumes: `Block`/`Rule` from Task 7, `HistoryAPI` from Task 4, helpers from Task 3.
- Produces:
  - `estimate1RM(evidence, { now, phaseWeekRange }) → number|null` — rule from §4.5: take the most recent `'1rm'` or `'single'` (×1.08) within 42 days; then apply `max(e, w×(1+r/30))` for each `'topset'` logged after that anchor and within the same phase; if no anchor, use the best Epley of topsets within 42 days; else null.
  - `targets(block, ctx) → Target` where `ctx = { history, settings, info, optionId, now }` and `Target = { text: string, sub?: string, prefill?: { sets?: Array<{w?:number, r?:number}>, time?: string, cal?: number }, missing?: boolean }`. `missing: true` means the fallback phrase was used.
  - `defaultOptionId(block, ctx) → string` — stored choice if visible; else for `pickDefault:'olderTest'` the machine whose `latestTest` is older or absent; else first visible option.

Behaviours to implement, each pinned by a test below: ladder start ("Start set of 7 at 315 lb" from last same-phase week's set logged for 7 reps; sub "then +5–10 lb each set"), tempoProg (last top × 1.04 rounded), wave (e1RM × pct, "≈ 265 lb · RPE 8–9, no misses", sub naming the source), percent, pctSingle (refWeek's single × pct), plusFive (last logged working weight + 5), emom with pct (refWeek single × pct) or plusFive otherwise, rowPace (split from latest `row2k` within 42 days, offsets), bikePace (`P = cal/10`, target cal = `round(P × mult × seconds/60)`), runPace (pace/km from `run5k`; moderate +60–75 s, easy +90–120 s; shows "comfortable but challenging" when absent), peakRepeat (max weight from the introduce week's log), density ("Beat N" from last same-circuit same-format total), consistency (last average round time), beatLast, zone2 (HR range via `maxHRFrom(settings)` plus talk-test text), none.

- [ ] **Step 1: Write failing tests** with a fake `history` object built per test:

```js
test('ladder start from last week same rep count', () => { const h = fake({ logs: { 'd2.A.deadlift': [{ day:2, block:{ sets:[{w:315,r:7},{w:335,r:6},{w:355,r:5}] } }] } }); const t = targets(ladderBlock([6,5,4],'A'), ctx(h, { n:9 })); assert.equal(t.text, 'Start set of 6 at 335 lb'); assert.equal(t.prefill.sets[0].w, 335); });
test('ladder with no history', () => { const t = targets(ladderBlock([8,7,6],'A'), ctx(fake({}), { n:2 })); assert.match(t.text, /Work up/); assert.equal(t.missing, true); });
test('tempo progression', () => { const h = fake({ logs: { 'd1.B.backsquat': [{ day:1, block:{ sets:[{w:225,r:6},{w:245,r:6}] } }] } }); assert.equal(targets(tempoBlock(4,5), ctx(h, { n:8 })).text, 'Top set ≈ 255 lb'); });
test('estimate1RM: single anchor then topsets only raise', () => { const ev = [{ kind:'single', weight:305, reps:1, at: now-7*86400e3, week:6 }, { kind:'topset', weight:255, reps:6, at: now-1000, week:7 }]; assert.equal(estimate1RM(ev, { now }), 329); const ev2 = [...ev, { kind:'topset', weight:285, reps:6, at: now-500, week:7 }]; assert.equal(estimate1RM(ev2, { now }), 342); });
test('estimate1RM: tested 1rm newer than single wins; stale evidence ignored', () => { assert.equal(estimate1RM([{ kind:'single', weight:305, reps:1, at: now-50*86400e3, week:6 }], { now }), null); assert.equal(estimate1RM([{ kind:'single', weight:305, reps:1, at: now-20*86400e3, week:6 }, { kind:'1rm', weight:340, reps:1, at: now-1000, week:12 }], { now }), 340); });
test('wave target from e1RM', () => { const h = fake({ evidence: { backsquat: [{ kind:'single', weight:305, reps:1, at: now-7*86400e3, week:6 }] } }); const t = targets(waveBlock(6, 0.80), ctx(h, { n:43 })); assert.equal(t.text, 'Top set ≈ 265 lb · RPE 8–9, no misses'); assert.match(t.sub, /330/); });
test('wave without evidence', () => assert.equal(targets(waveBlock(6, 0.80), ctx(fake({}), { n:43 })).text, 'Work to RPE 8–9, no misses'));
test('percent and pctSingle and plusFive', () => { const h = fake({ evidence: { deadlift: [{ kind:'1rm', weight:405, reps:1, at: now-3*86400e3, week:12 }] }, logs: { 'd5.A.clean.hpc': [{ day:5, block:{ sets:[{w:185,r:1}] }, week:1 }, { day:19, block:{ sets:[{w:170,r:3}] }, week:3 }] } }); assert.equal(targets(percentBlock('deadlift',3,3,0.75), ctx(h,{n:86})).text, '3 × 3 @ 305 lb (75%)'); assert.equal(targets(pctSingleBlock(0.9,1), ctx(h,{n:12})).text, '6 × 3 @ 165 lb (90% of 185)'); assert.equal(targets(plusFiveBlock(), ctx(h,{n:26})).text, '5 × 3 @ 175 lb (+5)'); });
test('row pace and fallback when switching machines', () => { const h = fake({ tests: { row2k: { value:448, at: now-3*86400e3 } } }); const t = targets(machineBlock(rowScheme(2,{})), ctx(h, { n:8, optionId:'rower' })); assert.equal(t.text, '12 × 500 m @ 1:52 /500m · walk 2:00'); const b = targets(machineBlock(rowScheme(2,{})), ctx(h, { n:8, optionId:'bike' })); assert.match(b.text, /comfortable but challenging/i); assert.equal(b.missing, true); });
test('bike calories', () => { const h = fake({ tests: { bike10: { value:210, at: now-3*86400e3 } } }); assert.equal(targets(machineBlock(rowScheme(2,{})), ctx(h, { n:8, optionId:'bike' })).text, '12 × 1:30 → 33 cal · easy 2:00'); });
test('run pace', () => { const h = fake({ tests: { run5k: { value:1320, at: now-3*86400e3 } } }); const t = targets(runBlock('R1'), ctx(h, { n:3 })); assert.match(t.sub, /fast 4:24 \/km/); assert.match(t.sub, /moderate 5:24–5:39 \/km/); });
test('peak repeat, density, zone2', () => { const h = fake({ logs: { 'd2.B.singleleg.rfe': [{ day:23, block:{ sets:[{w:40,r:8},{w:45,r:8},{w:50,r:8}] } }] }, density: { 'd2.D.bw.A:emom16': 212 } }); assert.equal(targets(peakBlock('d2.B.singleleg.rfe'), ctx(h,{n:30})).text, 'All sets at 50 lb'); assert.equal(targets(densityBlock('A','emom16'), ctx(h,{n:30})).text, 'Beat 212 total reps'); assert.equal(targets(zone2Block(40), ctx(fake({}), { n:4, settings:{ maxHR:190 } })).text, '40 min · 124–143 bpm'); });
test('defaultOptionId prefers stored choice, else older test, else first', () => { const h = fake({ choices: {}, tests: { row2k: { value:448, at: now-2*86400e3 }, bike10: { value:200, at: now-40*86400e3 } } }); assert.equal(defaultOptionId(machineTestBlock(), ctx(h,{n:89})), 'bike'); });
```

The helper constructors (`ladderBlock`, `waveBlock`, `fake`, `ctx`, …) live at the top of the test file; `fake()` returns an object implementing `HistoryAPI` plus a `density` lookup via `logsFor` on slotKeys of the form `'d2.D.bw.A'` with `block.total`. `machineBlock(rowSchemeForWeek)` builds a Day 1 C block with `options: MACHINE_OPTIONS`, `rule: { type:'rowPace', scheme }`, and `altRules: { bike: { type:'bikePace', scheme: bikeScheme(sameWeek, {}) } }`, so the engine switches rule by `ctx.optionId`. The wave `sub` text shows the e1RM rounded with `roundLoad` ("80% of estimated 1RM 330 · from Week 6 single 305 × 1.08"). Keep the helpers small.

- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement `js/engine.js`.** One function per rule type in a dispatch table `RULES[type](block, ctx)`; shared helpers `lastSameRepSet`, `anchorEvidence`. Copy text templates exactly from the tests.
- [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `git commit -m "feat: target engine implementing progression rules"`

---

### Task 9: Nutrition and benchmarks

**Files:**
- Create: `js/nutrition.js`, `js/benchmarks.js`, `tests/nutrition.test.js`

**Interfaces:**
- Produces: `macros(bodyweightLb) → { kcal, protein, fat, carbs }` with `kcal = 14·bw`, `protein = 1.0·bw`, `fat = 0.27·bw` (all rounded to whole numbers), `carbs = round((kcal − 4·protein − 9·fat)/4)`; `MIKE_EXAMPLE = { kcal:2800, protein:180, fat:'50–60', carbs:395 }`.
- Produces: `BENCHMARKS: Array<{ test, label, unit, solid, strong, elite, lowerIsBetter }>` with exactly the §4.6 values (row 8:00/7:30/7:00 as seconds; 5k 25/22/20 min; 1.5 mi 12:00/10:30/9:30; push-ups 50/65/80; sit-ups 50/65/80; pull-ups 10/15/20; 4-mi ruck 70/60/55 min; lifts as bodyweight multiples 1.5/2/1.25/0.85 under `unit:'xBW'` with a single threshold stored in `solid`).

- [ ] **Step 1: Write failing tests**

```js
test('macros at 200 lb reproduce Mike-scale numbers', () => assert.deepEqual(macros(200), { kcal:2800, protein:200, fat:54, carbs:379 }));
test('benchmarks', () => { const row = BENCHMARKS.find(b => b.test === 'row2k'); assert.deepEqual([row.solid, row.strong, row.elite], [480, 450, 420]); assert.equal(row.lowerIsBetter, true); assert.equal(BENCHMARKS.find(b => b.test === 'pullupsMax').elite, 20); });
```

- [ ] **Step 2: Run to verify failure.** — [ ] **Step 3: Implement.** — [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `git commit -m "feat: macro guideline and benchmark table"`

---

### Task 10: App shell, router, and Today view (layout B)

**Files:**
- Create: `index.html`, `styles.css`, `js/main.js`, `js/ui/router.js`, `js/ui/dom.js`, `js/ui/today.js`
- Test: manual, in a browser against `npm run serve`

**Interfaces:**
- Consumes: `createStore`, `session`, `targets`, `defaultOptionId`, `visibleOptions`, `format.js`.
- Produces: `js/ui/dom.js` exports `h(tag, attrs, ...children)` and `clear(el)`; `router.js` exports `onRoute(cb)` and `go(hash)` for `#today|#days|#scorecard|#settings`; `today.js` exports `renderToday(root, app)` where `app = { store, now: () => Date.now() }`; `main.js` wires store, router, and views, and registers `sw.js` if available.

- [ ] **Step 1: Write `index.html`**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="theme-color">` for light and dark, `<link rel="manifest">`, `<link rel="apple-touch-icon" href="icons/icon-192.png">`, a `<header id="hdr">`, `<main id="view">`, a fixed `<nav class="tabs">` with four links, and `<script type="module" src="js/main.js">`. A `<noscript>` line.
- [ ] **Step 2: Write `styles.css`**: tokens on `:root` (bg, card, text, muted, accent green, target bg/border, chip colors) with `@media (prefers-color-scheme: dark)` overrides; `body` explicit background; 16 px side gutters; `.card`, `.card.collapsed`, `.letter`, `.chip`, `.chip.sel`, `.target`, `.sets .in` (`height:44px`, `font-size:17px`), `.cta` (`height:52px`), `.tabs` fixed bottom with safe-area padding; `.pm` dashed; no hover-only affordances.
- [ ] **Step 3: Write `dom.js`, `router.js`, `main.js`.** `main.js`: `const store = createStore(); onRoute(r => views[r](root, app));` default route `#today`; if `!store.persistent` show a persistent banner "Can't save on this browser: logs will be lost when you close the app."; show the backup nag banner when `lastExportAt` is null or older than 14 days and at least one day is complete.
- [ ] **Step 4: Write `today.js`** implementing §5.2 Today in layout B:
  - Header: `Day N` large; `Cycle c · Week w · <phase label> · ~<estMinutes> min`; title; progress bar `(days completed in run)/365`.
  - Blocks: `session(currentDay, settings)` filtered by `advanced`; each block renders collapsed unless it is the "open" block (first with `!done`, or the one tapped). Collapsed row: letter, name, key figure (first `rx` token such as "5 × 3" or scheme summary), chooser chip if options, done mark. Expanded card: option chips (from `visibleOptions`; tapping calls `store.setChoice(slotKey, id)` and re-renders), `rx` lines, `targets()` output in the green box with `sub`, inputs per `block.inputs` (numeric keypads via `inputmode="decimal"`; time fields `inputmode="numeric"` parsed with `parseTime`), prefilled greys from `prefill`, a notes line, and a done toggle. Each input change calls `store.logBlock(n, key, { slotKey, optionId, ruleType: rule.type, lift, ...patch })`. If `block.test` and the primary value is valid, done also calls `store.recordTest(testId, value, n)` (for `max_*` tests the value is the heaviest logged set).
  - Marking done auto-expands the next not-done block.
  - "Complete Day N" button → `store.completeDay(n)`; then render the next day. Rest day shows the single card and the button reads "Rest logged". Graduation renders the §4.8 screen with the Scorecard summary.
  - A small "Day ◀ ▶" control in the header to peek at adjacent days without changing the pointer; a "Set as current day" link appears when viewing a day that is not current.
- [ ] **Step 5: Verify in browser.** Run `npm run serve` (background) and, using the Claude in Chrome tools at phone width (390 px), load `http://localhost:8080/#today`. Expected: Day 1 renders with blocks A–D, B collapsed under A; tapping B expands it and collapses A; entering `315 × 7` on Day 2's deadlift, completing Day 1 and Day 2, then viewing Day 9 shows "Start set of 6 at 335 lb" after logging 335×6 on Day 2 (log all three ladder sets); entering `728` in the Day 1 2k field and completing Day 1 makes Day 8's C block read `12 × 400 m @ 1:52 /500m · walk 1:30`. Take a screenshot in light and in dark mode. Fix anything that does not match.
- [ ] **Step 6: Commit** — `git commit -m "feat: app shell and Today view (one-at-a-time layout)"`

---

### Task 11: Days, Scorecard, and Settings views

**Files:**
- Create: `js/ui/days.js`, `js/ui/scorecard.js`, `js/ui/settings.js`, `js/backup.js`, `tests/backup.test.js`
- Modify: `js/main.js` (register the three views)

**Interfaces:**
- Consumes: store, `session`, `BENCHMARKS`, `macros`, `estimate1RM`.
- Produces: `renderDays(root, app)`, `renderScorecard(root, app)`, `renderSettings(root, app)`; `js/backup.js` exports `backupFilename(day) → 'bhl-backup-day<N>.json'` and `async shareOrDownload(text, filename, nav = globalThis.navigator, env = { document: globalThis.document }) → 'shared'|'downloaded'|'copied'` which tries `nav.share({ files })` when `nav.canShare` accepts a File, else an anchor download when `env.document` exists, else `nav.clipboard.writeText`; throws if none is available.

- [ ] **Step 1: Write failing tests for `backup.js`** (pure parts only):

```js
test('filename', () => assert.equal(backupFilename(47), 'bhl-backup-day47.json'));
test('shareOrDownload falls through to clipboard when share and download unavailable', async () => { const writes = []; const r = await shareOrDownload('x', 'f.json', { clipboard: { writeText: async t => writes.push(t) } }, { document: null }); assert.equal(r, 'copied'); assert.deepEqual(writes, ['x']); });
```
(Give `shareOrDownload` a fourth `env` parameter `{ document }` so the download path can be disabled in Node.)

- [ ] **Step 2: Run to verify failure; implement `backup.js`; run to verify pass.**
- [ ] **Step 3: Write `days.js`**: the year grouped as Cycle → Week → seven rows `Day N · <title> · ✓/·`; current day highlighted; tapping a row opens Today at that day (peek mode); long-press or a row action "Set as current".
- [ ] **Step 4: Write `scorecard.js`**: one table per test in `BENCHMARKS` order plus the lift maxes: columns per run×cycle with the best value in that cycle, an "All-time best" column, and the solid/strong/elite thresholds under each; lifts show e1RM from `estimate1RM` and, when `bodyweight` is set, the ×BW multiple against the benchmark. Times formatted with `fmtTime`.
- [ ] **Step 5: Write `settings.js`** per §5.2 Settings: current day (number input + "Set"), units toggle, Base/Advanced toggle, max HR and age fields, bodyweight, equipment checklist (labels: Plyo box, Jump rope, Kettlebells, Rings, Climbing rope, Hurdles, Weight vest, Slam ball, Heart-rate monitor), the nutrition card (§5.7 text with `macros(bodyweight)` and `MIKE_EXAMPLE`), Backup section (button "Save a backup" → `shareOrDownload(store.exportJSON(), backupFilename(day))`; "Restore from backup" → file input and a paste box → `store.importJSON`, confirmation names the number of logged days it will replace), "Last backup: <date or never>", "Start over at Day 1" (confirm once; calls `startRun`), "Erase everything" (confirm twice; `eraseAll`).
- [ ] **Step 6: Verify in browser** at phone width: Days list scrolls and opens Day 43; Scorecard shows the 2k entered in Task 10 under Cycle 1 with thresholds; Settings toggles Advanced and the Today view then shows the PM card; equipment unchecking "Plyo box" changes Day 2's plyo default to the broad-jump option; "Save a backup" produces a file or clipboard copy; "Restore" with that text succeeds; "Start over" returns to Day 1 with Days showing the old run's checks gone and Scorecard still showing the old 2k. Screenshot each tab.
- [ ] **Step 7: Commit** — `git commit -m "feat: Days, Scorecard, and Settings views with backup and restore"`

---

### Task 12: PWA packaging, icons, service worker

**Files:**
- Create: `manifest.webmanifest`, `sw.js`, `scripts/make_icons.py`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/maskable-512.png`
- Modify: `js/main.js` (service-worker registration already stubbed), `index.html` (manifest and icon links already present)

- [ ] **Step 1: Write `scripts/make_icons.py`** (Pillow): dark green `#0f2a1f` rounded square with a white barbell glyph (one horizontal bar, two plates each side) and export 192, 512, and a maskable 512 with 20% safe padding. Run: `python3 scripts/make_icons.py` Expected: three PNG files under 20 KB each.
- [ ] **Step 2: Write `manifest.webmanifest`**: `name "BHL Year"`, `short_name "BHL"`, `start_url "./#today"`, `scope "./"`, `display "standalone"`, `background_color`, `theme_color`, icons array with `purpose "any"` and `"maskable"`.
- [ ] **Step 3: Write `sw.js`**: `const VERSION = 'v1'; const ASSETS = ['./', './index.html', './styles.css', './manifest.webmanifest', './js/main.js', …every js file…, './icons/icon-192.png', './icons/icon-512.png']`; install pre-caches, activate deletes old caches, fetch is cache-first for same-origin GET with network fallback and cache update. Add a comment: bump `VERSION` on every deploy.
- [ ] **Step 4: Register in `main.js`** inside `if ('serviceWorker' in navigator)`, relative path `'./sw.js'`, errors swallowed.
- [ ] **Step 5: Verify**: serve, load in Chrome, confirm in the browser tool that `navigator.serviceWorker.controller` is non-null after reload, then stop the server and reload: Expected the app still renders. Run a size check: `du -ch index.html styles.css sw.js manifest.webmanifest js icons | tail -1` Expected under 500K.
- [ ] **Step 6: Commit** — `git commit -m "feat: installable offline PWA packaging"`

---

### Task 13: Deploy to GitHub Pages and finish the README

**Files:**
- Modify: `README.md`
- Create: none

- [ ] **Step 1: Run the full suite** — `npm test` Expected: all pass, 0 fail.
- [ ] **Step 2: Create the repository and push** (public: GitHub Pages on a free plan requires it; `data/` is git-ignored so no personal data is pushed; verify with `git ls-files | grep -c '^data/'` Expected `0`):

```bash
gh repo create bhl-year --public --source=. --remote=origin --description "365-day BHL-style training program app" --push
```

- [ ] **Step 3: Enable Pages from `main` root**

```bash
gh api -X POST repos/mbocon/bhl-year/pages -f "source[branch]=main" -f "source[path]=/" || gh api -X PUT repos/mbocon/bhl-year/pages -f "source[branch]=main" -f "source[path]=/"
```

Then poll `gh api repos/mbocon/bhl-year/pages --jq .status` until `built`, and `gh api repos/mbocon/bhl-year/pages --jq .html_url` for the URL.

- [ ] **Step 4: Verify the live site** in the browser tool: the URL loads, Today renders Day 1, the manifest and `sw.js` return 200 (`read_network_requests`), and the Lighthouse-style basics hold: no console errors.
- [ ] **Step 5: Finish `README.md`** "Put it on your phone": open the URL in Safari or Chrome on the phone, Share → Add to Home Screen; the app then works offline; back up from Settings every couple of weeks; to share with someone else send them the same URL. Also a "Developing" section: `npm test`, `npm run serve`, bump `VERSION` in `sw.js` before pushing.
- [ ] **Step 6: Commit and push** — `git commit -am "docs: phone install and development notes" && git push`.
- [ ] **Step 7: Report** the live URL, the repo URL, and the note that `data/` stayed local.
