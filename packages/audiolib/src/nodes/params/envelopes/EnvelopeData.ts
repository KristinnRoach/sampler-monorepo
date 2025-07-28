// EnvelopeData.ts
import { assert } from '@/utils';
import { EnvelopePoint, EnvelopeScaling } from './env-types';

// ===== ENVELOPE DATA - Pure data operations =====
export class EnvelopeData {
  #valueRange: [number, number];
  #durationSeconds: number = 0;
  #hasSharpTransitions = false;

  #startIdx: number;
  #sustainIdx: number | null = null;
  #releaseIdx: number;
  #endIdx: number;

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

    this.#startIdx = 0;
    this.#endIdx = points.length - 1;

    this.#sustainIdx =
      sustainIdx && points[sustainIdx] ? sustainIdx : this.#endIdx - 1;

    this.#releaseIdx =
      releaseIdx && points[releaseIdx]
        ? releaseIdx
        : Math.max(0, this.#endIdx - 1);
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
      const lastTime = this.points[this.#endIdx].time;

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
      this.#endIdx = this.points.length - 1;
    } else {
      this.points.splice(insertIndex, 0, newPoint);
      this.#endIdx = this.points.length - 1;

      // Adjust sustain point index if insertion affects it
      if (this.#sustainIdx !== null && insertIndex <= this.#sustainIdx) {
        this.#sustainIdx++;
      }

      // Adjust release point index if insertion affects it
      if (this.#releaseIdx !== null && insertIndex <= this.#releaseIdx) {
        this.#releaseIdx++;
      }
    }
    this.#updateSharpTransitionsFlag();
  }

  updatePoint(index: number, time?: number, value?: number) {
    if (index >= 0 && index < this.points.length) {
      const currentPoint = this.points[index];
      let newTime = time ?? currentPoint.time;

      // Guard from passing the first and last points
      if (index === 1 && newTime <= this.points[this.#startIdx].time) {
        console.warn('Second point cannot go before first point');
        return;
      }

      if (
        index === this.#endIdx - 1 &&
        newTime >= this.points[this.#endIdx].time
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
    this.updatePoint(this.#startIdx, time, value);
  };

  updateEndPoint = (time?: number, value?: number) => {
    this.updatePoint(this.#endIdx, time, value);
  };

  deletePoint(index: number) {
    if (
      this.points.length > 2 &&
      index > this.#startIdx &&
      index < this.#endIdx
    ) {
      this.points.splice(index, 1);
      this.#endIdx = this.points.length - 1;
    }

    // Adjust release point index if affected by deletion
    if (this.#releaseIdx !== null) {
      if (index < this.#releaseIdx) {
        // Point deleted before release point - shift index down
        this.#releaseIdx--;
      } else if (index === this.#releaseIdx) {
        this.#releaseIdx =
          this.#endIdx > this.#releaseIdx + 1
            ? this.#releaseIdx + 1
            : Math.max(0, this.#endIdx - 1);
      }
      // If index > releasePointIndex, no adjustment needed
    }

    this.#updateSharpTransitionsFlag();
  }

  interpolateValueAtTime(timeSeconds: number): number {
    if (this.points.length === 0) return this.#valueRange[0];
    if (this.points.length === 1) return this.points[0].value;

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

    return interpolatedValue;
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
    durationSeconds: number,
    scaling: EnvelopeScaling = 'none'
  ): string {
    if (this.points.length < 2) return `M0,${height} L${width},${height}`;

    const sorted = [...this.points].sort((a, b) => a.time - b.time);
    const [minVal, maxVal] = this.#valueRange;

    // Normalize values for SVG coordinates
    const normalizeValue = (val: number) => {
      if (scaling === 'logarithmic') {
        // Logarithmic scaling for display
        const logMin = Math.log2(Math.max(0.1, minVal));
        const logMax = Math.log2(maxVal);
        const logVal = Math.log2(Math.max(0.1, val));
        return Math.max(0, Math.min(1, (logVal - logMin) / (logMax - logMin)));
      } else {
        // Linear scaling for display
        return (val - minVal) / (maxVal - minVal);
      }
    };

    let path = `M${(sorted[0].time / durationSeconds) * width},${(1 - normalizeValue(sorted[0].value)) * height}`;

    for (let i = 1; i < sorted.length; i++) {
      const point = sorted[i];
      const prevPoint = sorted[i - 1];
      const x = (point.time / durationSeconds) * width;
      const y = (1 - normalizeValue(point.value)) * height;

      if (prevPoint.curve === 'exponential') {
        const prevX = (prevPoint.time / durationSeconds) * width;
        const prevY = (1 - normalizeValue(prevPoint.value)) * height;
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
      this.#sustainIdx = null;
      return;
    }

    if (index >= 0 && index < this.points.length) {
      this.#sustainIdx = index;
    }
  }

  setReleasePoint(index: number) {
    if (index >= 0 && index < this.points.length) {
      this.#releaseIdx = index;
    } else {
      console.error('EnvelopeData.setReleasePoint: invalid index');
    }
  }

  get startPointIndex() {
    return this.#startIdx;
  }

  get sustainPointIndex() {
    return this.#sustainIdx;
  }

  get releasePointIndex() {
    if (this.#releaseIdx >= this.points.length) {
      this.#releaseIdx = Math.max(0, this.points.length - 2);
    }
    return this.#releaseIdx;
  }

  get endPointIndex() {
    return this.#endIdx;
  }

  get valueRange() {
    return this.#valueRange;
  }

  setValueRange = (range: [number, number]) => (this.#valueRange = range);

  get startTime() {
    return this.points[this.#startIdx]?.time ?? 0;
  }
  get endTime() {
    return this.points[this.#endIdx]?.time ?? this.#durationSeconds;
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
