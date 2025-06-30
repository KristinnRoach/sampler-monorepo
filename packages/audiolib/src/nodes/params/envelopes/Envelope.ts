import { LibNode, NodeType } from '@/nodes/LibNode';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
import { EnvelopePoint, EnvelopeType } from './env-types';
import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

// ===== ENVELOPE DATA - Pure data operations =====
export class EnvelopeData {
  #hasSharpTransitions = false;

  constructor(
    public points: EnvelopePoint[] = [],
    public valueRange: [number, number] = [0, 1],
    public timeRange: [number, number] = [0, 1]
  ) {}

  addPoint(
    time: number,
    value: number,
    curve: 'linear' | 'exponential' = 'exponential'
  ) {
    const newPoint = { time, value, curve };
    const insertIndex = this.points.findIndex((p) => p.time > time);

    if (insertIndex === -1) {
      this.points.push(newPoint);
    } else {
      this.points.splice(insertIndex, 0, newPoint);
    }
    this.#updateSharpTransitionsFlag();
  }

  updatePoint(index: number, time?: number, value?: number) {
    if (index >= 0 && index < this.points.length && this.points.length) {
      const currentPoint = this.points[index];
      this.points[index] = {
        ...currentPoint,
        time: time ?? currentPoint.time,
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
    if (index > 0 && index < this.points.length - 1) {
      this.points.splice(index, 1);
    }
    this.#updateSharpTransitionsFlag();
  }

  interpolateValueAtTime(normalizedTime: number): number {
    if (this.points.length === 0) return this.valueRange[0];
    if (this.points.length === 1) {
      const [min, max] = this.valueRange;
      return min + this.points[0].value * (max - min);
    }

    const sorted = [...this.points].sort((a, b) => a.time - b.time);

    let normalizedValue: number;

    // Clamp to bounds
    if (normalizedTime <= sorted[0].time) {
      normalizedValue = sorted[0].value;
    } else if (normalizedTime >= sorted[sorted.length - 1].time) {
      normalizedValue = sorted[sorted.length - 1].value;
    } else {
      // Find segment
      normalizedValue = 0; // fallback
      for (let i = 0; i < sorted.length - 1; i++) {
        const left = sorted[i];
        const right = sorted[i + 1];

        if (normalizedTime >= left.time && normalizedTime <= right.time) {
          const segmentDuration = right.time - left.time;
          const t =
            segmentDuration === 0
              ? 0
              : (normalizedTime - left.time) / segmentDuration;

          if (
            left.curve === 'exponential' &&
            left.value > 0 &&
            right.value > 0
          ) {
            normalizedValue =
              left.value * Math.pow(right.value / left.value, t);
          } else {
            normalizedValue = left.value + (right.value - left.value) * t;
          }
          break;
        }
      }
    }

    // Scale from 0-1 to target range
    const [min, max] = this.valueRange;
    return min + normalizedValue * (max - min);
  }

  #updateSharpTransitionsFlag() {
    const threshold = 0.02;
    this.#hasSharpTransitions = this.points.some(
      (point, i) =>
        i > 0 && Math.abs(point.time - this.points[i - 1].time) < threshold
    );
  }

  get hasSharpTransitions() {
    return this.#hasSharpTransitions;
  }

