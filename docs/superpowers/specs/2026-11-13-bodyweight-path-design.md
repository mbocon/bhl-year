# Bodyweight path: a second program in the app

Approved in conversation on 2026-11-13 and revised on 2026-11-16. Lines marked **(my call)** were decided by the builder, not the owner.

The 2026-11-16 revision replaced the original two-phase program (12 weeks of full-body days, then one body part a day) with a single weekly pattern that never changes. The owner asked for a program they could keep doing indefinitely alongside three jiu-jitsu classes a week.

## Intent

The owner wants a simpler program they can switch to inside the same app: slow, controlled reps, mostly bodyweight, with a workout for every day from Day 1 with no last day. BHL stays available and untouched, and each program keeps its own place.

## Goals

- A **Program** choice in Settings: `BHL Year` or `Bodyweight`.
- Each program keeps its own current day and its own log. Switching back resumes where that program was left.
- The Bodyweight path prescribes every day from Day 1 onward with no upper limit.
- The app shows the day's rep target and rep speed for each move.
- Every day lists something optional to do on top of the steps goal, clearly marked as optional.

## Non-goals

- No change to BHL days, targets, tests or the macro card. The calorie figure stays as it is and the existing two-week review corrects it.
- No equipment toggles for this path. It assumes a pull-up bar, dip handles, bands, a bench or box, a barbell or dumbbells, and a bike or rower for the optional cardio.
- No exercise picker. Easier and harder versions are given as cues.
- The app does not know weekdays. The owner starts Day 1 on the weekday that makes the class days line up.

## Anti-goals

- No text copied from the purchased guides that inspired the method. The app and repo are public, so every instruction is written fresh, and the path carries no author or brand name.
- No personal names anywhere in the UI.
- Nothing is pushed or deployed until the owner asks.

## The program

Weeks are 7 days. Week numbers count from Day 1. Odd weeks are **A**, even weeks are **B**.

### The week

| Day of week | Session |
|---|---|
| 1 | Full body |
| 2 | Rest |
| 3 | Jiu-jitsu class |
| 4 | Full body |
| 5 | Jiu-jitsu class |
| 6 | Full body |
| 7 | Jiu-jitsu class |

- Every day has a **Steps** block (goal 10,000) and ends with one optional **Cardio** block.
- A class day has a block for the class itself. If class is canceled, the cardio block stands in for it. A second full-body session was ruled out as the stand-in because it would sit next to a full-body day.

### Full-body days

Six moves, done as three pairs. A pair is one set of the first move, straight into one set of the second, then 60–90 s of rest. The three pairs are repeated until every target is met, each set stopping 1–2 reps short of failure.

| Pair | Day 1 | Day 4 | Day 6 |
|---|---|---|---|
| 1, week A | Pull-ups (band), push-ups | Chin-ups (band), dips then push-ups | Pull-ups (band), push-ups |
| 1, week B | Chin-ups (band), dips then push-ups | Pull-ups (band), push-ups | Chin-ups (band), dips then push-ups |
| 2 | Bulgarian split squats, hanging knee raises | Lunges, hanging knee raises | Step-ups, hanging knee raises |
| 3 | Standing overhead press, calf raises | same | same |

- Target per move: 25 reps in weeks 1–4, 30 in weeks 5–8, 35 from week 9 on with no further rise. Leg moves are per leg. Three sessions of 35 is about 100 reps of a move each week.
- Pairing halves the number of rests, so a session is about 35 minutes at 25 reps and 45 at 35. **(my call: the estimates)**

### How reps slow down

Reps come first, then time under tension, then a harder version of the move.

- Weeks 1–8: every rep is 3 s down and 3 s up, whatever was logged.
- From week 9, per move: a logged session that meets 35 makes the next session 4 s each way.
- Meeting 35 at 4 s means the move gets harder (less band, added weight or a harder version) and the speed goes back to 3 s. The cycle then repeats without end.
- 4 s is the ceiling **(my call)**: reps much slower than that stop adding anything, and a harder version does more.
- The app follows the run of consecutive met sessions for the move: an odd run means 4 s, an even run means "make it harder, back to 3 s", and a missed session resets the run.

