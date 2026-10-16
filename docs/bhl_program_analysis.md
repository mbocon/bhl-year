# BHL "Cycle 1" (Mar 11 – Jul 13, 2019) — Program Reverse-Engineering

Source: 85 TrueCoach emails saved in Gmail label "BHL Workouts" (Week 2 Mon 3/18 → "Week 14" Sat 7/13).
Raw text: `data/bhl_workouts_raw.txt`. Cleaned per-day: `data/bhl_workouts_clean.md`.

## 1. What is and isn't missing

| Range | Sessions | Status |
|---|---|---|
| Week 1 (3/11–3/16) | 5 | Not saved. Reconstructed below from Week 2 references. |
| Weeks 2–4 (3/18–4/5) | 15 | Complete. Schedule Mon/Tue/Wed/Thu/Fri. |
| Weeks 5–14 (4/8–6/15) | 50 | Complete. Schedule moved to Mon/Tue/Wed/Fri/Sat (Thu off). |
| "Week 14" repeats (6/17–7/13) | 20 | Complete. Same week sent 4 more times with volume trimmed. |

17 weeks × 5 days = 85. Nothing inside 3/18–7/13 is absent. The "missing Thursday 4/11" is just the day shift, not a lost session.

## 2. The weekly template (never changed)

| Day | Label in email | Structure (A → B → C → D [→ E → F]) |
|---|---|---|
| Mon | Plyo, BS Temp, Cyclical-Interval, Core | Plyometric → Back Squat (tempo) → Rowing intervals at 2k pace → Core |
| Tue | DL/SL, UB, BW Str, Mixed Mod | Deadlift ladder → Single-leg → Upper push ladder → Bodyweight EMOM → Mixed-modal rounds at moderate pace → (Ph.1 only) 10 min easy flush |
| Wed | Cyc-Endurance | Running intervals → Ruck march → Crawls / drags / odd-object carries |
| Thu→Fri | PwrCn, FS Temp, 45/45, Core | Hang Power Clean → Front Squat (tempo) → 6 sets of 4×(45s work/45s walk) → Core |
| Fri→Sat | Low % MAP, Endurance EMOM, Low % MAP | Easy continuous circuits ("conversation possible") → 30-min loaded-carry EMOM → easy circuits; later 3×20 min easy circuits + core EMOM |

Order inside a day is always: speed/power → heavy strength → conditioning → core. Conditioning intensity is either clearly hard (Mon rows, Fri 45/45) or clearly easy (Sat). The only "moderate" piece (Tue E) is pace-controlled ("keep consistent times across all rounds"), not for time.

## 3. Phase structure

### Phase 1 — Weeks 1–6: tempo accumulation → heavy single
Slow tempos (42X1 squats, 21X1 bench, 10X1 deadlift), strict double-overhand grip (no straps/hook) as a self-limiter, volume constant, reps drop one per week.

| Element | W1 (inferred) | W2 | W3 | W4 | W5 | W6 |
|---|---|---|---|---|---|---|
| Back Squat @42X1 | 4×6 | 4×5 | 5×4 | 5×3 | 5×2 | 5×1 heavy |
| Front Squat @42X1 | 4×6 | 4×5 | 5×4 | 5×3 | 5×2 | 5×1 heavy |
| Deadlift (DOH) @10X1 | 8/7/6 | 7/6/5 | 6/5/4 | 5/4/3 | 4/3/2 | 3/2/1/1 |
| Bench @21X1 | 8/7/6 | 7/6/5 | 6/5/4 | 5/4/3 | 4/3/2 | 3/2/1/1 |
| Hang Power Clean | work to max | 6×3 @90% | 5×3 +5 lb | 5×3 +5 lb | 5×3 +5 lb | heavy single |
| Mon Row (12 rounds) | 400 m @2k / 90 s | 500 m @2k / 2 min | 600 m @2k / 2 min | 400 m @2k−2 s / 90 s | 500 m @2k−2 s / 2 min | 600 m @2k−2 s / 2 min |
| Tue BW EMOM | 16 min (B) | 16 min (A) | 16 min (B) | 16 min (A) | 16 min (B) | 20 min (A) |
| Tue Mixed modal | 5 rds + easy | 5 rds + 10 min easy | 5 rds + 8 min easy | 4 rds + burpee EMOM | 5 rds | 5 rds |

