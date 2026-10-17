# BHL Year Program App — Design

Date: 2026-10-16
Status: draft for Mike's approval
Companion analysis: `docs/bhl_program_analysis.md` (reverse-engineering of the 2019 BHL cycle this is built from)

## 1. Intent and why

Mike followed a coached program ("BHL", delivered through TrueCoach) from March to July 2019. It is the only program that produced results he could see: fat loss, strength gains, and conditioning gains at the same time. He wants that again, for a full year, without a coach, and in a form that a second person could pick up cold.

The underlying goal is not a specific event. It is to be in "ready for anything" shape: a base strong, aerobic, and durable enough that a short specialization (two to three months) would get someone through a military selection course, a firefighter or police physical test, or a marathon.

The deliverable is a phone-friendly app that holds a 365-day program and does the arithmetic a coach would do: it reads what you lifted or rowed last time and tells you today's target.

## 2. Goals, non-goals, anti-goals

**Goals**
- A 365-day program, numbered Day 1 to Day 365, that reproduces the BHL structure and progression logic across four cycles.
- Zero-friction use: open the app, see today's session, do it, log it. No dates, no lookups, no mental math.
- Automatic targets: ladders start where last week ended, waves and deloads use your tested maxes, rowing and bike intervals use your test paces, "+5 lb" rules are applied.
- Options wherever Mike's equipment differs from BHL's, chosen by the user and remembered.
- Restartable and shareable: anyone can begin on Day 1 at any time; coming back from a month off means going back to Day 1 (or any day you choose).
- A base program of six required days a week plus an advanced layer (seventh day and optional second sessions).
- A built-in scorecard: the same test battery every cycle so progress toward "ready for anything" is visible.

