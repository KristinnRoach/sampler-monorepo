import { createScale } from '@/utils/musical/utils/scale-utils';
import type { NormalizeOptions } from '@/nodes/params/param-types';

const normalizeRange = (
  values: number | number[],
  options: NormalizeOptions
): number | number[] => {
  const { from, to } = options;
  const [fromMin, fromMax] = from;
  const [toMin, toMax] = to;

  const scale = (toMax - toMin) / (fromMax - fromMin);

  if (Array.isArray(values)) {
    return values.map((v) => {
      const clamped = Math.max(fromMin, Math.min(fromMax, v));
      // linear transformation
      return toMin + (clamped - fromMin) * scale;
    });
  } else {
    const clamped = Math.max(fromMin, Math.min(fromMax, values));
    return toMin + (clamped - fromMin) * scale;
  }
};

// Value processor for snapping/quantization
export class ValueSnapper {
  #allowedValues: number[] = [];

  // TODO: If I want zero-snapping for periods
  // -> Just pre-compute the optimal values onLoad
  // and store them as the allowedPeriods !!
  #allowedPeriods: number[] = [];

  setAllowedValues(
    values: number[],
    normalize: NormalizeOptions | false
  ): this {
    const finalValues = normalize ? normalizeRange(values, normalize) : values;

    this.#allowedValues = [...(finalValues as number[])].sort((a, b) => a - b);

    console.log('ValueSnapper.setAllowedValues called:', {
      originalValues: values.slice(0, 10), // Show first 10 to avoid spam
      originalValuesCount: values.length,
      normalize,
      finalValues: this.#allowedValues.slice(0, 10),
      finalValuesCount: this.#allowedValues.length,
      min: Math.min(...this.#allowedValues),
      max: Math.max(...this.#allowedValues),
    });
    return this;
  }

  setAllowedPeriods(
    periods: number[],
    normalize: NormalizeOptions | false
  ): this {
    const finalValues = normalize
      ? normalizeRange(periods, normalize)
      : periods;

    this.#allowedPeriods = [...(finalValues as number[])].sort((a, b) => a - b);

    console.log('ValueSnapper.setAllowedPeriods called:', {
      originalPeriods: periods.slice(0, 10),
      originalPeriodsCount: periods.length,
      normalize,
      finalPeriods: this.#allowedPeriods.slice(0, 10),
      finalPeriodsCount: this.#allowedPeriods.length,
      min: Math.min(...this.#allowedPeriods),
      max: Math.max(...this.#allowedPeriods),
      longestPeriod: this.longestPeriod,
    });

    return this;
  }

  setScale(
    rootNote: string,
    scalePattern: readonly number[] | number[],
    lowestOctave: number = 0,
    highestOctave: number = 8,
    normalize: NormalizeOptions | false
  ): this {
    // Create a copy of the pattern to ensure it's mutable
    const pattern = [...scalePattern];

    // Use the updated createScale function with octave range parameters
    const scale = createScale(rootNote, pattern, lowestOctave, highestOctave);
    const periodsInSeconds = scale.periodsInSec.sort((a, b) => a - b);

    return this.setAllowedPeriods(periodsInSeconds, normalize);
  }

  snapToValue(target: number): number {
    if (this.#allowedValues.length === 0) return target;

    return this.#allowedValues.reduce((prev, curr) =>
      Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
    );
  }

  // TODO: If I want zero-snapping for periods -> Just pre-compute the optimal values and store them as the allowedPeriods !!
  snapToPeriod(targetValue: number, referenceValue: number): number {
    if (this.#allowedPeriods.length === 0) return targetValue;

    const musicalPositions = this.#allowedPeriods
      .flatMap((period) => [
        referenceValue + period, // Forward positions
        referenceValue - period, // Backward positions
      ])
      .filter((pos) => pos >= 0); // Keep only valid positions

    // Find the closest musical position to target
    return musicalPositions.reduce((prev, curr) =>
      Math.abs(curr - targetValue) < Math.abs(prev - targetValue) ? curr : prev
    );
  }

  get shortestPeriod() {
    return this.#allowedPeriods[0];
  }

  get longestPeriod() {
    const lastIndex = this.#allowedPeriods.length - 1;
    return this.#allowedPeriods[lastIndex];
  }

  get hasValueSnapping(): boolean {
    return this.#allowedValues.length > 0;
  }

  get hasPeriodSnapping(): boolean {
    return this.#allowedPeriods.length > 0;
  }
}