Ladder rule: "begin set of N at weight achieved for N in previous week" → forced weekly progression without ever naming a 1RM.

### Phase 2 — Weeks 7–12: intensification waves → true maxes
Tempo speeds up (20X1), hook grip allowed "if needed to go heavier", bench swaps to standing press, everything undulates toward a 1RM in Week 12.

| Element | W7 | W8 | W9 | W10 | W11 | W12 |
|---|---|---|---|---|---|---|
| Back Squat @20X1 (top set) | 6 | 4 | 2 | 5 | 3 | **1RM** |
| Front Squat @20X1 (top set) | 6 | 4 | 5 | 2 | 3 | **max single** |
| Deadlift @10X1 | 8/7/6 | 7/6/5 | 5/4/3 | 6/5/4 | 4/3/2 | **3/2/1/1 (hook/straps)** |
| Standing Press @10X1 | 8/7/6 | 7/6/5 | 5/4/3 | 6/5/4 | 4/3/2 | **3/2/1/1 max** |
| Hang Power Clean | EMOM 10×3 @60% W6 | +5–10 lb | +5 lb | +5 lb | E90s 10×3 +5 lb | **heavy single** |
| Mon Row | 3×(300@2k+100 sprint) → **2k TT** | 12×400 @2k / 90 s | 12×500 @2k / 90 s | 12×600 @2k / 2 min | 3×1200 @2k+2 / 2k / 2k−2 | **2k TT retest** |
| Tue BW | 20 min EMOM | 20 min | 20 min | 20 min | E90s ×16 (45/45) | E90s ×16 |
| Tue Mixed modal | 5 rds | 6 rds | 6 rds | 6 rds | 8 rds + 20 lb vest | 7 rds + vest |

Squat top-set RPE is explicit: "8 or 9 out of 10, no misses" until the max week.

