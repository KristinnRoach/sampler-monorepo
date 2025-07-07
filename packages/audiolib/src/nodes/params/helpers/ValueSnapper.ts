import { createScale } from '@/utils/music-theory/utils/scale-utils';
import type { NormalizeOptions } from '@/nodes/params/param-types';
import { findClosest } from '@/utils';

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
  #allowedPeriods: number[] = [];

  setScale(
    rootNote: string,
    scalePattern: readonly number[] | number[],
    lowestOctave: number = 0,
    highestOctave: number = 8,
    normalize: NormalizeOptions | false,
    snapToZeroCrossings: number[] | false = false
  ) {
    // Create a copy of the pattern to ensure it's mutable
    const pattern = [...scalePattern];

    const scale = createScale(rootNote, pattern, lowestOctave, highestOctave);
    const periodsInSeconds = scale.periodsInSec.sort((a, b) => a - b);

    return this.setAllowedPeriods(
      periodsInSeconds,
      normalize,
      snapToZeroCrossings
    );
  }

  setAllowedValues(values: number[], normalize: NormalizeOptions | false) {
    const finalValues = normalize ? normalizeRange(values, normalize) : values;
    this.#allowedValues = [...(finalValues as number[])].sort((a, b) => a - b);

    // console.log('Allowed Values: ', values);
    return this.#allowedValues;
  }

  setAllowedPeriods(
    periods: number[],
    normalize: NormalizeOptions | false,
    snapToZeroCrossings: number[] | false = false
  ) {
    let values = normalize
      ? (normalizeRange([...periods], normalize) as number[])
      : periods;

    if (snapToZeroCrossings && snapToZeroCrossings.length) {
      // Pre-compute the optimal values and store them as the allowedPeriods

      // console.log('Zero Crossings: ', snapToZeroCrossings);
      // console.log('Before snapping: ', values);

      values = values.map((v) => {
        const tolerance = v < 0.01 ? v * 0.01 : v * 0.1; // 1% for periods < 10ms (~16 cents max), 10% for longer
        return this.snapToValue(v, snapToZeroCrossings, tolerance);
      });

      // console.log('After snapping: ', values);
    }

    this.#allowedPeriods = [...(values as number[])].sort((a, b) => a - b);

    return this.#allowedPeriods;
  }

  snapToValue(
    target: number,
    allowedValues = this.#allowedValues,
    tolerance?: number
  ): number {
    if (allowedValues.length === 0) return target;

    // No tolerance = simple closest value (for real time quick processing)
    if (tolerance === undefined) {
      return findClosest(allowedValues, target);
    }

    // Filter allowedValues by tolerance
    const validValues = allowedValues.filter(
      (value) => Math.abs(value - target) <= tolerance
    );

    if (validValues.length > 0) {
      // Normal case: snap to closest within tolerance
      return findClosest(validValues, target);
    }

    // Fallback: move partially toward closest zero crossing
    if (tolerance !== undefined) {
      const closest = findClosest(allowedValues, target);

      const direction = Math.sign(closest - target);
      return target + direction * tolerance;
    }

    return target;
  }

  snapToMusicalPeriod(
    targetPeriod: number,
    allowedPeriods = this.#allowedPeriods
  ): number {
    if (allowedPeriods.length === 0) return targetPeriod;

    // Find closest musical period to the target duration
    const quantized = findClosest(allowedPeriods, targetPeriod);

    return quantized;
  }

  get periods() {
    return this.#allowedPeriods;
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

// Replaced with map in setAllowedPeriods, delete if no issues
// values.forEach((v, idx) => {
//   const tolerance = v < 0.01 ? v * 0.01 : v * 0.1; // 1% for periods < 10ms (~16 cents max), 10% for longer
//   const snapped = this.snapToValue(v, snapToZeroCrossings, tolerance);
//   values[idx] = snapped;
// });
