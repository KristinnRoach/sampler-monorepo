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
  ): void => {
    this.#data.addPoint(time, value, curve);
    if (this.#isCurrentlyLooping) this.#loopUpdateFlag = true;
  };

  deletePoint = (index: number): void => {
    this.#data.deletePoint(index);
    if (this.#isCurrentlyLooping) this.#loopUpdateFlag = true;
  };

  updatePoint = (index: number, time?: number, value?: number) => {
    this.#data.updatePoint(index, time, value);
    if (this.#isCurrentlyLooping) this.#loopUpdateFlag = true;
  };

  updateStartPoint = (time?: number, value?: number) => {
    this.#data.updateStartPoint(time, value);
    if (this.#isCurrentlyLooping) this.#loopUpdateFlag = true;
  };

  updateEndPoint = (time?: number, value?: number) => {
    this.#data.updateEndPoint(time, value);
    if (this.#isCurrentlyLooping) this.#loopUpdateFlag = true;
  };

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

    let duration = rawDuration;

    // Apply playback rate scaling if synced
    if (this.#syncedToPlaybackRate) {
      duration = duration / playbackRate;
    }

    // Apply time scale
    return duration / timeScale;
  }

  #getCurveSamplingRate(duration: number): number {
    if (this.#logarithmic) {
      return duration < 1 ? 1000 : 750;
    }
    if (this.#data.hasSharpTransitions) {
      return 1000;
    }
    return duration < 1 ? 500 : 250;
  }

  #generateCurve(
    scaledDuration: number,
    endTime = this.fullDuration,
    options: {
      baseValue: number;
      minValue?: number;
      maxValue?: number;
      playbackRate: number;
    }
  ): Float32Array {
    const sampleRate = this.#getCurveSamplingRate(scaledDuration);
    const numSamples = Math.max(2, Math.floor(scaledDuration * sampleRate));
    const curve = new Float32Array(numSamples);

    const { baseValue: base, minValue: min, maxValue: max } = options;

    for (let i = 0; i < numSamples; i++) {
      const normalizedProgress = i / (numSamples - 1);
      const absoluteTime = normalizedProgress * endTime;

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
        midiNote: options.midiNote || 60,
        duration: scaledDuration,
        sustainEnabled: this.sustainEnabled,
        loopEnabled: false,
        sustainPoint: this.sustainPoint,
        releasePoint: this.releasePoint,
        // curveData: curve,
      });
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

  #isReleased = false;
  #isCurrentlyLooping = false;
  #loopUpdateFlag = false;
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
    let cachedDuration = this.#getScaledDuration(
      this.#data.startPointIndex,
      this.#data.endPointIndex,
      options.playbackRate,
      this.#timeScale
    );
    let cachedCurve = this.#generateCurve(
      cachedDuration,
      this.fullDuration,
      options
    );

    // Send initial trigger message
    if (options.voiceId !== undefined) {
      this.sendUpstreamMessage(`${this.envelopeType}:trigger`, {
        voiceId: options.voiceId,
        midiNote: options.midiNote || 60,
        duration: cachedDuration,
        sustainEnabled: false,
        loopEnabled: true,
        sustainPoint: this.sustainPoint,
        releasePoint: this.releasePoint,
      });
    }

    let phase = Math.max(this.#context.currentTime, startTime);

    // const lookAhead = 0.01;
    // const lookAhead = Math.max(0.1, cachedDuration * 3);
    const lookAhead = Math.max(0.15, Math.min(cachedDuration * 3, 0.5));
    const safetyBuffer = 0.005;
    let lastScheduledEnd = 0;
    let debugOverlapCount = 0;

    this.#isCurrentlyLooping = true;
    let isScheduling = false;
    let nextScheduleTimeout: number | null = null;

    const scheduleNext = () => {
      // Clear any pending schedule // ? Redundant ?
      if (nextScheduleTimeout !== null) {
        clearTimeout(nextScheduleTimeout);
        nextScheduleTimeout = null;
      }

      if (isScheduling) return; // Prevent concurrent scheduling
      isScheduling = true;

      try {
        if (!this.#shouldLoop()) {
          if (options.voiceId !== undefined) {
            this.sendUpstreamMessage(`${this.envelopeType}:release:loop`, {
              voiceId: options.voiceId,
              midiNote: options.midiNote || 60,
            });
          }

          this.#isCurrentlyLooping = false;
          return;
        }

        // Recalculate if envelope has changed
        if (this.#loopUpdateFlag) {
          cachedDuration = this.#getScaledDuration(
            this.#data.startPointIndex,
            this.#data.endPointIndex,
            options.playbackRate,
            this.#timeScale
          );

          cachedCurve = this.#generateCurve(
            cachedDuration,
            this.fullDuration,
            options
          );
        }

        // Schedule with lookahead
        while (
          phase < this.#context.currentTime + lookAhead &&
          phase >= lastScheduledEnd
        ) {
          const safeCurveDuration = cachedDuration - safetyBuffer;

          // NOTE: IF having overlapping scheduling issues,
          // could resort to using "audioParam.cancelScheduledValues(phase)"
          // instead of the other tricks, e.g. 'lastScheduledEnd', safetyBuffer etc.

          try {
            audioParam.setValueCurveAtTime(
              cachedCurve,
              phase,
              safeCurveDuration
            );
          } catch (error) {
            // Curve overlap, advance phase
            debugOverlapCount++;
            if (debugOverlapCount >= 100) {
              console.debug(
                `Multiple curve overlaps in looping envelope, nr of overlaps: ${debugOverlapCount} 
                (loop duration: ${cachedDuration.toFixed(3)}s, buffer: ${safetyBuffer})`
              );
              debugOverlapCount = 0;
            }
          }

          phase += cachedDuration + safetyBuffer;
          lastScheduledEnd = phase;

          // Convert audio context time to performance time for UI sync
          if (options.voiceId !== undefined) {
            const timestamp = this.#context.getOutputTimestamp();

            if (
              timestamp.contextTime !== undefined &&
              timestamp.performanceTime !== undefined
            ) {
              const elapsedTime = phase - timestamp.contextTime;
              const performanceTime =
                timestamp.performanceTime + elapsedTime * 1000;

              // Schedule UI update at performance time
              const delay = Math.max(0, performanceTime - performance.now());

              setTimeout(() => {
                this.sendUpstreamMessage(`${this.envelopeType}:trigger:loop`, {
                  voiceId: options.voiceId,
                  midiNote: options.midiNote || 60,
                  duration: cachedDuration,
                });
              }, delay);
            } else {
              // Fallback: send message immediately if timestamp is not available
              this.sendUpstreamMessage(`${this.envelopeType}:trigger:loop`, {
                voiceId: options.voiceId,
                midiNote: options.midiNote || 60,
                duration: cachedDuration,
              });
            }
          }
        }

        // Schedule next iteration BEFORE releasing lock
        nextScheduleTimeout = setTimeout(() => {
          scheduleNext();
        }, 100);
      } finally {
        isScheduling = false;
      }
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
    const sampleRate = this.#getCurveSamplingRate(scaledRemainingDuration);
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

    let releasePointTime = this.points[this.releasePointIndex].time;
    if (this.#syncedToPlaybackRate)
      releasePointTime = releasePointTime / options.playbackRate;
    const scaledReleasePointTime = releasePointTime / this.#timeScale;

    // Emit release event
    if (options.voiceId !== undefined) {
      this.sendUpstreamMessage(`${this.envelopeType}:release`, {
        voiceId: options.voiceId,
        midiNote: options.midiNote || 60, // Currently not used
        releasePointTime: scaledReleasePointTime,
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
    if (this.#isCurrentlyLooping) this.#loopUpdateFlag = true;
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

  setCurrentPlaybackRate(playbackRate: number) {
    this.#currentPlaybackRate = playbackRate;

    if (this.#syncedToPlaybackRate && this.#isCurrentlyLooping) {
      this.#loopUpdateFlag = true;
    }
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
            { time: 0.67, value: 0.75, curve: 'exponential' as const },
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
          sustainPointIndex: 2,
          releasePointIndex: 3,
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
          sustainPointIndex: null, // No sustain for pitch
          releasePointIndex: 1, // ? should be null ? or special handling for pitch
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
          sustainPointIndex: null, // No sustain for filter
          releasePointIndex: 1, // Release from second point
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
          sustainPointIndex: null,
          releasePointIndex: 0, // ??
        };
    }
  }

  // === CLEAN UP ===

  dispose() {
    this.#loopEnabled = false;
    deleteNodeId(this.nodeId);
  }
}

// Ignore.. A bit simplified looping version below, would need testing:
// #startLoopingEnv(
//   audioParam: AudioParam,
//   startTime: number,
//   options: {
//     baseValue: number;
//     playbackRate: number;
//     voiceId?: string;
//     midiNote?: number;
//     minValue?: number;
//     maxValue?: number;
//   }
// ) {
//   let cachedDuration = this.#getScaledDuration(
//     this.#data.startPointIndex,
//     this.#data.endPointIndex,
//     options.playbackRate,
//     this.#timeScale
//   );
//   let cachedCurve = this.#generateCurve(
//     cachedDuration,
//     this.fullDuration,
//     options
//   );

//   // Send initial trigger message
//   if (options.voiceId !== undefined) {
//     this.sendUpstreamMessage(`${this.envelopeType}:trigger`, {
//       voiceId: options.voiceId,
//       midiNote: options.midiNote || 60,
//       duration: cachedDuration,
//       sustainEnabled: false,
//       loopEnabled: true,
//       sustainPoint: this.sustainPoint,
//       releasePoint: this.releasePoint,
//     });
//   }

//   let phase = Math.max(this.#context.currentTime, startTime);
//   const lookAhead = 0.01;
//   const safetyBuffer = 0.002;
//   let debugOverlapCount = 0;

//   this.#isCurrentlyLooping = true;
//   let isScheduling = false;
//   let nextScheduleTimeout: number | null = null;

//   const scheduleNext = () => {
//     if (nextScheduleTimeout !== null) {
//       clearTimeout(nextScheduleTimeout);
//       nextScheduleTimeout = null;
//     }

//     if (isScheduling) return;
//     isScheduling = true;

//     try {
//       if (!this.#shouldLoop()) {
//         if (options.voiceId !== undefined) {
//           this.sendUpstreamMessage(`${this.envelopeType}:release:loop`, {
//             voiceId: options.voiceId,
//             midiNote: options.midiNote || 60,
//           });
//         }
//         this.#isCurrentlyLooping = false;
//         return;
//       }

//       // Recalculate if envelope has changed
//       if (this.#loopUpdateFlag) {
//         cachedDuration = this.#getScaledDuration(
//           this.#data.startPointIndex,
//           this.#data.endPointIndex,
//           options.playbackRate,
//           this.#timeScale
//         );

//         cachedCurve = this.#generateCurve(
//           cachedDuration,
//           this.fullDuration,
//           options
//         );
//       }

//       // Schedule with lookahead
//       while (phase < this.#context.currentTime + lookAhead) {
//         const safeCurveDuration = cachedDuration - safetyBuffer;

//         try {
//           audioParam.setValueCurveAtTime(
//             cachedCurve,
//             phase,
//             safeCurveDuration
//           );

//           // Simple UI message - send immediately
//           if (options.voiceId !== undefined) {
//             this.sendUpstreamMessage(`${this.envelopeType}:trigger:loop`, {
//               voiceId: options.voiceId,
//               midiNote: options.midiNote || 60,
//               duration: cachedDuration,
//             });
//           }
//         } catch (error) {
//           debugOverlapCount++;
//           if (debugOverlapCount >= 10) {
//             console.debug(
//               `Curve overlaps: ${debugOverlapCount} (duration: ${cachedDuration.toFixed(3)}s)`
//             );
//             debugOverlapCount = 0;
//           }
//         }

//         phase += cachedDuration + safetyBuffer;
//       }

//       nextScheduleTimeout = setTimeout(scheduleNext, 100);
//     } finally {
//       isScheduling = false;
//     }
//   };

//   scheduleNext();
// }
