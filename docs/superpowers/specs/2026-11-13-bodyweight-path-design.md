# Bodyweight path: a second program in the app

Approved in conversation on 2026-11-13. Lines marked **(my call)** were decided by the builder, not the owner.

## Intent

The owner wants a simpler program they can switch to inside the same app: slow, controlled reps, mostly bodyweight, with a workout for every day from Day 1 with no last day. BHL stays available and untouched, and each program keeps its own place.

## Goals

- A **Program** choice in Settings: `BHL Year` or `Bodyweight`.
- Each program keeps its own current day and its own log. Switching back resumes where that program was left.
- The Bodyweight path prescribes every day from Day 1 onward with no upper limit.
- The app shows the day's rep target and rep speed for each move and slows the reps when the target is met.

## Non-goals

- No change to BHL days, targets, tests or the macro card. The calorie figure stays as it is and the existing two-week review corrects it.
- No equipment toggles for this path. It assumes a pull-up bar, dip handles, bands, a bench or box, a barbell or dumbbells. The bike is optional.
- No exercise picker. Easier and harder versions are given as cues.

## Anti-goals

- No text copied from the purchased guides that inspired the method. The app and repo are public, so every instruction is written fresh, and the path carries no author or brand name.
- No personal names anywhere in the UI.
- Nothing is pushed or deployed until the owner asks.

## The program

Weeks are 7 days. Week numbers count from Day 1. Odd weeks are **A**, even weeks are **B**.

### Days 1–84: full body, three days a week

| Day of week | Session |
|---|---|
| 1, 3, 5 | Full body, six moves done as a rotation |
| 2, 4, 6 | Walk, building toward 10,000 steps |
| 7 | Rest |

Days 1 and 5 also carry an optional block: bike intervals, 8 rounds of 20 s hard and 100 s easy.

| Move | Day 1 | Day 3 | Day 5 |
|---|---|---|---|
| Legs | Bulgarian split squats | Lunges | Step-ups |
| Push, week A | Push-ups | Dips, then push-ups | Push-ups |
| Push, week B | Dips, then push-ups | Push-ups | Dips, then push-ups |
| Pull, week A | Pull-ups (band) | Chin-ups (band) | Pull-ups (band) |
| Pull, week B | Chin-ups (band) | Pull-ups (band) | Chin-ups (band) |
| Shoulders | Standing overhead press | same | same |
| Core | Hanging knee raises | same | same |
| Calves | Calf raises | same | same |

- Target per move: 25 reps in weeks 1–4, 30 in weeks 5–8, 35 in weeks 9–12. Leg moves are per leg.
- Rotate through the moves one set at a time, 60–90 s between moves, each set stopping 1–2 reps short of failure.
- Rep speed starts at 3 s down and 3 s up.

### Day 85 onward: one part a day, repeating forever

| Day of week | Part | Moves and goal |
|---|---|---|
| 1 | Back + calves | Pull-ups (band), 100 total; calf raises, 100 |
| 2 | Chest | Dips then push-ups, 100 total between them |
| 3 | Legs + calves | Split squats 35, lunges 35, step-ups 30, each per leg; calf raises, 100 |
| 4 | Arms | Chin-ups (band), 100 total |
| 5 | Shoulders + calves | Standing overhead press, 100 total |
| 6 | Core | Hanging knee raises, 100 total |
| 7 | Rest | Easy walk if wanted |

- Days 1–6 end with a steps block (build toward 10,000). Days 2 and 6 carry the optional bike intervals. **(my call: which two days)**
- 100 is the goal, not the first day's number. With no history the ask is "count every rep, stop at 30 minutes". After that the ask is "beat last time", with a hard stop at 45 minutes.
- Rep speed restarts at 3 s each way on Day 85, because the day's work on each move roughly triples. **(my call)**

### How reps slow down

One rule for both phases, per move:

- Speed starts at 3 s down, 3 s up.
- Each logged session that meets the target moves the next session one second slower each way, up to 5 s. **(my call: the 5 s ceiling)**
- For the 100-rep moves, "meets the target" also needs the logged minutes to be 45 or less (15 for calf raises). A session with no minutes logged counts on reps alone. **(my call)**
- At 5 s the app says to make the move harder: less band, added weight or a harder version.

## How it is built

### Approaches

1. **A second path beside BHL, chosen in Settings (picked).** One new program module produces Bodyweight days; a `path` setting routes `session()` to it; the store keeps a per-path day and run. BHL code paths are unchanged, and the Today screen is reused as is.
2. **Replace the BHL calendar with a generic "program" engine both paths use.** Cleaner in the long run, but it rewrites working BHL code and its 365-day tests for no gain today.
3. **A separate app.** No risk to BHL, but the owner loses the shared scale log, backup and home-screen icon.

The owner asked for an alternative path inside the BHL app, which rules out 3; 2 is more change than the request needs.

### Pieces

- `js/paths.js` (new): the list of paths, each with `id`, `name`, `lastDay` (365 for BHL, `Infinity` for Bodyweight), and helpers `pathOf(settings)`, `lastDayOf(settings)`.
- `js/program/bodyweight.js` (new): `bwDayInfo(n)`, `bwTitle(n)` and `bwSession(n)`, pure functions of the day number, returning the same session shape the Today screen already renders. Slot keys are `bw.f.*` for days 1–84 and `bw.s.*` after, so history never mixes with BHL or across the two phases.
- `js/program/index.js`: `session(n, settings)` returns `bwSession(n)` when `settings.path === 'bodyweight'`.
- `js/engine.js`: a `slowReps` rule that reads the move's prior logs and returns the target text; an exported `repSpeed()` helper.
- `js/store.js`: `settings.path` (default `bhl`), `state.paths` holding `{currentDay, currentRun}` for the path not in use, a `path` tag on each run, `switchPath(id)`, and `completeDay` capped by the path's last day. `migrate()` fills all of this for existing saves and old backups.
- `js/ui/today.js`: day limit, header line and progress bar follow the path; a short "how today works" card; the logged target is saved with each block; the reps input accepts a placeholder.
- `js/ui/days.js`: on the Bodyweight path, lists weeks from Day 1 to four weeks past the current day.
- `js/ui/settings.js`: the Program select; the BHL-only Advanced toggle and Equipment section are hidden on the Bodyweight path.
- `js/ui/scorecard.js`: on the Bodyweight path, a small table of each move's rep speed, last total and best total. **(my call)**
- `js/nutrition.js`: the "past Day 365" wording only applies to a path that ends at 365.
- `sw.js`: cache the two new files and bump the version.

### Session shape additions

- `path`: `'bodyweight'`. `cycle` is `null`. `graduation` is always `false`.
- `brief`: optional array of lines shown in a card above the blocks.
- The optional bike block reuses the existing `advanced: true` flag, which the Today screen already renders as "Optional" and leaves out of the required count.

### Left to the builder

- Exact wording of cues, written fresh.
- Estimated minutes per session.
- Test layout.

## Testing

- Program: weekly pattern, A/B rotation, targets by week, split order, legs summing to 100 per leg, every day from 1 to 1,200 producing a well-formed session.
- Engine: rep speed progression, the 5 s ceiling, the time condition, target wording.
- Store: migration of an old save, switching paths and back, separate logs, completing days past 365 on Bodyweight and the 365 cap on BHL.
- UI: the Bodyweight path renders days 1–400 with every block opened; the Settings select switches paths; the Days view renders.
- The existing suite still passes unchanged.
