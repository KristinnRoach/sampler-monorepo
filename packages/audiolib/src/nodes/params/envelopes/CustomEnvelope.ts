// CustomEnvelope.ts

import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import { EnvelopePoint, EnvelopeType } from './env-types';
import { EnvelopeData } from './EnvelopeData';

// ===== CUSTOM ENVELOPE  =====
export class CustomEnvelope {
  readonly nodeId: NodeID;
  readonly nodeType: EnvelopeType = 'default-env';

  #context: AudioContext;
  #messages: MessageBus<Message>;

  #data: EnvelopeData;
  #paramName: string;
  envelopeType: EnvelopeType;

  #isEnabled: boolean;
  #loopEnabled = false;
  #syncedToPlaybackRate = false;

  #timeScale = 1;
  #logarithmic = false;

  constructor(
    context: AudioContext,
    envelopeType: EnvelopeType,

    sharedData?: EnvelopeData,

    initialPoints: EnvelopePoint[] = [],
    valueRange: [number, number] = [0, 1],
    durationSeconds = 1,

    logarithmic = false,
    initEnable = true
  ) {
    this.envelopeType = envelopeType;
    this.nodeType = envelopeType;
    this.nodeId = createNodeId(this.envelopeType);
    this.#messages = createMessageBus<Message>(this.nodeId);

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

    // Use shared data if provided, otherwise create new
    this.#data =
      sharedData ||
      new EnvelopeData([...initialPoints], valueRange, durationSeconds);
  }

