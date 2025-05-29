import { createScale } from '@/utils/musical/utils/scale-utils';

// Value processor for snapping/quantization
export class ValueSnapper {
  #allowedValues: number[] = [];

  // TODO: If I want zero-snapping for periods
  // -> Just pre-compute the optimal values onLoad
  // and store them as the allowedPeriods !!
  #allowedPeriods: number[] = [];

  setAllowedValues(values: number[]): this {
    this.#allowedValues = [...values].sort((a, b) => a - b);
    return this;
  }

  setAllowedPeriods(periods: number[]): this {
    this.#allowedPeriods = [...periods].sort((a, b) => a - b);
    return this;
  }

  setScale(
    rootNote: string,
    scalePattern: readonly number[] | number[],
    lowestOctave: number = 0,
    highestOctave: number = 8
  ): this {
    // Create a copy of the pattern to ensure it's mutable
    const pattern = [...scalePattern];

    // Use the updated createScale function with octave range parameters
    const scale = createScale(rootNote, pattern, lowestOctave, highestOctave);
    this.#allowedPeriods = scale.periodsInSec.sort((a, b) => a - b);
    return this;
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

  //   const targetDistance = Math.abs(referenceValue - targetValue);
  //   const closestPeriod = this.#allowedPeriods.reduce((prev, curr) =>
  //     Math.abs(curr - targetDistance) < Math.abs(prev - targetDistance)
  //       ? curr
  //       : prev
  //   );

  //   return adjusting === 'loopEnd'
  //     ? referenceValue + closestPeriod
  //     : referenceValue - closestPeriod;
  // }

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
