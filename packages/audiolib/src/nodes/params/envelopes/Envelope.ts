// import { LibNode, NodeType } from '@/nodes/LibNode';
// import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
// import {
//   Message,
//   MessageHandler,
//   createMessageBus,
//   MessageBus,
// } from '@/events';

import { EnvelopePoint, EnvelopeType } from './env-types';

// ===== ENVELOPE DATA - Pure data operations =====
export class EnvelopeData {
  #valueRange: [number, number];
  #durationSeconds: number = 0;
  #logarithmic: boolean = false;
  #hasSharpTransitions = false;

  constructor(
    public points: EnvelopePoint[] = [],
    valueRange: [number, number] = [0, 1],
    durationSeconds: number,
    logarithmic = false
  ) {
    this.#durationSeconds = durationSeconds;
    this.#valueRange = valueRange;
    this.#logarithmic = logarithmic;
  }

  // Todo: default to linear when logarithmic !?
  addPoint(
    time: number,
    value: number,
    curve: 'linear' | 'exponential' = this.#logarithmic
      ? 'linear'
      : 'exponential'
  ) {
    const newPoint = { time, value, curve };

    // Prevent adding before first or after last point
    if (this.points.length >= 2) {
      const firstTime = this.points[0].time;
      const lastTime = this.points[this.points.length - 1].time;

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

  // updatePoint(index: number, time?: number, value?: number) {
  //   if (index >= 0 && index < this.points.length && time !== undefined) {
  //     // Don't allow first/last points to move past adjacent points
  //     if (index === 0 && this.points.length > 1) {
  //       if (time >= this.points[1].time) {
  //         console.warn('First point cannot move past second point');
  //         return;
  //       }
  //     } else if (index === this.points.length - 1 && this.points.length > 1) {
  //       if (time <= this.points[index - 1].time) {
  //         console.warn('Last point cannot move past previous point');
  //         return;
  //       }
  //     } else if (index > 0 && index < this.points.length - 1) {
  //       // Middle points can't cross their neighbors
  //       if (
  //         time <= this.points[index - 1].time ||
  //         time >= this.points[index + 1].time
  //       ) {
  //         console.warn('Point cannot cross neighboring points');
  //         return;
  //       }
  //     }
  //   }
  //   if (index >= 0 && index < this.points.length) {
  //     const currentPoint = this.points[index];
  //     this.points[index] = {
  //       ...currentPoint,
  //       time: time ?? currentPoint.time,
  //       value: value ?? currentPoint.value,
  //     };
  //   }

  //   this.#updateSharpTransitionsFlag();
  // }

  updateStartPoint = (time?: number, value?: number) => {
    this.updatePoint(0, time, value);
  };

  updateEndPoint = (time?: number, value?: number) => {
    this.updatePoint(this.points.length - 1, time, value);
  };

  deletePoint(index: number) {
    if (index > 0 && index < this.points.length - 1) {
      this.points.splice(index, 1);
    }
    this.#updateSharpTransitionsFlag();
  }

  debugCounter = 0;

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

// ===== CUSTOM ENVELOPE  =====
export class CustomEnvelope {
  #data: EnvelopeData;
  #context: AudioContext;
  envelopeType: EnvelopeType;
  #paramName: string;

  #isEnabled: boolean;
  #loopEnabled = false;
  #syncedToPlaybackRate = false;

  #timeScale = 1;
  #logarithmic = false;

  #stopLoopFn: (() => void) | null = null;

  constructor(
    context: AudioContext,
    envelopeType: EnvelopeType,
    initialPoints: EnvelopePoint[] = [],
    valueRange: [number, number] = [0, 1],
    durationSeconds = 1,
    logarithmic = false,
    initEnable = true
  ) {
    this.envelopeType = envelopeType;

    switch (envelopeType) {
      case 'amp-env':
        this.#paramName = 'envGain';
        break;
      case 'pitch-env':
        this.#paramName = 'playbackRate';
        break;
      case 'filter-env':
        this.#paramName = 'lpf';
        break;
      case 'loop-env':
        this.#paramName = 'loopEnd';
        console.warn('CustomEnvelope not implemnted for type: loop-env');
        break;
      default:
        console.error(
          `CustomEnvelope not implemented for type: ${envelopeType}`
        );
        this.#paramName = 'default';
        break;
    }

    this.#isEnabled = initEnable;

    this.#context = context;
    this.#logarithmic = logarithmic;

    this.#data = new EnvelopeData(
      [...initialPoints],
      valueRange,
      durationSeconds,
      logarithmic
    );
  }

  // Delegate data operations to EnvelopeData // ? redundant ?
  addPoint = (
    time: number,
    value: number,
    curve?: 'linear' | 'exponential'
  ): void => this.#data.addPoint(time, value, curve);

  deletePoint = (index: number): void => this.#data.deletePoint(index);

  updatePoint = (index: number, time?: number, value?: number) => {
    this.#data.updatePoint(index, time, value);
  };

  updateStartPoint = (time?: number, value?: number) =>
    this.#data.updateStartPoint(time, value);

  updateEndPoint = (time?: number, value?: number) =>
    this.#data.updateEndPoint(time, value);

  getSVGPath = (
    width: number | undefined,
    height: number | undefined,
    durationSeconds: number
  ): string => this.#data.getSVGPath(width, height, durationSeconds);

  setValueRange = (range: [number, number]): [number, number] =>
    this.#data.setValueRange(range);

  // Convenience ON/OFF methods
  enable = () => (this.#isEnabled = true);
  disable = () => (this.#isEnabled = false);

  // Property getters
  get data() {
    return this.#data;
  }

  get param() {
    return this.#paramName;
  }

  get isEnabled() {
    return this.#isEnabled;
  }

  get points() {
    return this.#data.points;
  }

  get fullDuration() {
    return this.#data.durationSeconds;
  }

  get timeScale() {
    return this.#timeScale;
  }

  get valueRange() {
    return this.#data.valueRange;
  }

  get loopEnabled() {
    return this.#loopEnabled;
  }

  get syncedToPlaybackRate() {
    return this.#syncedToPlaybackRate;
  }

  get numPoints(): number {
    return this.#data.points.length;
  }

  setSampleDuration(seconds: number) {
    this.#data.setDurationSeconds(seconds);
    return this;
  }

  // ===== AUDIO OPERATIONS =====
  applyToAudioParam(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue: number;
      playbackRate: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1, playbackRate: 1 }
  ) {
    this.stopLooping();

    const durationSeconds = this.#syncedToPlaybackRate
      ? this.#data.durationSeconds / options.playbackRate
      : this.#data.durationSeconds;

    if (this.#loopEnabled) {
      this.#startLoop(audioParam, startTime, options);
    } else {
      this.#applyEnvelope(audioParam, startTime, durationSeconds, options);
    }
  }

  applyReleaseToAudioParam(
    audioParam: AudioParam,
    startTime: number,
    duration: number,
    currentValue: number,
    targetValue = 0.001
  ) {
    this.stopLooping();
    this.#applyRelease(
      audioParam,
      startTime,
      duration,
      currentValue,
      targetValue
    );
  }

  #applyEnvelope(
    audioParam: AudioParam,
    startTime: number,
    duration: number = this.fullDuration,
    options: {
      baseValue: number;
      minValue?: number;
      maxValue?: number;
      playbackRate: number;
    } = { baseValue: 1, playbackRate: 1 }
  ) {
    // Scale the duration by the time scale
    const scaledDuration = duration / this.#timeScale;

    const sampleRate = this.#logarithmic
      ? scaledDuration < 1
        ? 1000
        : 750 // Higher rates for log curves
      : this.#data.hasSharpTransitions
        ? 1000
        : scaledDuration < 1
          ? 500
          : 250;

    const numSamples = Math.max(2, Math.floor(scaledDuration * sampleRate));
    const curve = new Float32Array(numSamples);

    const { baseValue: base, minValue: min, maxValue: max } = options;

    for (let i = 0; i < numSamples; i++) {
      const normalizedProgress = i / (numSamples - 1);
      const absoluteTime = normalizedProgress * duration; // sample the full duration (scale after)
      //     const currentDuration = this.#syncToPlaybackRate
      // ? this.#data.durationSeconds / options.playbackRate
      // : this.#data.durationSeconds;
      let value = this.#data.interpolateValueAtTime(
        absoluteTime * options.playbackRate
      );

      if (this.#logarithmic) {
        value = Math.pow(value, 2); // or just value * value if to aggressive
      }

      let finalValue = (base ?? 1) * value;

      if (min !== undefined) finalValue = Math.max(finalValue, min);
      if (max !== undefined) finalValue = Math.min(max, finalValue);

      curve[i] = finalValue;
    }

    const safeStart = Math.max(this.#context.currentTime, startTime);
    try {
      audioParam.cancelScheduledValues(safeStart);
      audioParam.setValueCurveAtTime(curve, safeStart, scaledDuration);
    } catch (error) {
      console.debug('Failed to apply envelope curve due to rapid fire.');
      try {
        const currentValue = audioParam.value;
        audioParam.cancelScheduledValues(safeStart);
        audioParam.setValueAtTime(currentValue, safeStart);
        audioParam.linearRampToValueAtTime(
          curve[curve.length - 1],
          safeStart + scaledDuration
        );
      } catch (fallbackError) {
        try {
          audioParam.setValueAtTime(curve[curve.length - 1], safeStart);
        } catch {
          // Silent fail
        }
      }
    }
  }

  #applyRelease(
    audioParam: AudioParam,
    startTime: number,
    duration: number,
    currentValue: number,
    targetValue = 0.001,
    curve: 'linear' | 'exponential' = 'exponential'
  ) {
    const safeStart = Math.max(this.#context.currentTime, startTime);
    audioParam.cancelScheduledValues(safeStart);
    audioParam.setValueAtTime(currentValue, safeStart);

    const scaledDuration = duration / this.#timeScale;

    try {
      if (curve === 'exponential' && currentValue > 0.001 && targetValue > 0) {
        audioParam.exponentialRampToValueAtTime(
          targetValue,
          safeStart + scaledDuration
        );
      } else {
        audioParam.linearRampToValueAtTime(
          targetValue,
          safeStart + scaledDuration
        );
      }
    } catch (error) {
      console.warn('Failed to apply release:', error);
      audioParam.linearRampToValueAtTime(
        targetValue,
        safeStart + scaledDuration
      );
    }
  }

  // ===== LOOP / TIME CONTROL =====

  setTimeScale = (timeScale: number) => {
    this.#timeScale = timeScale;
    // New timescale is applied on next loop iteration
    // for already looping envs
  };

  setLoopEnabled = (
    enabled: boolean,
    mode: 'normal' | 'ping-pong' | 'reverse' = 'normal'
  ) => {
    if (mode !== 'normal')
      console.info(
        `Only default env loop mode implemented. Other modes coming soon!`
      );

    this.#loopEnabled = enabled;
  };

  syncToPlaybackRate = (sync: boolean) => {
    this.#syncedToPlaybackRate = sync;
  };

  #startLoop(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue: number;
      playbackRate: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1, playbackRate: 1 }
  ): () => void {
    let isLooping = true;
    let currentCycleStart = startTime;
    let timeoutId: number | null = null;

    const scheduleNext = () => {
      if (!isLooping) return;

      const baseDuration = this.#syncedToPlaybackRate
        ? this.#data.durationSeconds / options.playbackRate
        : this.#data.durationSeconds;

      this.#applyEnvelope(
        audioParam,
        currentCycleStart,
        baseDuration, // gets time scaled in applyEnvelope
        options
      );

      const scaledDuration = baseDuration / this.#timeScale;

      currentCycleStart += scaledDuration;
      const timeUntilNext =
        (currentCycleStart - this.#context.currentTime) * 1000;

      if (timeUntilNext > 0) {
        timeoutId = setTimeout(scheduleNext, Math.max(timeUntilNext - 50, 0));
      } else {
        scheduleNext();
      }
    };

    scheduleNext();

    this.#stopLoopFn = () => {
      isLooping = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return this.#stopLoopFn;
  }

  startLooping(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue: number;
      playbackRate: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1, playbackRate: 1 }
  ) {
    this.stopLooping();
    this.#startLoop(audioParam, startTime, options);
  }

  stopLooping() {
    if (this.#stopLoopFn) {
      this.#stopLoopFn();
      this.#stopLoopFn = null;
    }
  }

  // === UTILS ===

  hasVariation(): boolean {
    const firstValue = this.points[0]?.value ?? 0;
    return this.points.some(
      (point) => Math.abs(point.value - firstValue) > 0.001
    );
  }

  // === CLEAN UP ===

  dispose() {
    this.stopLooping();
  }
}

