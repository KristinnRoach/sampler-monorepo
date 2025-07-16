// EnvelopeData.ts
import { assert } from '@/utils';
import { EnvelopePoint } from './env-types';

// ===== ENVELOPE DATA - Pure data operations =====
export class EnvelopeData {
  #valueRange: [number, number];
  #durationSeconds: number = 0;
  #hasSharpTransitions = false;

  #startPointIndex: number; // todo: try out using start and end points for somthn fun
  #sustainPointIndex: number | null = null;
  #releasePointIndex: number | null = null;
  #endPointIndex: number;

  constructor(
    public points: EnvelopePoint[] = [],
    valueRange: [number, number] = [0, 1],
    durationSeconds: number,
    sustainIdx?: number,
    releaseIdx?: number
  ) {
    assert(
      points.length >= 2,
      'EnvelopeData needs at least two points to initialize'
    );

    this.#durationSeconds = durationSeconds;
    this.#valueRange = valueRange;

    this.#startPointIndex = 0;
    this.#sustainPointIndex = sustainIdx ? sustainIdx : points.length - 2; // skip or customize based on env type?
    this.#releasePointIndex = releaseIdx ? releaseIdx : points.length - 2; // needs logic if able to init with fewer points
    this.#endPointIndex = points.length - 1;
  }

  addPoint(
    time: number,
    value: number,
    curve: 'linear' | 'exponential' = 'exponential'
  ) {
    const newPoint = { time, value, curve };

    // Prevent adding before first or after last point
    if (this.points.length >= 2) {
      const firstTime = this.points[this.startPointIndex].time;
      const lastTime = this.points[this.points.length - 1].time; // todo: use this.endPointIndex if useful

      if (time <= firstTime || time >= lastTime) {
        console.warn(
          `Cannot add point at time ${time}. Must be between ${firstTime} and ${lastTime}`
        );
        return;
      }
    }

    const insertIndex = this.points.findIndex((p) => p.time > time);

    if (insertIndex === -1) {
      this.points.push(newPoint);
    } else {
      this.points.splice(insertIndex, 0, newPoint);

      // Adjust sustain point index if insertion affects it
      if (
        this.#sustainPointIndex !== null &&
        insertIndex <= this.#sustainPointIndex
      ) {
        this.#sustainPointIndex++;
      }

      // Adjust release point index if insertion affects it
      if (
        this.#releasePointIndex !== null &&
        insertIndex <= this.#releasePointIndex
      ) {
        this.#releasePointIndex++;
      }
    }
    this.#updateSharpTransitionsFlag();
  }

  updatePoint(index: number, time?: number, value?: number) {
    if (index >= 0 && index < this.points.length) {
      const currentPoint = this.points[index];
      let newTime = time ?? currentPoint.time;

      // Guard from passing the first and last points
      if (index === 1 && newTime <= this.points[0].time) {
        console.warn('Second point cannot go before first point');
        return;
      }

      if (
        index === this.points.length - 2 &&
        newTime >= this.points[this.points.length - 1].time
      ) {
        console.warn('Second-to-last point cannot go after last point');
        return;
      }

      this.points[index] = {
        ...currentPoint,
        time: newTime,
        value: value ?? currentPoint.value,
      };
    }

    this.#updateSharpTransitionsFlag();
  }

  updateStartPoint = (time?: number, value?: number) => {
    this.updatePoint(0, time, value);
  };

  updateEndPoint = (time?: number, value?: number) => {
    this.updatePoint(this.points.length - 1, time, value);
  };

  deletePoint(index: number) {
    if (this.points.length > 2 && index > 0 && index < this.points.length - 1) {
      this.points.splice(index, 1);
    }
    this.#updateSharpTransitionsFlag();

    // ? necessary ? Update release point if it was at the default position
    if (this.#releasePointIndex === null) {
      this.#releasePointIndex = Math.max(0, this.points.length - 2);
    }
  }