**Non-goals**
- No accounts, no cloud sync, no sharing of logs between devices. The log lives on the phone the app is opened on (Mike's decision).
- No exercise video library or coaching cues beyond the short notes BHL used.
- No event-specific specialization blocks (marathon plan, selection prep). The year builds the base; specialization is a separate, later project.
- No calorie or food logging. A one-card macro guideline only.

**Anti-goals (what would make this a failure even if it technically works)**
- Needing to think about what to do, or scroll through documentation, at the gym.
- Grey-zone training: hard days that aren't hard, easy days that aren't easy. BHL's intensity discipline is the point.
- A day that silently assumes equipment the user doesn't have.
- Losing a log because the phone cleared its storage, with no way back.

## 3. Constraints

**Equipment (Mike's, and the default equipment profile)**
Water rower, air assault bike, barbell and plates, squat rack with dip attachment, adjustable bench, pull-up bar, adjustable dumbbells, EZ bar, 25 lb medicine ball, 50 lb sandbag, backpack/ruck, weighted sled (max 300 lb), running shoes, heart-rate monitor, jump rope (buying), plyo box (getting).

Not available by default (BHL used them): kettlebells, gymnastic rings, climbing rope, hurdles, weight vest or body armor, treadmill. Every slot that BHL wrote with one of these must offer at least one option that uses the default profile. Mike also asked that box and rope slots still carry alternatives (broad jumps, bench jumps, bike sprints) so the program works for someone without them; the equipment checklist in Settings controls which options are visible.

Units: pounds. Kilograms available as a setting.

**Time**
Main sessions may run 90 to 120 minutes. Day 4 and optional second sessions are shorter (30 to 75 minutes). The Day 6 long session grows across the year and may reach two hours.

**Device**
One phone. The app must work in a mobile browser with no install, offline after first load, and survive being added to the home screen.

**Numbering**
Every calendar day gets a number, including rest days. A week is always Days 1 to 7. Day 365 is the final day.

## 4. The program

### 4.1 Year map

| Span | Days | Content |
|---|---|---|
| Cycle 1 | 1–91 | 13 weeks |
| Cycle 2 | 92–182 | 13 weeks |
| Cycle 3 | 183–273 | 13 weeks |
| Cycle 4 | 274–364 | 13 weeks |
| Graduation | 365 | Rest. Scorecard review and "choose your specialization" summary. |

For any day number N: cycle = ceil(N/91), week in cycle = ceil(((N−1) mod 91 + 1)/7), day of week = ((N−1) mod 7) + 1.

### 4.2 The 13-week cycle

| Weeks | Phase | Strength character | Conditioning character |
|---|---|---|---|
| 1–6 | A: Accumulation | Slow tempo (42X1 squats, 21X1 bench, 10X1 deadlift and press). Reps drop one per week. Double-overhand deadlift only. Week 6 is heavy singles. | Intervals at test pace, distance waves, pace tightens in weeks 4–6. |
| 7–12 | B: Intensification | Tempo 20X1. Top-set waves 6-4-2 then 5-3-1 at RPE 8–9 ("no misses"). Hook grip allowed. Week 12 is max week. | Retest at week 7 sets paces; retest at week 12 closes the block. |
| 13 | Deload + Scorecard | 3×5 at 75% of new maxes. | Field tests: 1.5-mile run, 2-minute push-ups and sit-ups, max pull-ups, timed ruck, the machine not tested in week 12. |

This is BHL's 14-week Cycle 1 with its frozen weeks removed and the field tests added.

### 4.3 Weekly template

| Day | Name | Blocks | Time |
|---|---|---|---|
| 1 | Squat + Intervals | A plyo · B back squat · C machine intervals (rower or air bike, user's choice) · D core | 90–105 min |
| 2 | Hinge + Press + Work Capacity | A deadlift ladder · B single-leg · C press ladder · D bodyweight EMOM · E mixed modal at moderate pace · F (weeks 1–4 only) 10-min easy flush | 105–120 min |
| 3 | Run + Ruck | A run intervals · B ruck march · C crawls, drags, odd-object work | 75–120 min |
| 4 | Zone 2 + Pull + Press | A zone 2 (bike, row, or run) · B pull strength · C the press Day 2 is not laddering this phase, 4×6, then arms · D mobility | 55–85 min |
| 5 | Clean + Front Squat + Intervals | A clean · B front squat · C 45/45 or 60/60 intervals · D core | 80–95 min |
| 6 | Long Easy | Odd weeks: three 20-minute easy circuits + 10-min core EMOM. Weeks 2, 6, 10: long easy run. Weeks 4, 8, 12: long ruck. Week 13: ruck test. | 60–120 min |
| 7 | Rest (base) / Long Zone 2 (advanced) | Base: rest, optional 20–30 min walk. Advanced: 60–120 min zone 2 on bike, run, or ruck (whichever Day 6 was not). | 0 / 60–120 min |

Day 4 is new relative to BHL (Mike asked for six required days). It is deliberately easy so that Days 1, 2, 3, and 5 stay hard. Day 7 as rest in the base program is my call.

Within every session the order is fixed: power, then heavy strength, then conditioning, then core.

### 4.4 Block-by-block prescriptions

Notation: "w1..w13" is week in cycle. Tempo "42X1" means 4 s down, 2 s pause, explosive up, 1 s at top.

**Day 1 A — Plyometrics.** 5×3, rest 90 s to 3 min. Six variants rotate w1–w6 and repeat w7–w12 (w12 variant 5 is a max attempt). w13: 3×3 of variant 1, easy.
1. Drop jump into vertical jump, step off a 20 in box [option: step off bench]
2. Seated box jump from bench, raise the box each set [option: seated jump into broad jump]
3. Kneeling jump into vertical jump
4. Standing rebounding hurdle jumps 5×(2×3) over med ball, sandbag, or stacked plates [option: hurdles]
5. Max box jump, one step in [option: max broad jump for distance]
6. Lateral single-leg hop-overs over a plate, 5×10 alternating (3×10 in w13)

**Day 1 B — Back squat.**
| w | Prescription |
|---|---|
| 1 | 4×6 @42X1, rest 3 min, increase each set if possible |
| 2 | 4×5 @42X1 |
| 3 | 5×4 @42X1 |
| 4 | 5×3 @42X1 |
| 5 | 5×2 @42X1 |
| 6 | 5×1 @42X1, work to a heavy tempo single |
| 7 | @20X1 work to a top set of 6, RPE 8–9 (~80% of e1RM) |
| 8 | top set of 4 (~86%) |
| 9 | top set of 2 (~92%) |
| 10 | top set of 5 (~83%) |
| 11 | top set of 3 (~89%) |
| 12 | 1RM, controlled descent, spotter or safeties |
| 13 | 3×5 @75% of new 1RM, rest 3 min |

**Day 1 C — Machine intervals.** Rower or air bike, the user's choice every session (Mike's decision: never rotated by cycle). The chosen machine is remembered as the default. Each machine has its own targets from its own test; switching machines mid-phase shows that machine's most recent test pace, or "comfortable but challenging" if it has none.
Rower version (targets from the 2k time trial; "2k" = average split per 500 m):
| w | Prescription |
|---|---|
| 1 | First cycle of a run: 2000 m time trial after 10 min easy. Later cycles: 12×400 m @2k from the latest test, walk 1:30 |
| 2 | 12×500 m @2k, walk 2:00 |
| 3 | 12×600 m @2k, walk 2:00 |
| 4 | 12×400 m @2k−2 s, walk 1:30 |
| 5 | 12×500 m @2k−2 s, walk 2:00 |
| 6 | 12×600 m @2k−2 s, walk 2:00 |
| 7 | 3×(300 m @2k, rest 1:00, 100 m sprint, walk 3:00), rest 5:00, then 2000 m time trial |
| 8 | 12×400 m @new 2k, walk 1:30 |
| 9 | 12×500 m @2k, walk 1:30 |
| 10 | 12×600 m @2k, walk 2:00 |
| 11 | 3×1200 m @2k+2 / 2k / 2k−2, rest 3:00 |
| 12 | same as w7 (2k retest) |
| 13 | 20 min easy |
Air bike version (targets from a 10-minute max-calorie test; P = calories per minute averaged over that test):
| w | Prescription |
|---|---|
| 1 | First cycle of a run: 10-minute max-calorie test after 10 min easy. Later cycles: 12×1:15 @1.05 P from the latest test, easy 1:30 |
| 2 | 12×1:30 @ ≥1.05 P cal/min, easy spin 2:00 |
| 3 | 12×2:00 @1.05 P, easy 2:00 |
| 4 | 12×1:15 @1.10 P, easy 1:30 |
| 5 | 12×1:30 @1.10 P, easy 2:00 |
| 6 | 12×2:00 @1.10 P, easy 2:00 |
| 7 | 3×(1:00 @P, rest 1:00, 0:20 sprint, easy 3:00), rest 5:00, then 10-minute test |
| 8–10 | 12×1:15 / 1:30 / 2:00 @1.05 new P |
| 11 | 3×4:00 @0.95 P / 1.00 P / 1.05 P, rest 3:00 |
| 12 | same as w7 (retest) |
| 13 | 20 min easy |
The app shows the target as a calorie count for the interval length (e.g., "1:30 → 21 cal"). The multipliers are my starting guess; the builder may tune them.

**Day 1 D and Day 5 D — Core.** 4 sets, rest 90 s to 2 min. Rotate through: barbell rollouts 4×10; half-kneeling lateral med-ball throw 4×10/side; DB Turkish get-up 3×5/side; side-plank arch-up + side-plank twist 3×8/side; seated pike hold 4×30 s; L-hang on pull-up bar, 3 min accumulated; hollow hold, 4–5 min accumulated; half-kneeling landmine twist @2011 4×8/side; DB Russian twist 4×14–18; front-leaning rest on dip bars, 3 max sets; barbell floor wipers 4×12; hanging around-the-world 4×10. Day 1 and Day 5 use different items from the list in the same week.

**Day 2 A — Deadlift ladder.** Tempo 10X1, rest 3 min, "one heavy set at each rep count, increase weight each set." Phase A double-overhand only, no hook, no straps. Phase B: hook grip allowed when needed; w12 hook or straps for the max.
| w | Reps | w | Reps |
|---|---|---|---|
| 1 | 8/7/6 | 7 | 8/7/6 |
| 2 | 7/6/5 | 8 | 7/6/5 |
| 3 | 6/5/4 | 9 | 6/5/4 |
| 4 | 5/4/3 | 10 | 5/4/3 |
| 5 | 4/3/2 | 11 | 4/3/2 |
| 6 | 3/2/1/1 | 12 | 3/2/1/1 (max) |
| 13 | 3×3 @75% of new max |

**Day 2 B — Single-leg.** Each variant appears in a pair of weeks: first week "increase weight each set," second week "all sets at the peak weight you reached last time." Rest 3 min.
w1–2 barbell back-rack reverse lunge 3×8/leg · w3 DB front-rack step-up to bench 3×8/leg · w4 rear-foot-elevated DB split squat 3×8/leg · w5–6 barbell front-rack reverse lunge 3×8/leg · w7–8 barbell back-rack walking lunge 4×10 alternating · w9 RFE split squat 3×8/leg (heavier) · w10 DB step-up 3×8/leg · w11–12 barbell front-rack walking lunge 4×10 alternating · w13 bodyweight or light reverse lunge 2×8/leg.

**Day 2 C — Press ladder.** Same rep ladder as the deadlift, same weeks. Bench press @21X1 in one phase and standing barbell press @10X1 in the other; which lift goes in Phase A alternates by cycle (see 4.7). w13: 3×5 @75%.

**Day 2 D — Bodyweight density.** Two circuits alternate weekly. Each station is "as many reps as possible in the work window."
Circuit A: inverted row under a bar in the rack · dips on the rack attachment · jumping switch lunges · hanging knee raises.
Circuit B: strict pull-ups · hand-release push-ups · air squats · sit-ups.
Format by week: w1–5 EMOM 16 min, 30 s work per minute · w6–10 EMOM 20 min · w11–12 every 90 s for 16 sets, 45 s work · w13 the tests (2-minute push-ups, 2-minute sit-ups, max strict pull-ups, 5 min rest between).

**Day 2 E — Mixed modal at moderate pace.** "Keep consistent times across all rounds." Rounds: w1–7: 5 · w8–10: 6 · w11: 8 with 20 lb in the ruck · w12: 7 with ruck · w13: none. Eight workouts rotate w1–w12 (w1 = MM1, w2 = MM2, …, w9 = MM1 again). Every item below is feasible with the default equipment.
- MM1: 30 s air bike · 15 thrusters @75–95 lb · 10 lateral burpees over bar · 400 m run
- MM2: 15 DB swings @50–70 lb · 4 towel pull-ups [option: 2 rope climbs] · 10×50 ft burpee shuttle
- MM3: 10 pull-ups · 15 step-overs on bench · 200 ft bear crawl · 400 m run
- MM4: 200 m run · 15 sandbag ground-to-shoulder [option: med-ball slams if slam-safe ball] · 10 burpee + jump over bar · 5 power cleans @135–155 lb · 250 m row
- MM5: 15 DB swings · 15 cal row · 15 lateral burpees over rower · 200 ft farmer carry @75 lb/hand
- MM6: 20 deadlifts @45–55% of max · 20 cal bike · 20 V-ups · 90 s air bike easy [option: 200 single-unders if rope]
- MM7: 250 m row · 20 lateral bar hops · 15 thrusters @75–95 · 10 burpee step-ups to bench
- MM8: 200 m run · 12 alternating DB power snatch @40–60 lb · 10 no-jump burpees · 60 s walk

**Day 2 F (w1–4 only)** — 10 min easy: alternate 1 min row or bike / 1 min step-ups.

**Day 3 A — Run intervals.** "Moderate" = 5k pace + 60–75 s/km, "fast" = 5k pace, "easy" = 5k pace + 90–120 s/km. Before the first 5k test the app says "comfortable but challenging."
| w | Format |
|---|---|
| 1 | R1: 10×(1:00 moderate / 1:00 fast / 1:00 walk) |
| 2 | R2: 3×(2:00 build / 1:00 walk) + 2×(3:00 at fastest 2:00 pace / 1:00 walk) + 4:00 / 2:00 walk |
| 3 | R5: 6-5-4-3-2-1 min runs, pace rising each, 1:00 walk between |
| 4 | 5k time trial |
| 5 | R3: 3 rounds of 45 s / 60 s / 75 s / 90 s ladders across row, run (shuttle), bike, 30 s walk between rungs, 3:00 walk between rounds |
| 6 | R4: 20 min moderate run → 20 min ruck → 20 min easy run (replaces B this week) |
| 7 | R6: 4×1:00 easy + 3×2:00 build + 2×3:00 + 1×4:00 + 4×1:00 easy, 1:00 walks |
| 8 | R1 |
| 9 | 5k time trial |
| 10 | R2 |
| 11 | R3 |
| 12 | R4 (ruck portion 30 min) |
| 13 | 1.5-mile run test, then 20 min easy |

**Day 3 B — Ruck march.** 30 min except w9 (45 min). Load by cycle (4.7); load the ruck with the sandbag or plates. Formats rotate: comfortable continuous · 1 min fast / 2 min comfortable · 2 min fast / 1 min comfortable · "pick a target distance that will be hard to reach, 15 min out and 15 min back." Omitted in weeks where A is R4 and in w13.

**Day 3 C — Crawls, drags, odd objects.** Rotate: backward sled drag 3×150 ft moderate load + supine sprint starts 3×6 · ruck burpees 5×8 + ruck bear crawl 5×(1:00 on / 1:00 off) · goblet Cossack squat 3×12 + backwards running 3×200 m + 20 min burden carry with sandbag · EMOM 10: 30 s ruck bear-hug walking lunge / 30 s inchworm · single-leg DB RDL 3×6/leg + lateral bench step-over 3×12 · forward sled push 4×100 ft + bear crawl 4×100 ft. w13: bird dog 4×5/side + dead bug 4×10.

**Day 4 A — Zone 2.** Air bike, rower, or easy run, user's choice each week. Target shown as a heart-rate range, 65–75% of max HR, where max HR comes from Settings (entered directly, or 220 − age as the default); the talk test ("conversational, nasal breathing possible") is shown alongside for anyone without a monitor. The same range is used for Day 7 and the optional PM sessions. Duration: 40 min in w1 rising 2 min per week to 60 min by w11, 30 min in w13; each cycle starts 5 min longer than the last (capped at 60).

**Day 4 B — Pull strength.** Alternate weekly: (a) weighted pull-ups 5×3–5, load added with DB between feet or ruck, rest 2–3 min, then DB row 4×10/arm; (b) pull-up ladder 1-2-3-4-5… for 10 min, then barbell row 4×8. Option for anyone without 5 strict pull-ups: inverted rows and eccentric pull-ups.

**Day 4 C — Press + arms.** Whichever press Day 2 is not laddering this phase (overhead press when the ladder is bench, bench when the ladder is overhead; week 13 light 3×8) 4×6, rest 2 min, then EZ-bar curl 3×10–12 · EZ-bar skull crusher or dips 3×10–12 · DB rear-delt fly 3×15. Rest 60–90 s on the arm work. Target: beat last week's reps or load. (Added 2026-10-16 so both presses appear every week; the 2019 program pressed one lift per phase.)

**Day 4 D — Mobility.** 10 min: hips, thoracic spine, ankles. Builder chooses the exact flow.

**Day 5 A — Clean.** Hang power clean in cycles 1 and 3, power clean from the floor in cycles 2 and 4. Option: DB hang power clean for anyone not comfortable under a barbell.
| w | Prescription |
|---|---|
| 1 | Work up to a heavy single for today, technique first |
| 2 | 6×3 @90% of w1 single, rest 3 min |
| 3 | 5×3 @ last week's triple + 5 lb |
| 4 | 5×3 @ +5 lb |
| 5 | 5×3 @ +5 lb |
| 6 | Work up to a heavy single |
| 7 | EMOM 10 min: 3 reps @60% of w6 single |
| 8 | EMOM 10: 3 reps @ last week + 5 lb |
| 9 | EMOM 10: +5 lb |
| 10 | EMOM 10: +5 lb |
| 11 | Every 90 s × 10: 3 reps @ +5 lb |
| 12 | Work up to a heavy single (max) |
| 13 | 3×3 @60% |

**Day 5 B — Front squat.** Same scheme as back squat, except the Phase B top sets run 6 / 4 / 5 / 2 / 3 / max (w7–w12) so the heaviest front squat day and the heaviest back squat day never fall in the same week. (This matches what BHL actually did.)

**Day 5 C — Intervals.** Phase A: 6 sets of 4 stations × (45 s work / 45 s walk). Phase B: 4 rounds of 4 stations × (60 s / 60 s). w13: a machine test replaces the intervals: the machine that was not tested in week 12 (so both machines carry a current baseline into the next cycle, whichever one the user favors on Mondays). "High effort: almost as fast as possible, keep a little in the tank." Each week picks one station from each category; six preset combinations rotate.
- Jump/gymnastic: no-jump burpees · step-down bench jumps · lateral jumps over bar · towel pull-ups · burpee to target
- Machine: rower · air bike · shuttle run 50 ft · double-unders or fast single-unders [rope]
- Loaded ballistic: DB swings @50–70 · DB hang power clean · power clean and push press @75 lb · sandbag clean · med-ball slam [slam-safe ball]
- Crawl/push: sled push · bear crawl · mountain climbers · backward sled drag

**Day 6 odd weeks — Low-percentage aerobic circuits.** "Easy pace: continuous movement, conversation possible, no rest needed." Three 20-minute circuits, then a 10-minute core EMOM (45 s plank variations / 45 s flutter kicks, or crab hip swivel / plank shift). Three presets rotate; each circuit mixes a machine or run piece, a carry, and a crawl or bodyweight piece from: 20 cal row or bike · 400 m run or 2 min shuttle · 100 ft farmer carry @75 lb/hand · 100 ft sandbag bear-hug carry · 100 ft DB front-rack carry · 100 ft cross carry (one DB overhead, one at side) · 100 ft bear crawl · 100 ft backward sled drag · 30 alternating step-ups to bench · 10 DB burpee step-ups · 10 alternating DB Turkish get-ups · 20 DB swings · 60 s inchworm · 1 min plank.

**Day 6 even weeks — Long run (w2, w6, w10) or long ruck (w4, w8, w12).** Easy conversational pace. Duration per cycle in 4.7. Run on roads or trail; ruck at the cycle's load.

**Day 6 w13 — Ruck test.** Timed ruck at 45 lb: 3 miles in cycles 1–2, 4 miles in cycles 3–4.

**Day 7 (advanced only) — Long zone 2.** 60–120 min on whichever modality Day 6 did not use (bike if Day 6 was a run or ruck; run or ruck if Day 6 was circuits). Duration tracks the Day 6 long-session duration for that cycle.

**Optional second sessions (advanced only).** 30–45 min zone 2 on the air bike (or easy row or run) on Days 1, 2, 3, and 5. Shown as a collapsed "Optional PM" card, never counted toward completing the day.

### 4.5 Progression rules (the engine)

| Rule | Applies to | Logged input | Next target | With no history |
|---|---|---|---|---|
| Ladder start | Deadlift, press ladders | weight per set | First set = weight logged for the same rep count in the most recent prior week of this phase. Later sets: "+5 to 10 lb." | "Work up. Record each set." |
| Tempo progression | Phase A squats | weight per set | Top set = last week's top set × 1.04, rounded to 5 lb (reps fall by one, so load rises). | "Challenging; tempo and range of motion are the priority." |
| e1RM | Squats, deadlift, press | tested 1RM (w12), heavy single (w6), Phase B top sets | e1RM is a running estimate, always the **most recent** evidence: a tested 1RM counts at face value; a w6 tempo single counts as × 1.08; each logged Phase B top set updates it by Epley (weight × (1 + reps/30)) but only upward within a phase. Evidence older than 6 weeks by wall-clock, or from a previous run (see 5.3), is ignored. | Wave targets are shown only when an e1RM exists; otherwise "work to RPE 8–9." |
| Wave top set | Phase B squats | — | e1RM × {6: 0.80, 5: 0.83, 4: 0.86, 3: 0.89, 2: 0.92, 1: 1.02}, rounded to 5 lb, shown as "≈ X lb, RPE 8–9." | Shown only when e1RM exists; otherwise "work to RPE 8–9." |
| Percent sets | w13 lifts | — | % of e1RM, rounded to 5 lb. | — |
| Peak-weight repeat | Single-leg second week | weights per set | All sets at max weight logged in the first week. | — |
| Plus-five | Clean w3–5, w8–11 | weight | Last week's working weight + 5 lb. | — |
| Percent of single | Clean w2, w7, w13 | heavy single | 90% / 60% / 60% of the referenced single, rounded to 5 lb. | — |
| Row pace | Rower intervals | 2k time (mm:ss) | split = time/4; targets split, split−2, split+2 as prescribed. | "Comfortable but challenging; hold it for all rounds." |
| Bike pace | Air bike intervals | 10-min calories | P = cal/10; interval target = P × multiplier × minutes, rounded to whole calories. | Same. |
| Run pace | Run intervals | 5k time | pace/km = time/5; moderate, fast, easy offsets as in 4.4. | Same. |
| Density | Bodyweight EMOM | total reps per station (optional) | "Beat N" where N is the last total on the same circuit and format. | — |
| Consistency | Mixed modal | round times (optional) | Show last time's average round; target "same or faster, no fade." | — |
| Beat last | Day 4 pull and arms | reps and load | Last session's numbers with "+1 rep or +5 lb." | — |

Rounding: lb to 5, kg to 2.5 (unit setting). Targets are advisory; the user always logs actuals and may log more or less.

**History scope.** Progression lookups (ladder start, tempo progression, peak-weight repeat, plus-five, density, beat-last) only look inside the current run (5.3). After "Start over at Day 1" the user begins clean, which is the right coaching call after a layoff. Test results (2k, 10-min bike, 5k, maxes) carry across runs when they are less than 6 weeks old by wall-clock; older results are displayed on the Scorecard but not used for targets, and the scheduled week-1 tests re-establish them.

### 4.6 Tests and the scorecard

| Test | When | Logged as |
|---|---|---|
| 2000 m row | w1 (first cycle), w7, w12 on Day 1 when the rower is chosen; otherwise w13 Day 5 | time |
| 10-minute air bike | w1 (first cycle), w7, w12 on Day 1 when the bike is chosen; otherwise w13 Day 5 | calories |
| 5k run | w4, w9 | time |
| 1.5-mile run | w13 Day 3 | time |
| 2-min push-ups, 2-min sit-ups, max strict pull-ups | w13 Day 2 | reps |
| Timed ruck @45 lb (3 mi cycles 1–2, 4 mi cycles 3–4) | w13 Day 6 | time |
| Back squat, front squat, deadlift, press, clean | w12 | weight |
| Max broad or box jump | w12 Day 1 | distance or height |

The Scorecard screen shows each test's result per cycle, the all-time best, and a reference table titled "Ready-for-anything benchmarks" (my proposal; motivational, not requirements): 2k row 8:00 / 7:30 / 7:00 · 5k 25 / 22 / 20 min · 1.5 mile 12:00 / 10:30 / 9:30 · push-ups 50 / 65 / 80 · sit-ups 50 / 65 / 80 · pull-ups 10 / 15 / 20 · 4-mile ruck @45 lb 70 / 60 / 55 min · back squat 1.5× / deadlift 2× / bench 1.25× / press 0.85× bodyweight. Three columns: solid, strong, elite.

### 4.7 What changes from cycle to cycle

| | Cycle 1 | Cycle 2 | Cycle 3 | Cycle 4 |
|---|---|---|---|---|
| Press, Phase A / B | Bench / Standing press | Standing press / Bench | Bench / Standing press | Standing press / Bench |
| Clean | Hang power clean | Power clean | Hang power clean | Power clean |
| Ruck load (Day 3, Day 6) | 35 lb | 45 lb | 50 lb | 55 lb |
| Long run (Day 6 w2/6/10) | 40 → 50 → 60 min | 60 → 70 → 75 | 75 → 85 → 90 | 90 → 105 → 120 |
| Long ruck (Day 6 w4/8/12) | 45 → 55 → 60 min | 60 → 70 → 75 | 75 → 85 → 90 | 90 → 105 → 120 |
| Day 4 zone 2 start | 40 min | 45 | 50 | 55 |
| Ruck test | 3 mi | 3 mi | 4 mi | 4 mi |

Everything else repeats, which is deliberate: the rhythm becomes automatic and progress is measured against the same template.

### 4.8 Day 365

A rest day whose screen shows the four-cycle scorecard, the year's PRs, and a short paragraph: "You have the base. Pick the thing: marathon, selection, academy test. Specialize for 8–12 weeks, then come back to Day 1."

## 5. The app

### 5.1 Medium and hosting (my call)

A single-page web app, mobile-first, vanilla JavaScript ES modules, no build step and no dependencies. Static files at the repository root: `index.html`, `styles.css`, a `js/` folder of small focused modules (calendar, program rules, target engine, store, UI views), `manifest.webmanifest` (so it installs to the home screen with a name and icon), `sw.js` (a service worker that caches the app so it opens with no signal), and `icons/`. The project becomes a git repository and is deployed to **GitHub Pages** from the `main` branch root, from Mike's GitHub account, which is already authenticated on this machine. Logic modules are unit-tested with Node's built-in test runner; the UI is verified in a browser. Mike opens the Pages URL on his phone and adds it to the home screen. A second person who opens the same link on their phone gets a clean Day 1 and their own log, with no account.

All state is in the browser's local storage on that phone (Mike's decision: one phone, no sign-in). The known risk (a cleared browser wipes the log) is covered by the backup feature in 5.6. The builder tests on both iPhone Safari and Android Chrome, since Mike's phone type was not specified.

A Claude-hosted preview may be published during development for quick looks, but it is not the home of the app.

### 5.2 Screens

**Today.** Header: "Day 43 · Cycle 1 · Week 7 · Squat + Intervals · ~100 min" with a thin year-progress bar. Below it, one card per block (A, B, C, …) in the **"one at a time" layout Mike chose from the mockup**: the current block is expanded and every other block collapses to a single line (letter, name, the key number such as "5 × 3", a chooser chip if any, done mark). Tapping a collapsed block expands it and collapses the previous one; marking a block done auto-expands the next. An expanded card shows: the block letter and movement name; an option chip when alternatives exist (tap to switch; the chosen option is remembered for that slot); the prescription in BHL's terse style; a target line computed from history ("Start set of 7 at 315 lb", "12×500 m @1:52", "1:30 → 21 cal"); input rows sized to the block (weight × reps per set, or time, distance, calories, reps); a one-line note field; a done toggle. A "Complete day" button at the bottom marks the day done and advances the current day. Rest days show a single card. Advanced-only cards (Day 7 session, Optional PM) appear only when the advanced toggle is on.

**Days.** The whole year as a scrollable list grouped by cycle and week, each row "Day 47 · Squat + Intervals · ✓". Tap to open any day. A "Set as current day" action on any day.

**Scorecard.** Tests by cycle, all-time bests, benchmarks table, and lift e1RMs.

**Settings.** Current day; units (lb/kg); base/advanced toggle; max heart rate (or age); equipment checklist (plyo box, jump rope, kettlebells, rings, climbing rope, hurdles, weight vest, slam ball) that filters options, with box and rope checked by default; nutrition card; backup (export) and restore (import); "Start over at Day 1" (opens a new run, keeps all history) and "Erase everything" (confirmed twice).

Navigation is a four-tab bar: Today · Days · Scorecard · Settings. Everything must be operable one-handed with sweaty thumbs: large tap targets, numeric keypads for inputs, no hover-only controls.

### 5.3 Data model

One JSON object in local storage under a versioned key.

```
{
  version: 1,
  settings: { currentDay, currentRun, units, advanced, equipment: {...}, bodyweight, lastExportAt },
  choices: { [slotKey]: optionId },           // remembered substitutions, shared across runs
  runs: [ { id, startedAt, endedAt } ],        // one entry per pass through the program
  logs: {
    [runId]: {
      [dayNumber]: {
        completedAt,
        blocks: { [blockKey]: { optionId, sets: [{w, r}], time, distance, cal, reps, notes, done } }
      }
    }
  },
  tests: { [testId]: [ { runId, day, at, value } ] }
}
```

A **run** is one pass through the program. "Start over at Day 1" closes the current run and opens a new one; nothing is overwritten. The Scorecard shows runs × cycles. `slotKey` identifies a recurring slot independent of day (e.g., `d2.A.deadlift`); `blockKey` identifies the block within a day. Every log and test carries a wall-clock timestamp so staleness rules can use real elapsed time rather than day numbers. The program itself is not stored; it is generated at runtime from the rules in section 4 by a pure function `session(dayNumber, settings) → blocks`, and targets by `targets(block, history)`. This keeps the file small and makes rule changes a one-place edit.

### 5.4 Target engine

Implements section 4.5. Inputs are the generated block, the full log, and the test table. It must handle: no history (first cycle, new user, or a skipped week), a missing test (fall back to "comfortable but challenging"), unit conversion, and a user who logs a different option than last time (history is per option; the engine looks up the chosen option's history and, if none, says so rather than borrowing another lift's numbers).

### 5.5 Options and the equipment profile

Every block that BHL wrote with unavailable equipment defines an ordered option list tagged with the equipment each needs. The default equipment profile is Mike's inventory; options whose equipment is unchecked are hidden. The first visible option is the default. A chosen option is stored in `choices` by slot and persists across weeks and cycles until changed.

### 5.6 Backup and restore

Export offers the entire JSON object three ways, because phones differ: the system share sheet (Web Share API, so it can go straight to iCloud Drive, Google Drive, Files, or a message to yourself), a file download named `bhl-backup-day<N>.json`, and "copy to clipboard." Whichever the phone supports first is shown first. Import accepts a file or pasted text, validates the version, and replaces the current state after a confirmation that names the day count it would overwrite. Settings shows the date of the last export and nags gently (a small banner on Today) when it is more than 14 days old.

### 5.7 Nutrition card

In Settings, labeled "Macros that paired with BHL (guideline, not medical advice)". Inputs: bodyweight and an optional goal weight (added 2026-10-16). The card computes from the goal weight when one is set, otherwise from bodyweight; the Scorecard's ×BW figures always use bodyweight. Output per day: protein 1.0 g per lb; fat 0.27 g per lb; calories 14 × weight; carbs = remaining calories ÷ 4. The 14 kcal/lb figure was calibrated on Mike at about 200 lb and overshoots at much higher bodyweights, which is why a cut eats for the goal weight. Shown next to Mike's original numbers as the worked example (2800 kcal, 180 g protein, 50–60 g fat, ~395 g carbs). A one-line note: recomp works at roughly maintenance with high protein and enough carbs to fuel this volume; adjust by 100–200 kcal every two weeks based on the mirror and the log.

### 5.8 Non-functional

- Works offline after first load; no network calls at runtime.
- Loads in under two seconds on a mid-range phone; file under 500 KB.
- Light and dark theme following the phone.
- Every write to storage wrapped in try/catch; the app renders fully with storage unavailable (it just cannot save, and says so).
- Text large enough to read from a phone on the floor beside a rower.

## 6. Decisions

**Mike's**
- Reproduce the BHL structure and progression logic; the 2019 cycle is the template.
- Goal is general "ready for anything" readiness, built for recomp, not event-specific.
- Numbered days including rest days; no dates; restartable; shareable with a second person.
- Six required training days plus an advanced layer (seventh day and/or optional zone 2 second sessions).
- Air bike included throughout.
- Options offered wherever his equipment differs from BHL's; the user chooses.
- Targets computed automatically from logged numbers; user enters actuals.
- One phone, no sign-in; log lives on the device.
- Sessions may run 90–120 minutes.
- Pounds. Has a heart-rate monitor. Buying a jump rope and a plyo box, but box and rope slots must still offer alternatives.
- Hosting left to me ("wherever is easiest").
- The Monday machine (rower or air bike) is the user's choice every time, never rotated by cycle.

**Mine (he can reject any of these)**
- GitHub Pages as the home of the app, installed to the home screen as an offline-capable web app; Claude-hosted preview only during development.
- Logs carry a run id so "Start over at Day 1" never overwrites history; progression lookups stay inside the current run; tests carry across runs for 6 weeks.
- e1RM is a running "most recent evidence" estimate rather than "tested 1RM wins for 26 weeks."
- Week-13 Day 5 machine test replaces that day's intervals; week-1 Day 1 in cycles 2–4 trains at the week-13 test pace instead of re-testing.
- Four 13-week cycles with Phase A / Phase B / deload-and-test week, derived from BHL's 14 weeks with its frozen weeks removed.
- Day 4 content (zone 2 + pulling + arms + mobility) and Day 7 as rest in the base program.
- Day 6 alternating easy circuits with long runs and long rucks that lengthen across the year.
- Cycle-to-cycle variation table (press order, clean variant, ruck loads, long-session durations).
- The field-test battery, its placement in week 13, and the benchmark table.
- Air bike interval multipliers; the e1RM estimation rules; rounding to 5 lb.
- Single HTML file, local storage, published as a Claude artifact; backup via file export.
- Including the nutrition card and its formulas.
- Optional PM sessions do not count toward completing a day.

## 7. Left to the builder

- Visual design, typography, color, iconography.
- Exact wording of coaching notes beyond those quoted from BHL.
- The six preset 45/45 combinations, the three Day 6 circuit presets, and the mobility flow.
- Rounding and formatting of paces, splits, and calories.
- Local-storage key naming, schema migration approach for future versions.
- How "Complete day" behaves if the user completes a day out of order (suggest: it marks that day done and leaves the current-day pointer alone unless the day equals the current day).
- Whether to show a tiny progress strip (days done / 365) on Today.

## 8. Open questions

None outstanding. The builder-check round (hosting, run dimension, e1RM precedence, test-schedule conflicts, equipment) was resolved on 2026-10-16 and folded into sections 3, 4.4, 4.5, 4.6, 5, and 6. Mike's phone type was not specified; the builder treats iPhone Safari and Android Chrome as equal targets.