### Phase 3 — Weeks 13–14: percentages off the new maxes + contrast
| Element | W13 | W14 |
|---|---|---|
| Back / Front Squat @20X1 | 3×6 @73–78% | 4×5 @76–81% |
| Deadlift (drop & reset each rep) | 5×6 @80% | 5×4 @85% |
| superset A2: Drop jump → vertical jump onto box | 5×5 | 5×5 (start at last week's max height) |
| DB Z-Press @20X1 | 4×8 | 4×8–10 |
| Power Clean (from floor) | 5×3 @60% of W12 HPC max | +5 lb |
| Mon Row "increasing effort" | 5/4/3 rds × 600 m @2k+4 / 2k / 2k−4 | same × 750 m |
| Fri intervals | 4 rds × 4×(60 s / 60 s) | same |
| Tue mixed modal | 8 rds | 30 min continuous + vest |

### Weeks 15–18 (6/17–7/13): one week repeated four times
Squats 3×5 @76–81%, DL 3×4 @85%, plyo 3×4, lunges 3×6, Z-press 3×8–10, BW E90s ×12, no mixed modal, rows 3/2/1 rds, run 6–8 rds. Every element was cut 25–40% from Week 14 and then frozen (label stuck on "Week 14", clean note still says "add 5 lbs to week 13"). Reads as a deliberately built maintenance/deload week that was then left running. Confirm with Mike what happened mid-June.

## 4. Movement rotations (the "variety" layer)

- **Mon plyo** (5×3, rest 90 s–3 min): drop jump→VJ, seated hurdle jump, kneeling jump→VJ, standing rebounding hurdles, max box jump. Same 5 repeat in W8–W12. Phase 3: drop jump + hurdles, lateral single-leg hop-overs.
- **Tue single-leg** (3×8/leg or 4×10 alt): each variant appears twice — first week "increase each set", second week "all sets at peak weight". Sequence: back-rack reverse lunge → double-KB front-rack step-up → RFE split squat → front-rack reverse lunge → (Ph.2) back walking lunge → RFE → KB step-up → front-rack walking lunge → (Ph.3) back reverse lunge.
- **Tue BW EMOM**: two fixed circuits alternate weekly. A = ring rows, dips, jumping switch lunges, hanging knee raises. B = strict pull-ups, hand-release push-ups, air squats, sit-ups.
- **Wed run formats** (rotate, ~6 of them): 10×(1 mod/1 fast/1 walk); 3×2 min + 2×3 min + 4 min build; 5k TT; 45/60/75/90 s row-run-bike ladder; 20/20/20 run-ruck-run; 6-5-4-3-2-1 min descending.
- **Wed ruck**: 30 min @50 lb comfortable → 30 min @80 lb 1 fast/2 easy → 20 min @80 lb inside run-ruck-run → 30 min @80 lb 2 fast/1 easy → 50 lb fast target-distance → 45 min @80 lb → 30 min @80 lb. Footwear note "job specific – combat boots".
- **Fri 45/45**: always one jump/gymnastic (box jump, burpee, rope climb), one machine (row, bike, shuttle, skipping), one loaded ballistic (KB swing, ball slam, DB hang clean, PC&PJ @75), one crawl/push (sled, bear crawl, mountain climbers).
- **Sat Low % MAP**: loaded carries dominate (farmer, front-rack, cross-carry, bear-hug 100 lb, pinch-grip), with crawls, drags, Turkish get-ups, step-ups, single-unders. Core EMOM added from W9.
- **Core** (Mon D / Fri D): evil wheels, med-ball lateral throws, TGU, side-plank series, pike holds, L-hang, hollow holds, landmine twists, Russian twists, front-leaning rest, floor wipers, bar hanging around-the-world.

## 5. Why it was programmed this way (principles to carry forward)

1. **Concurrent training with intensity discipline.** Hard is hard (2k pace, 45/45 "almost as fast as possible"), easy is easy ("conversation possible"). Avoids the grey zone that stalls both strength and aerobic gains.
2. **Tempo as a teaching and auto-regulation tool.** 42X1 squats make it impossible to go too heavy early; speed-up to 20X1 unlocks load once positions are owned.
3. **Ladders that start where last week ended.** Progression is built into the prescription; no percentages needed until maxes exist.
4. **Self-limiters removed over time.** Double-overhand-only → hook if needed → hook/straps for the max. Bench → standing press (more demanding) → Z-press (more core demand).
5. **Undulating waves in the heavy block.** 6-4-2 then 5-3-1 top sets lets each wave start heavier than the last.
6. **Tests anchor every block.** HPC max (W1, W6, W12), 5k run (W4, W9), 2k row (W7, W12), squat/DL/press maxes (W12). Each result sets the paces/percentages for the next block.
7. **Contrast/complex training once a base exists.** Heavy DL @80–85% paired with drop jumps only in Phase 3.
8. **Short repeating rotations** (5–6 weeks) for plyo, single-leg, and run formats: enough repeat exposure to progress, enough change to stay engaged.
9. **Density progression for bodyweight work.** 16 → 20 min EMOM → 45 s on/45 s off → fewer sets in deload.
10. **Tactical specificity.** Rucking 50–80 lb, body armor/vest rounds, bear crawls and drags, burden carries, burpees, rope climbs, L-hangs. This is a selection-prep style program.
11. **Volume is high.** ~5 sessions, each 75–120 min; roughly 3.5–4.5 h/week of conditioning on top of 3 strength exposures. The ~400 g carbs/day diet is what made that recoverable.

## 6. Diet as recalled

2800 kcal, 50–60 g fat, 180 g protein, carbs = remainder.
180 g protein = 720 kcal; 55 g fat = 495 kcal; remainder 1585 kcal ≈ 395 g carbs.

## 7. Open questions for Mike

- What was BHL, and what were you training for in 2019? (The program reads tactical/selection prep.)
- What happened mid-June? Travel, coaching ended, or a planned maintenance block?
- Which results were "noticeable" — strength numbers, body composition, conditioning, all three?
- What were the maxes/paces at the time (2k row, 5k run, squat, DL, press, HPC) if you still have them?
- What equipment and time per session do you have now?
- Any injuries/limitations now (the Mar 27 note mentions right trap aching)?