  getSVGPath(width: number = 400, height: number = 200): string {
    if (this.points.length < 2) return `M0,${height} L${width},${height}`;

    const sorted = [...this.points].sort((a, b) => a.time - b.time);
    let path = `M${sorted[0].time * width},${(1 - sorted[0].value) * height}`;

    for (let i = 1; i < sorted.length; i++) {
      const point = sorted[i];
      const prevPoint = sorted[i - 1];
      const x = point.time * width;
      const y = (1 - point.value) * height;

      if (prevPoint.curve === 'exponential') {
        const prevX = prevPoint.time * width;
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

  get startTime() {
    return this.points[0]?.time ?? 0;
  }
  get endTime() {
    return this.points[this.points.length - 1]?.time ?? 1;
  }
  get durationNormalized() {
    return this.endTime - this.startTime;
  }

  get durationSeconds() {
    const [timeMin, timeMax] = this.timeRange;
    return (timeMax - timeMin) * this.durationNormalized;
  }
}

// ===== ENVELOPE SCHEDULER - Web Audio operations =====
export class EnvelopeScheduler {
  #context: AudioContext;

  constructor(context: AudioContext) {
    this.#context = context;
  }

  applyEnvelope(
    audioParam: AudioParam,
    envelopeData: EnvelopeData,
    startTime: number,
    duration: number,
    options: {
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
  ) {
    audioParam.cancelScheduledValues(startTime);

    const sampleRate = envelopeData.hasSharpTransitions
      ? 1000
      : duration < 1
        ? 500
        : 250;

    const numSamples = Math.max(2, Math.floor(duration * sampleRate));
    const curve = new Float32Array(numSamples);

    const { baseValue: base, minValue: min, maxValue: max } = options;

    for (let i = 0; i < numSamples; i++) {
      const normalizedTime = i / (numSamples - 1);
      const value = envelopeData.interpolateValueAtTime(normalizedTime);
      let finalValue = (base ?? 1) * value;

      if (min !== undefined) finalValue = Math.max(finalValue, min);
      if (max !== undefined) finalValue = Math.max(Math.min(max, finalValue));

      curve[i] = finalValue;
    }

    try {
      audioParam.setValueCurveAtTime(curve, startTime, duration);
    } catch (error) {
      console.warn('Failed to apply envelope curve:', error);
      // Fallback to linear ramp
      audioParam.setValueAtTime(curve[0], startTime);
      audioParam.linearRampToValueAtTime(
        curve[curve.length - 1],
        startTime + duration
      );
    }
  }

  applyRelease(
    audioParam: AudioParam,
    startTime: number,
    duration: number,
    currentValue: number,
    targetValue = 0.001,
    curve: 'linear' | 'exponential' = 'exponential',
    options: {
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
  ) {
    audioParam.cancelScheduledValues(startTime);
    audioParam.setValueAtTime(currentValue, startTime);

    try {
      if (curve === 'exponential' && currentValue > 0.001 && targetValue > 0) {
        audioParam.exponentialRampToValueAtTime(
          targetValue,
          startTime + duration
        );
      } else {
        audioParam.linearRampToValueAtTime(targetValue, startTime + duration);
      }
    } catch (error) {
      console.warn('Failed to apply release:', error);
      audioParam.linearRampToValueAtTime(targetValue, startTime + duration);
    }
  }

  startLoop(
    audioParam: AudioParam,
    envelopeData: EnvelopeData,
    startTime: number,
    loopDuration: number,
    options: {
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
  ): () => void {
    let isLooping = true;
    let currentCycleStart = startTime;
    let timeoutId: number | null = null;

    const scheduleNext = () => {
      if (!isLooping) return;

      this.applyEnvelope(
        audioParam,
        envelopeData,
        currentCycleStart,
        loopDuration,
        options
      );

      currentCycleStart += loopDuration;
      const timeUntilNext =
        (currentCycleStart - this.#context.currentTime) * 1000;

      if (timeUntilNext > 0) {
        timeoutId = setTimeout(scheduleNext, Math.max(timeUntilNext - 50, 0));
      } else {
        scheduleNext();
      }
    };

    scheduleNext();

    return () => {
      isLooping = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }
}

// ===== CUSTOM ENVELOPE - Coordinates data and scheduling =====
export class CustomEnvelope {
  envelopeType: EnvelopeType;

  #data: EnvelopeData;
  #scheduler: EnvelopeScheduler;
  #stopLoopFn: (() => void) | null = null;
  #loopEnabled = false;

  constructor(
    context: AudioContext,
    envelopeType: EnvelopeType,
    initialPoints: EnvelopePoint[] = [],
    valueRange: [number, number] = [0, 1],
    timeRange: [number, number] = [0, 1]
  ) {
    this.envelopeType = envelopeType;
    this.#data = new EnvelopeData([...initialPoints], valueRange, timeRange);
    this.#scheduler = new EnvelopeScheduler(context);
  }

  // ===== DATA OPERATIONS =====
  addPoint(
    time: number,
    value: number,
    curve: 'linear' | 'exponential' = 'exponential'
  ) {
    this.#data.addPoint(time, value, curve);
    return this;
  }

  updatePoint(index: number, time?: number, value?: number) {
    this.#data.updatePoint(index, time, value);
    return this;
  }

  deletePoint(index: number) {
    this.#data.deletePoint(index);
    return this;
  }

  updateStartPoint(time?: number, value?: number): this {
    this.#data.updateStartPoint(time, value);
    return this;
  }

  updateEndPoint(time?: number, value?: number): this {
    this.#data.updateEndPoint(time, value);
    return this;
  }

  getEnvelopeData() {
    return {
      points: [...this.#data.points],
      loop: this.#loopEnabled,
    };
  }

  // Return the actual EnvelopeData instance for UI components
  getEnvelopeDataInstance(): EnvelopeData {
    return this.#data;
  }

  getSVGPath(width?: number, height?: number) {
    return this.#data.getSVGPath(width, height);
  }

  get durationNormalized() {
    return this.#data.durationNormalized;
  }

  get durationSeconds() {
    return this.#data.durationSeconds;
  }

  // ===== AUDIO OPERATIONS =====
  applyToAudioParam(
    audioParam: AudioParam,
    startTime: number,
    options: {
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
  ) {
    this.stopLooping();

    // ONLY conversion: timeRange to actual seconds
    const durationSeconds = this.#data.durationSeconds;

    if (this.#loopEnabled) {
      this.startLooping(audioParam, startTime, durationSeconds, options);
    } else {
      this.#scheduler.applyEnvelope(
        audioParam,
        this.#data,
        startTime,
        durationSeconds,
        options
      );
    }

    if (this.#loopEnabled) {
      // Calculate loop duration based on envelope duration
      this.startLooping(audioParam, startTime, durationSeconds, options);
    } else {
      this.#scheduler.applyEnvelope(
        audioParam,
        this.#data,
        startTime,
        durationSeconds,
        options
      );
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
    this.#scheduler.applyRelease(
      audioParam,
      startTime,
      duration,
      currentValue,
      targetValue
    );
  }

  startLooping(
    audioParam: AudioParam,
    startTime: number,
    loopDuration: number,
    options: {
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
  ) {
    this.stopLooping();
    this.#stopLoopFn = this.#scheduler.startLoop(
      audioParam,
      this.#data,
      startTime,
      loopDuration,
      { baseValue: options?.baseValue }
    );
  }

  stopLooping() {
    if (this.#stopLoopFn) {
      this.#stopLoopFn();
      this.#stopLoopFn = null;
    }
  }

  // ===== LOOP CONTROL =====
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

  get loopEnabled() {
    return this.#loopEnabled;
  }

  dispose() {
    this.stopLooping();
  }
}

// ===== VOICE ENVELOPE MANAGER - Voice-specific coordination =====
// Todo: Remove class if redundant, replace with factory function ?

const PITCH_ENV_RANGE = [0.5, 1.5] as [number, number];

export class SampleVoiceEnvelopes {
  #envelopes = new Map<EnvelopeType, CustomEnvelope>();
  #context: AudioContext;
  #worklet: AudioWorkletNode;
  #messages: MessageBus<Message>;
  #sampleDuration: number = 1; // Default normalized duration

  constructor(context: AudioContext, worklet: AudioWorkletNode) {
    this.#context = context;
    this.#worklet = worklet;
    this.#messages = createMessageBus<Message>('envelope-manager');

    this.createDefaultEnvelopes();
  }

  private createDefaultEnvelopes() {
    this.#envelopes.set(
      'amp-env',
      new CustomEnvelope(this.#context, 'amp-env', [
        { time: 0, value: 0, curve: 'exponential' },
        { time: 0.01, value: 1, curve: 'exponential' },
        { time: 1, value: 0.0, curve: 'exponential' },
      ])
    );

    this.#envelopes.set(
      'pitch-env',
      new CustomEnvelope(
        this.#context,
        'pitch-env',
        [
          { time: 0, value: 0.5, curve: 'exponential' },
          { time: 0.1, value: 0.5, curve: 'exponential' },
          { time: 1, value: 0.5, curve: 'exponential' },
        ],
        PITCH_ENV_RANGE
      )
    );
  }

  setSampleDuration(seconds: number) {
    this.#sampleDuration = seconds;

    // Update each envelope's timeRange to match sample duration
    this.#envelopes.forEach((envelope) => {
      envelope.getEnvelopeDataInstance().timeRange = [0, seconds];
    });
  }

  // ===== MAIN ENVELOPE CONTROL =====
  triggerEnvelopes(startTime: number, playbackRate: number) {
    // Apply amp envelope
    const ampEnv = this.#envelopes.get('amp-env');
    const envGainParam = this.#worklet.parameters.get('envGain');
    if (ampEnv && envGainParam) {
      ampEnv.applyToAudioParam(envGainParam, startTime);
    }

    // Apply pitch envelope (if enabled and not flat)
    const pitchEnv = this.#envelopes.get('pitch-env');
    const playbackRateParam = this.#worklet.parameters.get('playbackRate');
    if (pitchEnv && playbackRateParam && this.hasVariation(pitchEnv)) {
      // Pitch envelope modulates around the base playback rate
      pitchEnv.applyToAudioParam(playbackRateParam, startTime, {
        baseValue: playbackRate,
      });
    }

    this.sendUpstreamMessage('sample-voice-envelopes:trigger', {
      envDurations: {
        'amp-env': ampEnv?.durationSeconds ?? 1,
        'pitch-env': (pitchEnv?.durationSeconds ?? 1) / playbackRate,
      },
      loopEnabled: {
        'amp-env': ampEnv?.loopEnabled ?? false,
        'pitch-env': pitchEnv?.loopEnabled ?? false,
      },
    });
  }

  releaseEnvelopes(startTime: number, releaseDuration: number) {
    this.stopAllLoops();

    const ampEnv = this.#envelopes.get('amp-env');
    const envGainParam = this.#worklet.parameters.get('envGain');
    if (ampEnv && envGainParam) {
      const currentValue = envGainParam.value;
      ampEnv.applyReleaseToAudioParam(
        envGainParam,
        startTime,
        releaseDuration,
        currentValue
      );
    }
  }

  // ===== LOOP CONTROL =====
  setEnvelopeLoopEnabled(envType: EnvelopeType, enabled: boolean) {
    const envelope = this.#envelopes.get(envType);
    if (envelope) {
      envelope.setLoopEnabled(enabled);
    }
  }

  stopAllLoops() {
    this.#envelopes.forEach((env) => env.stopLooping());
  }

  // ===== ENVELOPE ACCESS =====
  getEnvelope(type: EnvelopeType): CustomEnvelope | undefined {
    return this.#envelopes.get(type);
  }

  getEnvDuration(type: EnvelopeType) {
    return this.#envelopes.get(type)?.durationNormalized;
  }

  addEnvelopePoint(envType: EnvelopeType, time: number, value: number) {
    const envelope = this.#envelopes.get(envType);
    envelope?.addPoint(time, value);
  }

  updateEnvelopePoint(
    envType: EnvelopeType,
    index: number,
    time?: number,
    value?: number
  ) {
    const envelope = this.#envelopes.get(envType);
    envelope?.updatePoint(index, time, value);
  }

  updateEnvelopeStartPoint(
    envType: EnvelopeType,
    time?: number,
    value?: number
  ) {
    const envelope = this.#envelopes.get(envType);
    envelope?.updateStartPoint(time, value);
  }

  updateEnvelopeEndPoint(envType: EnvelopeType, time?: number, value?: number) {
    const envelope = this.#envelopes.get(envType);
    envelope?.updateEndPoint(time, value);
  }

  deleteEnvelopePoint(envType: EnvelopeType, index: number) {
    const envelope = this.#envelopes.get(envType);
    envelope?.deletePoint(index);
  }

  // ===== MESSAGES =====

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  sendUpstreamMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
    return this;
  }

  // ===== UTILITIES =====
  private hasVariation(envelope: CustomEnvelope): boolean {
    const data = envelope.getEnvelopeData();
    const firstValue = data.points[0]?.value ?? 0;
    return data.points.some(
      (point) => Math.abs(point.value - firstValue) > 0.001
    );
  }

  dispose() {
    this.#envelopes.forEach((env) => env.dispose());
    this.#envelopes.clear();
  }
}
