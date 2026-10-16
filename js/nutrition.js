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
