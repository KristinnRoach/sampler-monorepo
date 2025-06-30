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
  #allowedPeriods: number[] = [];

  setAllowedValues(
    values: number[],
    normalize: NormalizeOptions | false
  ): this {
    const finalValues = normalize ? normalizeRange(values, normalize) : values;
    this.#allowedValues = [...(finalValues as number[])].sort((a, b) => a - b);
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

    console.log(`setAllowedPeriods: `, { usingPeriods: this.#allowedPeriods });
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

  // todo: If I want zero-snapping for periods -> Just pre-compute the optimal values and store them as the allowedPeriods !!
  snapToMusicalPeriod(loopStart: number, targetLoopEnd: number): number {
    if (this.#allowedPeriods.length === 0) return targetLoopEnd;

    const targetDuration = targetLoopEnd - loopStart;

    // Find closest musical period to the target duration
    const closestPeriod = this.#allowedPeriods.reduce((prev, curr) =>
      Math.abs(curr - targetDuration) < Math.abs(prev - targetDuration)
        ? curr
        : prev
    );

    return loopStart + closestPeriod;
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