### Optional cardio

One block, three sessions to pick from. The choice is remembered.

| Option | Session |
|---|---|
| Easy | 30–40 minutes at a pace where you can hold a conversation |
| Steady | 20 minutes at one pace where you can say a few words at a time |
| Intervals | 8 rounds of 20 s hard and 100 s easy, 16 minutes |

The block's last line says when it fits: after the session on a full-body day, only if you feel good on a rest day, and for a canceled class or a fresh day on a class day. **(my call: the wording and the three sessions)**

## How it is built

### Approaches

1. **A second path beside BHL, chosen in Settings (picked).** One new program module produces Bodyweight days; a `path` setting routes `session()` to it; the store keeps a per-path day and run. BHL code paths are unchanged, and the Today screen is reused as is.
2. **Replace the BHL calendar with a generic "program" engine both paths use.** Cleaner in the long run, but it rewrites working BHL code and its 365-day tests for no gain today.
3. **A separate app.** No risk to BHL, but the owner loses the shared scale log, backup and home-screen icon.

The owner asked for an alternative path inside the BHL app, which rules out 3; 2 is more change than the request needs.

### Pieces

- `js/paths.js`: the list of paths, each with `id`, `name`, `lastDay` (365 for BHL, `Infinity` for Bodyweight), and helpers `pathOf(settings)`, `lastDayOf(settings)`.
- `js/program/bodyweight.js`: `bwDayInfo(n)`, `bwTitle(n)`, `bwSession(n)` and `bwMoves(week)`, pure functions returning the same session shape the Today screen already renders. Move history lives under `bw.f.*` slot keys, so it never mixes with BHL.
- `js/program/index.js`: `session(n, settings)` returns `bwSession(n)` when `settings.path === 'bodyweight'`.
- `js/engine.js`: a `slowReps` rule that reads the move's prior logs and returns the target text; an exported `repSpeed()` helper.
- `js/store.js`: `settings.path` (default `bhl`), `state.paths` holding `{currentDay, currentRun}` for the path not in use, a `path` tag on each run, `switchPath(id)`, and `completeDay` capped by the path's last day. `migrate()` fills all of this for existing saves and old backups.
- `js/ui/today.js`: day limit, header line and progress bar follow the path; a short "how today works" card; a small heading over each pair; the logged target is saved with each block.
- `js/ui/days.js`: on the Bodyweight path, lists weeks from Day 1 to four weeks past the current day.
- `js/ui/settings.js`: the Program select; the BHL-only Advanced toggle and Equipment section are hidden on the Bodyweight path.
- `js/ui/scorecard.js`: on the Bodyweight path, a small table of each move's rep speed, last total and best total. **(my call)**
- `js/nutrition.js`: the "past Day 365" wording only applies to a path that ends at 365.
- `sw.js`: cache the new files and bump the version on every release.

### Session shape additions

- `path`: `'bodyweight'`. `cycle` is `null`. `graduation` is always `false`.
- `brief`: optional array of lines shown in a card above the blocks.
- `rotation`: how many of the day's blocks are the paired moves (0 on other days).
- Block `group`: blocks that share a group sit under one small heading (`Pair 1`, `Also today`).
- Block `fig`: overrides the short figure shown on a closed card; an empty string shows none.
- The cardio block reuses two existing mechanisms: `advanced: true`, which the Today screen renders as "Optional" and leaves out of the required count, and `options` with `altRules`, which render as a "Choose one" picker.

## Testing

- Program: the weekly pattern at days 1, 85, 365 and 7001, pairs and their order, A/B rotation, targets by week, the steps and cardio blocks on every day, every day from 1 to 1,200 producing a well-formed session, figures short enough for a phone.
- Engine: speed held while targets rise, the 3 s and 4 s cycle, the "make it harder" step, a missed session resetting the run, target wording.
- Store: migration of an old save, switching paths and back, separate logs, completing days past 365 on Bodyweight and the 365 cap on BHL.
- UI: the Bodyweight path renders days 1–400 with every block opened; pair headings; the cardio picker; the Settings select switches paths; the Days view renders.
- The existing BHL suite still passes unchanged.