  interpolateValueAtTime(timeSeconds: number): number {
    if (this.points.length === 0) return this.#valueRange[0];
    if (this.points.length === 1) {
      const [min, max] = this.#valueRange;
      return min + this.points[0].value * (max - min);
    }

    const sorted = [...this.points].sort((a, b) => a.time - b.time);

    let interpolatedValue = 0;

    // Clamp to bounds
    if (timeSeconds <= sorted[0].time) {
      interpolatedValue = sorted[0].value;
    } else if (timeSeconds >= sorted[sorted.length - 1].time) {
      interpolatedValue = sorted[sorted.length - 1].value;
    } else {
      // Find segment
      interpolatedValue = 0; // fallback
      for (let i = 0; i < sorted.length - 1; i++) {
        const left = sorted[i];
        const right = sorted[i + 1];

        if (timeSeconds >= left.time && timeSeconds <= right.time) {
          const segmentDuration = right.time - left.time;
          const t =
            segmentDuration === 0
              ? 0
              : (timeSeconds - left.time) / segmentDuration;

          if (
            left.curve === 'exponential' &&
            left.value > 0 &&
            right.value > 0
          ) {
            interpolatedValue =
              left.value * Math.pow(right.value / left.value, t);
          } else {
            interpolatedValue = left.value + (right.value - left.value) * t;
          }
          break;
        }
      }
    }

    // Scale value from 0-1 to target range (time remains absolute seconds)
    const [min, max] = this.#valueRange;
    const result = min + interpolatedValue * (max - min);

    return result;
  }

  #updateSharpTransitionsFlag() {
    const threshold = 0.02 * this.#durationSeconds;
    this.#hasSharpTransitions = this.points.some(
      (point, i) =>
        i > 0 && Math.abs(point.time - this.points[i - 1].time) < threshold
    );
  }

  getSVGPath(
    width: number = 400,
    height: number = 200,
    durationSeconds: number
  ): string {
    if (this.points.length < 2) return `M0,${height} L${width},${height}`;

    const sorted = [...this.points].sort((a, b) => a.time - b.time);
    let path = `M${(sorted[0].time / durationSeconds) * width},${(1 - sorted[0].value) * height}`;

    for (let i = 1; i < sorted.length; i++) {
      const point = sorted[i];
      const prevPoint = sorted[i - 1];
      const x = (point.time / durationSeconds) * width;
      const y = (1 - point.value) * height;

      if (prevPoint.curve === 'exponential') {
        const prevX = (prevPoint.time / durationSeconds) * width;
        const prevY = (1 - prevPoint.value) * height;
        const cp1X = prevX + (x - prevX) * 0.3;
        const cp1Y = prevY;
        const cp2X = prevX + (x - prevX) * 0.7;
        const cp2Y = y;
        path += ` C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${x},${y}`;
      } else {
        path += ` L${x},${y}`;
      }
    }

    return path;
  }

  setSustainPoint(index: number | null) {
    if (index === null || index === undefined) {
      this.#sustainPointIndex = null;
      return;
    }

    if (index >= 0 && index < this.points.length) {
      this.#sustainPointIndex = index;
    }
  }

  setReleasePoint(index: number) {
    if (index >= 0 && index < this.points.length) {
      this.#releasePointIndex = index;
    } else {
      console.error('EnvelopeData.setReleasePoint: invalid index');
    }
  }

  get startPointIndex() {
    return this.#startPointIndex;
  }

  get sustainPointIndex() {
    return this.#sustainPointIndex;
  }

  get releasePointIndex() {
    // Always return a valid index, defaulting to second-to-last
    if (
      this.#releasePointIndex === null ||
      this.#releasePointIndex >= this.points.length
    ) {
      return Math.max(0, this.points.length - 2);
    }
    return this.#releasePointIndex;
  }

  get endPointIndex() {
    return this.#endPointIndex;
  }

  get valueRange() {
    return this.#valueRange;
  }

  setValueRange = (range: [number, number]) => (this.#valueRange = range);

  get startTime() {
    return this.points[0]?.time ?? 0;
  }
  get endTime() {
    return this.points[this.points.length - 1]?.time ?? this.#durationSeconds;
  }

  get durationSeconds() {
    return this.endTime - this.startTime;
  }

  setDurationSeconds(seconds: number) {
    this.#durationSeconds = seconds;
  }

  get hasSharpTransitions() {
    return this.#hasSharpTransitions;
  }
}
