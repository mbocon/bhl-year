// The programs the app can run. Each keeps its own current day and log (see store.switchPath). No imports.

export const PATHS = [
  { id: 'bhl', name: 'BHL Year', lastDay: 365 },
  { id: 'bodyweight', name: 'Bodyweight', lastDay: Infinity },   // open-ended: no last day
];

/** The program in use; an unknown or missing id means BHL. */
export function pathOf(settings) {
  return PATHS.find(p => p.id === settings?.path) || PATHS[0];
}
export const lastDayOf = settings => pathOf(settings).lastDay;

/** The largest day number a person may type. An open-ended program still needs a bound, or a slip of the thumb
 *  (85000 for 85) makes the Days screen build tens of thousands of rows. Ten years, or a year past where they are. */
export const maxTypedDay = settings => Math.min(lastDayOf(settings), Math.max(3650, (settings?.currentDay || 1) + 365));
