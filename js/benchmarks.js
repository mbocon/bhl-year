// "Ready-for-anything" reference standards (spec §4.6). Motivational, not requirements.
// unit: 'time' (seconds), 'reps', 'xBW' (bodyweight multiple; single threshold in `solid`).
const m = min => min * 60;
export const BENCHMARKS = [
  { test: 'row2k', label: '2k row', unit: 'time', solid: 480, strong: 450, elite: 420, lowerIsBetter: true },
  { test: 'bike10', label: '10-min air bike', unit: 'cal', solid: null, strong: null, elite: null, lowerIsBetter: false },
  { test: 'run5k', label: '5k run', unit: 'time', solid: m(25), strong: m(22), elite: m(20), lowerIsBetter: true },
  { test: 'run1_5mi', label: '1.5-mile run', unit: 'time', solid: m(12), strong: 630, elite: 570, lowerIsBetter: true },
  { test: 'pushups2', label: '2-min push-ups', unit: 'reps', solid: 50, strong: 65, elite: 80, lowerIsBetter: false },
  { test: 'situps2', label: '2-min sit-ups', unit: 'reps', solid: 50, strong: 65, elite: 80, lowerIsBetter: false },
  { test: 'pullupsMax', label: 'Max strict pull-ups', unit: 'reps', solid: 10, strong: 15, elite: 20, lowerIsBetter: false },
  { test: 'ruck3mi', label: '3-mile ruck @ 45 lb', unit: 'time', solid: m(52), strong: m(45), elite: m(41), lowerIsBetter: true },
  { test: 'ruck4mi', label: '4-mile ruck @ 45 lb', unit: 'time', solid: m(70), strong: m(60), elite: m(55), lowerIsBetter: true },
  { test: 'jumpMax', label: 'Max jump', unit: 'height', solid: null, strong: null, elite: null, lowerIsBetter: false },
  { test: 'max_backsquat', label: 'Back squat', unit: 'xBW', solid: 1.5, strong: null, elite: null, lowerIsBetter: false },
  { test: 'max_frontsquat', label: 'Front squat', unit: 'xBW', solid: 1.25, strong: null, elite: null, lowerIsBetter: false },
  { test: 'max_deadlift', label: 'Deadlift', unit: 'xBW', solid: 2, strong: null, elite: null, lowerIsBetter: false },
  { test: 'max_bench', label: 'Bench press', unit: 'xBW', solid: 1.25, strong: null, elite: null, lowerIsBetter: false },
  { test: 'max_ohp', label: 'Standing press', unit: 'xBW', solid: 0.85, strong: null, elite: null, lowerIsBetter: false },
  { test: 'max_clean', label: 'Clean', unit: 'xBW', solid: 1, strong: null, elite: null, lowerIsBetter: false },
];
