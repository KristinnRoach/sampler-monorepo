export const mapToRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
