import { createScale } from '@/utils/musical/utils/scale-utils';

// Value processor for snapping/quantization
export class ValueSnapper {
  #allowedValues: number[] = [];
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

  snapToPeriod(
    target: number,
    constant: number,
    paramType: 'loopStart' | 'loopEnd'
  ): number {
    if (this.#allowedPeriods.length === 0) return target;

    const targetDistance = Math.abs(constant - target);
    const closestPeriod = this.#allowedPeriods.reduce((prev, curr) =>
      Math.abs(curr - targetDistance) < Math.abs(prev - targetDistance)
        ? curr
        : prev
    );

    return paramType === 'loopEnd'
      ? constant + closestPeriod
      : constant - closestPeriod;
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
