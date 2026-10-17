// Macro guideline that generalizes the diet Mike paired with BHL (spec §5.7). Guidance, not medical advice.

export const MIKE_EXAMPLE = { kcal: 2800, protein: 180, fat: '50–60', carbs: 395 };

export function macros(bodyweightLb) {
  if (!Number.isFinite(bodyweightLb) || bodyweightLb <= 0) return null;
  const kcal = Math.round(14 * bodyweightLb);
  const protein = Math.round(1.0 * bodyweightLb);
  const fat = Math.round(0.27 * bodyweightLb);
  const carbs = Math.round((kcal - 4 * protein - 9 * fat) / 4);
  return { kcal, protein, fat, carbs };
}

/** Eat for the body you are building: the goal weight when set, otherwise the current weight. */
export function macroPlan(s = {}) {
  const goal = Number.isFinite(s.goalWeight) && s.goalWeight > 0 ? s.goalWeight : null;
  const weight = goal ?? (Number.isFinite(s.bodyweight) && s.bodyweight > 0 ? s.bodyweight : null);
  if (!weight) return null;
  return { basis: goal ? 'goal' : 'current', weight, ...macros(weight) };
}