// === FACTORIES ===

interface EnvelopeOptions {
  durationSeconds?: number;
  points?: EnvelopePoint[];
  valueRange?: [number, number];
  initEnable?: boolean;
}

export function createEnvelope(
  context: AudioContext,
  type: EnvelopeType,
  options: EnvelopeOptions = {}
): CustomEnvelope {
  const {
    durationSeconds = 1,
    points,
    valueRange = [0, 1],
    initEnable = true,
  } = options;

  // If custom points provided, use them
  if (points) {
    return new CustomEnvelope(
      context,
      type,
      points,
      valueRange,
      durationSeconds,
      initEnable
    );
  }

  // Otherwise use defaults based on type
  switch (type) {
    case 'amp-env':
      return new CustomEnvelope(
        context,
        'amp-env',
        [
          { time: 0, value: 0, curve: 'exponential' },
          { time: 0.005, value: 1, curve: 'exponential' },
          { time: durationSeconds, value: 0.0, curve: 'exponential' },
        ],
        valueRange || [0, 1],
        durationSeconds,
        true // log
      );

    case 'pitch-env':
      return new CustomEnvelope(
        context,
        'pitch-env',
        [
          { time: 0, value: 0.5, curve: 'exponential' },
          { time: durationSeconds, value: 0.5, curve: 'exponential' },
        ],
        valueRange || [0.5, 1.5],
        durationSeconds
        // true // log
      );

    case 'filter-env':
      return new CustomEnvelope(
        context,
        'filter-env',
        [
          { time: 0, value: 0.3, curve: 'linear' },
          { time: 0.05, value: 1.0, curve: 'linear' },
          { time: durationSeconds, value: 0.5, curve: 'linear' },
        ],
        valueRange || [30, 18000],
        durationSeconds
        // true // logarithmic = true
      );

    default:
      throw new Error(`Unknown envelope type: ${type}`);
  }
}