  // Delegate data operations to EnvelopeData
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
  triggerEnvelope(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue: number;
      playbackRate: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1, playbackRate: 1 }
  ) {
    this.#isReleased = false;

    if (this.#loopEnabled) {
      this.#startLoopingEnv(audioParam, startTime, options);
    } else {
      this.#startSingleEnv(audioParam, startTime, options);
    }

    // this.sendUpstreamMessage('envelope:trigger', {
    //   envType: this.envelopeType,
    //   duration: this.fullDuration / this.#timeScale,
    //   loopEnabled: this.#loopEnabled,
    //   sustainPointIndex: this.#data.sustainPointIndex,
    // });
  }

  releaseEnvelope(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue: number;
      playbackRate: number;
    } = { baseValue: 1, playbackRate: 1 }
  ) {
    const { baseValue = 1, playbackRate = 1 } = options;

    this.#isReleased = true;
    const releaseIndex = this.#data.sustainPointIndex ?? this.points.length - 2;

    // Continue envelope from sustain point to end
    this.#continueFromPoint(audioParam, startTime, releaseIndex, {
      baseValue,
      playbackRate,
    });

    // this.sendUpstreamMessage('envelope:release', {
    //   envType: this.envelopeType,
    //   releaseTime: sustainIndex !== null ? this.releaseTime : duration,
    //   usedSustain: sustainIndex !== null,
    // });
  }

  #getScaledDuration(targetDuration: number, playbackRate: number = 1): number {
    const sustainIndex = this.#loopEnabled
      ? null
      : this.#data.sustainPointIndex;

    let duration = targetDuration;

    if (sustainIndex !== null && sustainIndex < this.#data.points.length) {
      duration = this.#data.points[sustainIndex].time;
    }

    // Apply playback rate scaling if synced
    if (this.#syncedToPlaybackRate) {
      duration = duration / playbackRate;
    }

    // ALWAYS apply timeScale
    return duration / this.#timeScale;
  }

  #getSampleRate(duration: number): number {
    if (this.#logarithmic) {
      return duration < 1 ? 1000 : 750; // Higher rates for log curves
    }
    if (this.#data.hasSharpTransitions) {
      return 1000;
    }
    return duration < 1 ? 500 : 250;
  }

  #generateCurve(
    scaledDuration: number,
    fullDuration = this.fullDuration,
    options: {
      baseValue: number;
      minValue?: number;
      maxValue?: number;
      playbackRate: number;
    }
  ): Float32Array {
    const sampleRate = this.#getSampleRate(scaledDuration);
    const numSamples = Math.max(2, Math.floor(scaledDuration * sampleRate));
    const curve = new Float32Array(numSamples);

    const { baseValue: base, minValue: min, maxValue: max } = options;

    for (let i = 0; i < numSamples; i++) {
      const normalizedProgress = i / (numSamples - 1);
      const absoluteTime = normalizedProgress * fullDuration;

      let value = this.#data.interpolateValueAtTime(absoluteTime);

      if (this.#logarithmic) {
        value = Math.pow(value, 2);
      }

      let finalValue = (base ?? 1) * value;
      if (min !== undefined) finalValue = Math.max(finalValue, min);
      if (max !== undefined) finalValue = Math.min(finalValue, max);

      curve[i] = this.#clampToValueRange(finalValue);
    }

    return curve;
  }

  #startSingleEnv(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue: number;
      minValue?: number;
      maxValue?: number;
      playbackRate: number;
    }
  ) {
    const scaledDuration = this.#getScaledDuration(
      this.fullDuration,
      options.playbackRate
    );

    const curve = this.#generateCurve(
      scaledDuration,
      this.sustainEnabled
        ? (this.sustainPoint?.time ?? this.fullDuration)
        : this.fullDuration,
      options
    );

    const safeStart = Math.max(this.#context.currentTime, startTime);

    try {
      audioParam.cancelScheduledValues(safeStart);
      audioParam.setValueCurveAtTime(curve, safeStart, scaledDuration);

      // If sustainEnabled, hold the final curve value
      if (this.sustainEnabled) {
        const sustainValue = curve[curve.length - 1]; // this.points[this.sustainPointIndex].value;
        audioParam.setValueAtTime(sustainValue, safeStart + scaledDuration);

        console.debug(
          { finalCurveVal: curve[curve.length - 1], scaledDuration },
          this.sustainPointIndex && {
            susPointValue: this.points[this.sustainPointIndex].value,
            susPointTime: this.points[this.sustainPointIndex].time,
          }
        );
      }
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

  #isReleased = false;
  #shouldLoop = () => this.#loopEnabled && !this.#isReleased;

  #startLoopingEnv(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue: number;
      minValue?: number;
      maxValue?: number;
      playbackRate: number;
    }
  ) {
    let currentStart = Math.max(this.#context.currentTime, startTime);

    const scheduleNext = () => {
      if (!this.#shouldLoop()) return;

      const scaledDuration = this.#getScaledDuration(
        this.fullDuration,
        options.playbackRate
      );

      const curve = this.#generateCurve(
        scaledDuration,
        this.fullDuration,
        options
      );

      // Prevent schedule overlapping
      currentStart = Math.max(currentStart, this.#context.currentTime + 0.001);
      audioParam.cancelScheduledValues(currentStart);

      audioParam.setValueCurveAtTime(curve, currentStart, scaledDuration);
      currentStart += scaledDuration + 0.005;

      // Schedule next iteration just before this one ends
      const nextCallTime =
        (currentStart - scaledDuration - this.#context.currentTime) * 1000 - 10;
      setTimeout(scheduleNext, Math.max(0, nextCallTime));
    };

    scheduleNext();
  }

  #release(
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

  #continueFromPoint(
    audioParam: AudioParam,
    startTime: number,
    fromPointIndex: number,
    options: {
      baseValue: number;
      minValue?: number;
      maxValue?: number;
      playbackRate: number;
    }
  ) {
    const fromPoint = this.points[fromPointIndex];
    const lastPoint = this.points[this.points.length - 1];

    // Raw envelope duration (before any scaling)
    const rawRemainingDuration = lastPoint.time - fromPoint.time;

    const scaledDuration = this.#getScaledDuration(
      rawRemainingDuration,
      options.playbackRate
    );

    if (scaledDuration <= 0) return;

    // Get the original envelope values from sustain to end
    let sustainValue = this.#data.interpolateValueAtTime(fromPoint.time);
    let endValue = this.#data.interpolateValueAtTime(lastPoint.time);

    const currentValue = audioParam.value;
    // const playbackScale = this.#syncedToPlaybackRate ? options.playbackRate : 1;

    // Generate the release curve shape from sustain point to end
    const sampleRate = this.#getSampleRate(scaledDuration);
    const numSamples = Math.max(2, Math.floor(scaledDuration * sampleRate));
    const curve = new Float32Array(numSamples);

    const { baseValue: base, minValue: min, maxValue: max } = options;

    if (this.#logarithmic) {
      sustainValue = Math.pow(sustainValue, 2);
      endValue = Math.pow(endValue, 2);
    }

    // Apply scaling to get actual audio parameter values
    const sustainAudioValue = (base ?? 1) * sustainValue;
    const endAudioValue = (base ?? 1) * endValue;

    // Apply min/max constraints
    const finalEndValue = Math.max(
      min ?? -Infinity,
      Math.min(max ?? Infinity, endAudioValue)
    );

    // Generate curve that follows envelope shape but starts from currentValue
    for (let i = 0; i < numSamples; i++) {
      const normalizedProgress = i / (numSamples - 1);
      const absoluteTime =
        fromPoint.time + normalizedProgress * rawRemainingDuration;

      // Get the envelope's original value at this time
      let envelopeValue = this.#data.interpolateValueAtTime(absoluteTime);

      if (this.#logarithmic) {
        envelopeValue = Math.pow(envelopeValue, 2);
      }

      let targetValue = (base ?? 1) * envelopeValue;
      if (min !== undefined) targetValue = Math.max(targetValue, min);
      if (max !== undefined) targetValue = Math.min(targetValue, max);

      // Scale the envelope shape to start from currentValue instead of sustainValue
      const envelopeProgress =
        sustainAudioValue !== finalEndValue
          ? (targetValue - sustainAudioValue) /
            (finalEndValue - sustainAudioValue)
          : 0;

      const scaledValue =
        currentValue + envelopeProgress * (finalEndValue - currentValue);

      curve[i] = this.#clampToValueRange(scaledValue);
    }

    const safeStart = Math.max(this.#context.currentTime, startTime);

    try {
      audioParam.cancelScheduledValues(safeStart);
      audioParam.setValueCurveAtTime(curve, safeStart, scaledDuration);
    } catch (error) {
      console.warn(
        'Failed to apply release curve, falling back to linear ramp:',
        error
      );
      // Fallback to simple linear ramp
      audioParam.cancelScheduledValues(safeStart);
      audioParam.setValueAtTime(currentValue, safeStart);
      audioParam.linearRampToValueAtTime(
        finalEndValue,
        safeStart + scaledDuration
      );
    }
  }

  // ===== LOOP / TIME CONTROL =====

  setTimeScale = (timeScale: number) => {
    this.#timeScale = timeScale;
    // Takes effect on next loop iteration for looping envelopes
  };

  setLoopEnabled = (
    enabled: boolean,
    mode: 'normal' | 'ping-pong' | 'reverse' = 'normal'
  ) => {
    if (mode !== 'normal') {
      console.info(
        `Only default env loop mode implemented. Other modes coming soon!`
      );
    }
    this.#loopEnabled = enabled;
  };

  syncToPlaybackRate = (sync: boolean) => {
    this.#syncedToPlaybackRate = sync;
  };

  // === SUSTAIN / RELEASE ===

  setSustainPoint = (index: number | null) => this.#data.setSustainPoint(index);

  get sustainPointIndex() {
    return this.#data.sustainPointIndex;
  }

  get releaseTime() {
    // note: does not use scaled duration so might not be accurate
    return (
      this.points[this.points.length - 1].time -
      this.points[this.sustainPointIndex ?? this.points.length - 2].time
    );
  }

  get sustainEnabled() {
    return this.sustainPoint !== null && !this.loopEnabled;
  }

  get sustainPoint(): EnvelopePoint | null {
    return this.sustainPointIndex ? this.points[this.sustainPointIndex] : null;
  }

  // === MESSAGES ===

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  sendUpstreamMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
    return this;
  }

  // === UTILS ===

  #clampToValueRange(value: number): number {
    const [min, max] = this.#data.valueRange;
    return Math.max(min, Math.min(max, value));
  }

  hasVariation(): boolean {
    const firstValue = this.points[0]?.value ?? 0;
    return this.points.some(
      (point) => Math.abs(point.value - firstValue) > 0.001
    );
  }

  // === DEFAULTS ===

  static getDefaults(envType: EnvelopeType, durationSeconds = 1) {
    switch (envType) {
      case 'amp-env':
        return {
          points: [
            { time: 0, value: 0, curve: 'exponential' as const },
            { time: 0.005, value: 1, curve: 'exponential' as const },
            { time: 0.3, value: 0.5, curve: 'exponential' as const },
            {
              time: durationSeconds - 0.1,
              value: 0.5,
              curve: 'exponential' as const,
            },
            {
              time: durationSeconds,
              value: 0.0,
              curve: 'exponential' as const,
            },
          ],
          valueRange: [0, 1] as [number, number],
          logarithmic: true,
          initEnable: true,
        };

      case 'pitch-env':
        return {
          points: [
            { time: 0, value: 0.5, curve: 'exponential' as const },
            {
              time: durationSeconds,
              value: 0.5,
              curve: 'exponential' as const,
            },
          ],
          valueRange: [0.5, 1.5] as [number, number],
          logarithmic: false,
          initEnable: false,
        };

      case 'filter-env':
        return {
          points: [
            { time: 0, value: 0.3, curve: 'exponential' as const },
            { time: 0.05, value: 1.0, curve: 'exponential' as const },
            {
              time: durationSeconds,
              value: 0.5,
              curve: 'exponential' as const,
            },
          ],
          valueRange: [30, 18000] as [number, number],
          logarithmic: false,
          initEnable: false,
        };

      default:
        return {
          points: [
            { time: 0, value: 0, curve: 'linear' as const },
            { time: durationSeconds, value: 1, curve: 'linear' as const },
          ],
          valueRange: [0, 1] as [number, number],
          logarithmic: false,
          initEnable: true,
        };
    }
  }

  // === CLEAN UP ===

  dispose() {
    this.#loopEnabled = false;
    deleteNodeId(this.nodeId);
  }
}
