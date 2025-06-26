// import { LibNode, NodeType } from '@/nodes/LibNode';
// import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
// import { ENV_DEFAULTS } from './env-defaults';
import { EnvelopePoint, EnvelopeType } from './env-types';

// ===== ENVELOPE DATA - Pure data operations =====
export class EnvelopeData {
  constructor(
    public points: EnvelopePoint[] = [],
    public range: [number, number] = [0, 1]
  ) {}

  addPoint(
    time: number,
    value: number,
    curve: 'linear' | 'exponential' = 'linear'
  ) {
    const newPoint = { time, value, curve };
    const insertIndex = this.points.findIndex((p) => p.time > time);

    if (insertIndex === -1) {
      this.points.push(newPoint);
    } else {
      this.points.splice(insertIndex, 0, newPoint);
    }
  }

  updatePoint(index: number, time: number, value: number) {
    if (index >= 0 && index < this.points.length) {
      this.points[index] = { ...this.points[index], time, value };
    }
  }

  deletePoint(index: number) {
    if (index > 0 && index < this.points.length - 1) {
      this.points.splice(index, 1);
    }
  }

  interpolateValueAtTime(normalizedTime: number): number {
    if (this.points.length === 0) return this.range[0];
    if (this.points.length === 1) {
      const [min, max] = this.range; // Scale to range
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
    const [min, max] = this.range;
    return min + normalizedValue * (max - min);
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
  get duration() {
    return this.endTime - this.startTime;
  }
}

// ===== ENVELOPE SCHEDULER - Web Audio operations =====
export class EnvelopeScheduler {
  constructor(private context: AudioContext) {}

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

    // Currently testing to find optimal sample-rate. Increase if not smooth enough.
    const sampleRate = duration < 1 ? 200 : 100;
    const numSamples = Math.max(2, Math.floor(duration * sampleRate));
    const curve = new Float32Array(numSamples);

    const { baseValue: base, minValue: min, maxValue: max } = options;

    for (let i = 0; i < numSamples; i++) {
      const normalizedTime = i / (numSamples - 1);
      const value = envelopeData.interpolateValueAtTime(normalizedTime);
      let finalValue = base ?? 1 * value;

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
        (currentCycleStart - this.context.currentTime) * 1000;

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
  private data: EnvelopeData;
  private scheduler: EnvelopeScheduler;
  private stopLoopFn: (() => void) | null = null;
  private _loopEnabled = false;

  constructor(
    context: AudioContext,
    public envelopeType: EnvelopeType,
    initialPoints: EnvelopePoint[] = [],
    range: [number, number] = [0, 1]
  ) {
    this.data = new EnvelopeData([...initialPoints], range);
    this.scheduler = new EnvelopeScheduler(context);
  }

  // ===== DATA OPERATIONS =====
  addPoint(time: number, value: number, curve?: 'linear' | 'exponential') {
    this.data.addPoint(time, value, curve);
  }

  updatePoint(index: number, time: number, value: number) {
    this.data.updatePoint(index, time, value);
  }

  deletePoint(index: number) {
    this.data.deletePoint(index);
  }

  getEnvelopeData() {
    return {
      points: [...this.data.points],
      loop: this._loopEnabled,
    };
  }

  // Return the actual EnvelopeData instance for UI components
  getEnvelopeDataInstance(): EnvelopeData {
    return this.data;
  }

  getSVGPath(width?: number, height?: number) {
    return this.data.getSVGPath(width, height);
  }

  // ===== AUDIO OPERATIONS =====
  applyToAudioParam(
    audioParam: AudioParam,
    startTime: number,
    duration: number,
    options: {
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
  ) {
    this.stopLooping();

    if (this._loopEnabled) {
      // Calculate loop duration based on envelope duration
      const loopDuration = duration * this.data.duration;
      this.startLooping(audioParam, startTime, loopDuration, options);
    } else {
      this.scheduler.applyEnvelope(
        audioParam,
        this.data,
        startTime,
        duration,
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
    this.scheduler.applyRelease(
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
    this.stopLoopFn = this.scheduler.startLoop(
      audioParam,
      this.data,
      startTime,
      loopDuration,
      { baseValue: options?.baseValue }
    );
  }

  stopLooping() {
    if (this.stopLoopFn) {
      this.stopLoopFn();
      this.stopLoopFn = null;
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

    this._loopEnabled = enabled;
  };

  get loopEnabled() {
    return this._loopEnabled;
  }

  dispose() {
    this.stopLooping();
  }
}

// ===== VOICE ENVELOPE MANAGER - Voice-specific coordination =====
// Todo: Remove class if redundant, replace with factory function ?

const PITCH_ENV_RANGE = [0.5, 1.5] as [number, number];

export class SampleVoiceEnvelopes {
  private envelopes = new Map<EnvelopeType, CustomEnvelope>();

  constructor(
    private context: AudioContext,
    private worklet: AudioWorkletNode
  ) {
    this.createDefaultEnvelopes();
  }

  private createDefaultEnvelopes() {
    // Amp envelope - classic ADSR shape
    this.envelopes.set(
      'amp-env',
      new CustomEnvelope(this.context, 'amp-env', [
        { time: 0, value: 0, curve: 'exponential' },
        { time: 0.01, value: 1, curve: 'exponential' },
        { time: 1, value: 0.0, curve: 'exponential' },
      ])
    );

    // Pitch envelope - subtle pitch bend
    this.envelopes.set(
      'pitch-env',
      new CustomEnvelope(
        this.context,
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

  // ===== MAIN ENVELOPE CONTROL =====
  triggerEnvelopes(
    startTime: number,
    sampleDuration: number,
    playbackRate: number
  ) {
    const actualDuration = sampleDuration / playbackRate;

    // Apply amp envelope
    const ampEnv = this.envelopes.get('amp-env');
    const envGainParam = this.worklet.parameters.get('envGain');
    if (ampEnv && envGainParam) {
      ampEnv.applyToAudioParam(envGainParam, startTime, actualDuration);
    }

    // Apply pitch envelope (if enabled and not flat)
    const pitchEnv = this.envelopes.get('pitch-env');
    const playbackRateParam = this.worklet.parameters.get('playbackRate');
    if (pitchEnv && playbackRateParam && this.hasVariation(pitchEnv)) {
      // Pitch envelope modulates around the base playback rate
      pitchEnv.applyToAudioParam(playbackRateParam, startTime, actualDuration, {
        baseValue: playbackRate,
      });
    }
  }

  releaseEnvelopes(startTime: number, releaseDuration: number) {
    // Stop all loops first
    this.stopAllLoops();

    // Apply release to amp envelope
    const ampEnv = this.envelopes.get('amp-env');
    const envGainParam = this.worklet.parameters.get('envGain');
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
    const envelope = this.envelopes.get(envType);
    if (envelope) {
      envelope.setLoopEnabled(enabled);
    }
  }

  stopAllLoops() {
    this.envelopes.forEach((env) => env.stopLooping());
  }

  // ===== ENVELOPE ACCESS =====
  getEnvelope(type: EnvelopeType): CustomEnvelope | undefined {
    return this.envelopes.get(type);
  }

  addEnvelopePoint(envType: EnvelopeType, time: number, value: number) {
    const envelope = this.envelopes.get(envType);
    envelope?.addPoint(time, value);
  }

  updateEnvelopePoint(
    envType: EnvelopeType,
    index: number,
    time: number,
    value: number
  ) {
    const envelope = this.envelopes.get(envType);
    envelope?.updatePoint(index, time, value);
  }

  deleteEnvelopePoint(envType: EnvelopeType, index: number) {
    const envelope = this.envelopes.get(envType);
    envelope?.deletePoint(index);
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
    this.envelopes.forEach((env) => env.dispose());
    this.envelopes.clear();
  }
}

// ===== EXAMPLE INTEGRATION IN SAMPLEVOICE =====
/*
In SampleVoice constructor:
this.envelopes = new SampleVoiceEnvelopes(context, this.#worklet);

In trigger():
this.envelopes.triggerEnvelopes(timestamp, this.#sampleDurationSeconds, playbackRate);

In release():
this.envelopes.releaseEnvelopes(timestamp, releaseDuration);

For independent loop control:
this.envelopes.setEnvelopeLoopEnabled('amp-env', true);
this.envelopes.setEnvelopeLoopEnabled('pitch-env', false);

For UI access:
getEnvelope(envType: EnvelopeType) {
  return this.envelopes.getEnvelope(envType);
}
*/
