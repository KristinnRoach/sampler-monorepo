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
  #currentPlaybackRate = 1;

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
      voiceId?: string;
      midiNote?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1, playbackRate: 1 }
  ) {
    this.#isReleased = false;
    this.#currentPlaybackRate = options.playbackRate;

    if (this.#loopEnabled) {
      this.#startLoopingEnv(audioParam, startTime, options);
    } else {
      this.#startSingleEnv(audioParam, startTime, options);
    }
  }

  releaseEnvelope(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue: number;
      playbackRate: number;
      voiceId?: string;
      midiNote?: number;
    } = { baseValue: 1, playbackRate: this.#currentPlaybackRate }
  ) {
    this.#isReleased = true;
    const releaseIndex = this.releasePointIndex;
    this.#continueFromPoint(audioParam, startTime, releaseIndex, options);
  }

  #getScaledDuration(
    fromIdx: number,
    toIdx: number,
    playbackRate = 1,
    timeScale = 1
  ): number {
    if (fromIdx < 0 || toIdx >= this.points.length || fromIdx >= toIdx) {
      return 0;
    }

    const fromTime = this.points[fromIdx].time;
    const toTime = this.points[toIdx].time;
    const rawDuration = toTime - fromTime;

    let scaledDuration = rawDuration;

    // Apply playback rate scaling if synced
    if (this.#syncedToPlaybackRate) {
      scaledDuration = scaledDuration / playbackRate;
    }

    // Apply time scale
    return scaledDuration / timeScale;
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
      playbackRate: number;
      voiceId?: string;
      midiNote?: number;
      minValue?: number;
      maxValue?: number;
    }
  ) {
    const endIdx = this.sustainEnabled
      ? (this.sustainPointIndex ?? this.points.length - 1)
      : this.points.length - 1;

    const scaledDuration = this.#getScaledDuration(
      0,
      endIdx,
      options.playbackRate,
      this.#timeScale
    );

    const curve = this.#generateCurve(
      scaledDuration,
      this.sustainEnabled
        ? (this.sustainPoint?.time ?? this.fullDuration)
        : this.fullDuration,
      options
    );

    if (options.voiceId !== undefined) {
      this.sendUpstreamMessage(`${this.envelopeType}:trigger`, {
        voiceId: options.voiceId,
        midiNote: options.midiNote ?? 60,
        duration: scaledDuration,
        sustainEnabled: this.sustainEnabled,
        sustainPoint: this.sustainPoint,
        // curveData: curve,
      });
    }

    const safeStart = Math.max(this.#context.currentTime, startTime);

    try {
      audioParam.cancelScheduledValues(safeStart);
      audioParam.setValueCurveAtTime(curve, safeStart, scaledDuration);

      // If sustainEnabled, hold the final curve value
      if (this.sustainEnabled) {
        const sustainValue = curve[curve.length - 1]; // this.points[this.sustainPointIndex].value;
        audioParam.setValueAtTime(sustainValue, safeStart + scaledDuration);
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
      playbackRate: number;
      voiceId?: string;
      midiNote?: number;
      minValue?: number;
      maxValue?: number;
    }
  ) {
    let currentStart = Math.max(this.#context.currentTime, startTime);

    const scheduleNext = () => {
      if (!this.#shouldLoop()) return;

      const scaledDuration = this.#getScaledDuration(
        0,
        this.points.length - 1,
        options.playbackRate,
        this.#timeScale
      );

      const curve = this.#generateCurve(
        scaledDuration,
        this.fullDuration,
        options
      );

      if (options.voiceId !== undefined) {
        this.sendUpstreamMessage(`${this.envelopeType}:trigger`, {
          voiceId: options.voiceId,
          midiNote: options.midiNote ?? 60,
          duration: scaledDuration,
          sustainEnabled: this.sustainEnabled,
          sustainPoint: this.sustainPoint,
          // curveData: curve,
        });
      }

      // Prevent schedule overlapping
      currentStart = Math.max(currentStart, this.#context.currentTime + 0.001);
      audioParam.cancelScheduledValues(currentStart);

      audioParam.setValueCurveAtTime(curve, currentStart, scaledDuration);
      currentStart += scaledDuration + 0.005;

      // Schedule next iteration just before this one ends
      const nextCallTime =
        (currentStart - scaledDuration - this.#context.currentTime) * 1000 - 10;

      if (options.voiceId !== undefined) {
        this.sendUpstreamMessage(`${this.envelopeType}:trigger`, {
          voiceId: options.voiceId,
          midiNote: options.midiNote ?? 60,
          duration: scaledDuration,
          sustainEnabled: false,
        });
      }
      setTimeout(scheduleNext, Math.max(0, nextCallTime));
    };

    scheduleNext();
  }

  #continueFromPoint(
    audioParam: AudioParam,
    startTime: number,
    fromPointIndex: number,
    options: {
      baseValue: number;
      playbackRate: number;
      voiceId?: string;
      midiNote?: number;
      minValue?: number;
      maxValue?: number;
    }
  ) {
    const fromPoint = this.points[fromPointIndex];
    const lastPoint = this.points[this.points.length - 1];

    // Raw envelope duration (before any scaling)
    const rawRemainingDuration = lastPoint.time - fromPoint.time;

    const scaledRemainingDuration = this.#getScaledDuration(
      fromPointIndex,
      this.points.length - 1,
      options.playbackRate,
      this.#timeScale
    );

    if (scaledRemainingDuration <= 0) return;

    // Get the original envelope values from sustain to end
    let startValue = this.#data.interpolateValueAtTime(fromPoint.time);
    let endValue = this.#data.interpolateValueAtTime(lastPoint.time);

    const currentValue = audioParam.value;

    // Generate the release curve shape from sustain point to end
    const sampleRate = this.#getSampleRate(scaledRemainingDuration);
    const numSamples = Math.max(
      2,
      Math.floor(scaledRemainingDuration * sampleRate)
    );
    const curve = new Float32Array(numSamples);

    const { baseValue: base, minValue: min, maxValue: max } = options;

    if (this.#logarithmic) {
      startValue = Math.pow(startValue, 2);
      endValue = Math.pow(endValue, 2);
    }

    // Apply scaling to get actual audio parameter values
    const startAudioValue = (base ?? 1) * startValue;
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
        startAudioValue !== finalEndValue
          ? (targetValue - startAudioValue) / (finalEndValue - startAudioValue)
          : 0;

      const scaledValue =
        currentValue + envelopeProgress * (finalEndValue - currentValue);

      curve[i] = this.#clampToValueRange(scaledValue);
      // curve[i] = i === 0 ? currentValue : this.#clampToValueRange(scaledValue); // prevent a sudden jump at the start of the curve
    }

    // Emit release event
    if (options.voiceId !== undefined) {
      this.sendUpstreamMessage(`${this.envelopeType}:release`, {
        voiceId: options.voiceId,
        midiNote: options.midiNote ?? 60, // Currently not used
        releasePointTime:
          this.points[this.releasePointIndex].time /
          this.currentPlaybackRate /
          this.timeScale,
        remainingDuration: scaledRemainingDuration,
        // curveData: curve,
      });
    }

    const safeStart = Math.max(this.#context.currentTime, startTime);

    try {
      audioParam.cancelScheduledValues(safeStart);
      audioParam.setValueCurveAtTime(curve, safeStart, scaledRemainingDuration);
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
        safeStart + scaledRemainingDuration
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
  setReleasePoint = (index: number) => this.#data.setReleasePoint(index);

  get sustainPointIndex() {
    return this.#data.sustainPointIndex;
  }

  get releasePointIndex() {
    return this.#data.releasePointIndex;
  }

  get releasePoint(): EnvelopePoint | null {
    return this.points[this.releasePointIndex] || null;
  }

  get releaseTime() {
    const rawDuration =
      this.points[this.points.length - 1].time -
      this.points[this.releasePointIndex].time;

    return this.#syncedToPlaybackRate
      ? rawDuration / this.#currentPlaybackRate / this.#timeScale
      : rawDuration / this.#timeScale;
  }

  get sustainEnabled() {
    return this.sustainPoint !== null && !this.loopEnabled;
  }

  get sustainPoint(): EnvelopePoint | null {
    return this.sustainPointIndex !== null
      ? this.points[this.sustainPointIndex]
      : null;
  }

  get currentPlaybackRate() {
    return this.#currentPlaybackRate;
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
