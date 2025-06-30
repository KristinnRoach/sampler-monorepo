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
  #valueRange: [number, number];
  #durationSeconds: number = 1;
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

  // Todo; default to linear when logarithmic !?
  addPoint(
    time: number,
    value: number,
    curve: 'linear' | 'exponential' = this.#logarithmic
      ? 'linear'
      : 'exponential'
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

  debugCounter = 0;

  interpolateValueAtTime(normalizedTime: number): number {
    if (this.points.length === 0) return this.#valueRange[0];
    if (this.points.length === 1) {
      const [min, max] = this.#valueRange;
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
    const [min, max] = this.#valueRange;
    const result = min + normalizedValue * (max - min);

    return result;
  }

  #updateSharpTransitionsFlag() {
    const threshold = 0.02;
    this.#hasSharpTransitions = this.points.some(
      (point, i) =>
        i > 0 && Math.abs(point.time - this.points[i - 1].time) < threshold
    );
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

  get valueRange() {
    return this.#valueRange;
  }

  setValueRange = (range: [number, number]) => (this.#valueRange = range);

  get startTime() {
    return this.points[0]?.time ?? 0;
  }
  get endTime() {
    return this.points[this.points.length - 1]?.time ?? 1;
  }

  get durationNormalized() {
    return this.endTime - this.startTime;
  }

  setDurationSeconds(seconds: number) {
    this.#durationSeconds = seconds;
  }

  get durationSeconds() {
    return this.#durationSeconds * this.durationNormalized;
  }

  get hasSharpTransitions() {
    return this.#hasSharpTransitions;
  }
}

// ===== CUSTOM ENVELOPE  =====
export class CustomEnvelope {
  envelopeType: EnvelopeType;

  #data: EnvelopeData;
  #context: AudioContext;
  #stopLoopFn: (() => void) | null = null;
  #loopEnabled = false;
  #logarithmic = false;

  constructor(
    context: AudioContext,
    envelopeType: EnvelopeType,
    initialPoints: EnvelopePoint[] = [],
    valueRange: [number, number] = [0, 1],
    durationSeconds = 1,
    logarithmic = false
  ) {
    this.envelopeType = envelopeType;
    this.#context = context;
    this.#logarithmic = logarithmic;

    const finalRange: [number, number] = logarithmic
      ? [Math.log(valueRange[0]), Math.log(valueRange[1])]
      : valueRange;
    this.#context = context;

    this.#data = new EnvelopeData(
      [...initialPoints],
      finalRange,
      durationSeconds,
      logarithmic
    );

    // Bind data methods to this instance
    this.addPoint = this.#data.addPoint.bind(this.#data);
    this.updatePoint = this.#data.updatePoint.bind(this.#data);
    this.deletePoint = this.#data.deletePoint.bind(this.#data);
    this.updateStartPoint = this.#data.updateStartPoint.bind(this.#data);
    this.updateEndPoint = this.#data.updateEndPoint.bind(this.#data);
    this.getSVGPath = this.#data.getSVGPath.bind(this.#data);
    this.setValueRange = this.#data.setValueRange.bind(this.#data);
  }

  // Declare the bound methods (for TypeScript)
  addPoint!: EnvelopeData['addPoint'];
  updatePoint!: EnvelopeData['updatePoint'];
  deletePoint!: EnvelopeData['deletePoint'];
  updateStartPoint!: EnvelopeData['updateStartPoint'];
  updateEndPoint!: EnvelopeData['updateEndPoint'];
  getSVGPath!: EnvelopeData['getSVGPath'];
  setValueRange!: EnvelopeData['setValueRange'];

  // Property getters
  get data() {
    return this.#data;
  }

  get points() {
    return this.#data.points;
  }
  get durationNormalized() {
    return this.#data.durationNormalized;
  }
  get durationSeconds() {
    return this.#data.durationSeconds;
  }
  get valueRange() {
    return this.#data.valueRange;
  }

  get loopEnabled() {
    return this.#loopEnabled;
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
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
  ) {
    this.stopLooping();

    const durationSeconds = this.#data.durationSeconds;

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
    duration: number,
    options: {
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
  ) {
    const clearTime = Math.max(this.#context.currentTime, startTime - 0.001);
    audioParam.cancelScheduledValues(clearTime);

    // const sampleRate = this.#data.hasSharpTransitions
    //   ? 1000
    //   : duration < 1
    //     ? 500
    //     : 250;

    const sampleRate = this.#logarithmic
      ? duration < 1
        ? 1000
        : 750 // Higher rates for log curves
      : this.#data.hasSharpTransitions
        ? 1000
        : duration < 1
          ? 500
          : 250;

    const numSamples = Math.max(2, Math.floor(duration * sampleRate));
    const curve = new Float32Array(numSamples);

    const { baseValue: base, minValue: min, maxValue: max } = options;

    for (let i = 0; i < numSamples; i++) {
      const normalizedTime = i / (numSamples - 1);
      let value = this.#data.interpolateValueAtTime(normalizedTime);

      if (this.#logarithmic) {
        value = Math.exp(value);
      }

      let finalValue = (base ?? 1) * value;

      if (min !== undefined) finalValue = Math.max(finalValue, min);
      if (max !== undefined) finalValue = Math.min(max, finalValue);

      curve[i] = finalValue;
    }

    try {
      audioParam.setValueCurveAtTime(curve, startTime, duration);
    } catch (error) {
      console.debug('Failed to apply envelope curve due to rapid fire.');
      try {
        const currentValue = audioParam.value;
        audioParam.setValueAtTime(currentValue, startTime);
        audioParam.linearRampToValueAtTime(
          curve[curve.length - 1],
          startTime + duration
        );
      } catch (fallbackError) {
        try {
          audioParam.setValueAtTime(curve[curve.length - 1], startTime);
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

  #startLoop(
    audioParam: AudioParam,
    startTime: number,
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

      const currentDuration = this.#data.durationSeconds;

      this.#applyEnvelope(
        audioParam,
        currentCycleStart,
        currentDuration,
        options
      );

      currentCycleStart += currentDuration;
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
      baseValue?: number;
      minValue?: number;
      maxValue?: number;
    } = { baseValue: 1 }
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
}

export function createEnvelope(
  context: AudioContext,
  type: EnvelopeType,
  options: EnvelopeOptions = {}
): CustomEnvelope {
  const { durationSeconds = 1, points, valueRange } = options;

  // If custom points provided, use them
  if (points) {
    return new CustomEnvelope(
      context,
      type,
      points,
      valueRange,
      durationSeconds
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
          { time: 0.01, value: 1, curve: 'exponential' },
          { time: 1, value: 0.0, curve: 'exponential' },
        ],
        valueRange || [0, 1],
        durationSeconds
      );

    case 'pitch-env':
      return new CustomEnvelope(
        context,
        'pitch-env',
        [
          { time: 0, value: 0.5, curve: 'exponential' },
          { time: 1, value: 0.5, curve: 'exponential' },
        ],
        valueRange || [0.5, 1.5],
        durationSeconds
      );

    case 'filter-env':
      return new CustomEnvelope(
        context,
        'filter-env',
        [
          { time: 0, value: 0, curve: 'linear' },
          { time: 0.08, value: 1.0, curve: 'linear' },
          { time: 1, value: 0.5, curve: 'linear' },
        ],
        valueRange || [30, 18000],
        durationSeconds,
        true // logarithmic = true
      );

    default:
      throw new Error(`Unknown envelope type: ${type}`);
  }
}

// specific ones:
export function createAmpEnvelope(
  context: AudioContext,
  options: { type?: 'default' | 'percussive' | 'pad' } = {}
): CustomEnvelope {
  const { type = 'default' } = options;

  switch (type) {
    case 'percussive':
      return new CustomEnvelope(context, 'amp-env', [
        { time: 0, value: 0, curve: 'exponential' },
        { time: 0.005, value: 1, curve: 'exponential' },
        { time: 0.1, value: 0.0, curve: 'exponential' },
      ]);

    case 'default':
    default:
      return new CustomEnvelope(context, 'amp-env', [
        { time: 0, value: 0, curve: 'exponential' },
        { time: 0.01, value: 1, curve: 'exponential' },
        { time: 1, value: 0.0, curve: 'exponential' },
      ]);

    // more presets...
  }
}

export function createPitchEnvelope(
  context: AudioContext,
  options: { type?: 'default' } = {}
): CustomEnvelope {
  const { type = 'default' } = options;

  switch (type) {
    case 'default':
    default:
      return new CustomEnvelope(
        context,
        'pitch-env',
        [
          { time: 0, value: 0.5, curve: 'exponential' },
          { time: 1, value: 0.5, curve: 'exponential' },
        ],
        [0.5, 1.5]
      );
    // more presets...
  }
}

export function createDefaultEnvelopes(
  context: AudioContext,
  envTypes: EnvelopeType[]
): Map<EnvelopeType, CustomEnvelope> {
  const envelopes = new Map<EnvelopeType, CustomEnvelope>();

  envTypes.forEach((envType) => {
    switch (envType) {
      case 'amp-env':
        envelopes.set(
          'amp-env',
          new CustomEnvelope(context, 'amp-env', [
            { time: 0, value: 0, curve: 'exponential' },
            { time: 0.01, value: 1, curve: 'exponential' },
            { time: 1, value: 0.0, curve: 'exponential' },
          ])
        );
        break;

      case 'pitch-env':
        envelopes.set(
          'pitch-env',
          new CustomEnvelope(
            context,
            'pitch-env',
            [
              { time: 0, value: 0.5, curve: 'exponential' },
              { time: 0.1, value: 0.5, curve: 'exponential' },
              { time: 1, value: 0.5, curve: 'exponential' },
            ],
            [0.5, 1.5]
          )
        );
        break;

      // Add more envelope types here later
    }
  });

  return envelopes;
}

// ===== VOICE ENVELOPE MANAGER - Voice-specific coordination =====
// // Todo: Remove class if redundant, replace with factory function ?
// const PITCH_ENV_RANGE = [0.5, 1.5] as [number, number];

// export class SampleVoiceEnvelopes {
//   #envelopes = new Map<EnvelopeType, CustomEnvelope>();
//   #context: AudioContext;
//   #worklet: AudioWorkletNode;
//   #messages: MessageBus<Message>;

//   #sampleDuration: number = 0;

//   setSampleDuration = (seconds: number) => {
//     this.#sampleDuration = seconds;
//     this.#envelopes.forEach((env) => env.setSampleDuration(seconds));
//   };

//   constructor(context: AudioContext, worklet: AudioWorkletNode) {
//     this.#context = context;
//     this.#worklet = worklet;
//     this.#messages = createMessageBus<Message>('envelope-manager');

//     this.createDefaultEnvelopes();
//   }

//   private createDefaultEnvelopes() {
//     this.#envelopes.set(
//       'amp-env',
//       new CustomEnvelope(this.#context, 'amp-env', [
//         { time: 0, value: 0, curve: 'exponential' },
//         { time: 0.01, value: 1, curve: 'exponential' },
//         { time: 1, value: 0.0, curve: 'exponential' },
//       ])
//     );

//     this.#envelopes.set(
//       'pitch-env',
//       new CustomEnvelope(
//         this.#context,
//         'pitch-env',
//         [
//           { time: 0, value: 0.5, curve: 'exponential' },
//           { time: 0.1, value: 0.5, curve: 'exponential' },
//           { time: 1, value: 0.5, curve: 'exponential' },
//         ],
//         PITCH_ENV_RANGE
//       )
//     );
//   }

//   // ===== MAIN ENVELOPE CONTROL =====
//   triggerEnvelopes(startTime: number, playbackRate: number) {
//     const ampEnv = this.#envelopes.get('amp-env');
//     const envGainParam = this.#worklet.parameters.get('envGain');

//     this.setSampleDuration(this.#sampleDuration / playbackRate);

//     // Apply amp envelope
//     if (ampEnv && envGainParam) {
//       ampEnv.applyToAudioParam(envGainParam, startTime);
//     }

//     const pitchEnv = this.#envelopes.get('pitch-env');
//     const playbackRateParam = this.#worklet.parameters.get('playbackRate');

//     // Apply pitch envelope (if enabled and not flat)
//     if (pitchEnv && playbackRateParam && this.hasVariation(pitchEnv)) {
//       //  modulates around the base playback rate
//       pitchEnv.applyToAudioParam(playbackRateParam, startTime, {
//         baseValue: playbackRate,
//       });
//     }

//     this.sendUpstreamMessage('sample-envelopes:trigger', {
//       envDurations: {
//         'amp-env': ampEnv?.durationSeconds ?? 1 / playbackRate,
//         'pitch-env': pitchEnv?.durationSeconds ?? 1 / playbackRate,
//       },
//       loopEnabled: {
//         'amp-env': ampEnv?.loopEnabled ?? false,
//         'pitch-env': pitchEnv?.loopEnabled ?? false,
//       },
//     });
//   }

//   releaseEnvelopes(startTime: number, releaseDuration: number) {
//     this.stopAllLoops();

//     const ampEnv = this.#envelopes.get('amp-env');
//     const envGainParam = this.#worklet.parameters.get('envGain');
//     if (ampEnv && envGainParam) {
//       const currentValue = envGainParam.value;
//       ampEnv.applyReleaseToAudioParam(
//         envGainParam,
//         startTime,
//         releaseDuration,
//         currentValue
//       );
//     }
//   }

//   // ===== LOOP CONTROL =====
//   setEnvelopeLoopEnabled(envType: EnvelopeType, enabled: boolean) {
//     const envelope = this.#envelopes.get(envType);
//     if (envelope) {
//       envelope.setLoopEnabled(enabled);
//     }
//   }

//   stopAllLoops() {
//     this.#envelopes.forEach((env) => env.stopLooping());
//   }

//   // ===== ENVELOPE ACCESS =====
//   getEnvelope(type: EnvelopeType): CustomEnvelope | undefined {
//     return this.#envelopes.get(type);
//   }

//   getEnvelopeDurationSeconds(type: EnvelopeType) {
//     return this.#envelopes.get(type)?.durationSeconds;
//   }

//   addEnvelopePoint(envType: EnvelopeType, time: number, value: number) {
//     const envelope = this.#envelopes.get(envType);
//     envelope?.addPoint(time, value);
//   }

//   updateEnvelopePoint(
//     envType: EnvelopeType,
//     index: number,
//     time?: number,
//     value?: number
//   ) {
//     const envelope = this.#envelopes.get(envType);
//     if (!envelope) return;
//     envelope?.updatePoint(index, time, value);

//     const endIndex = envelope.numPoints - 1;
//     if (index === 0 || index === endIndex) {
//       // this.notifyDurationChange();
//     }
//   }

//   updateEnvelopeStartPoint(
//     envType: EnvelopeType,
//     time?: number,
//     value?: number
//   ) {
//     const envelope = this.#envelopes.get(envType);
//     envelope?.updateStartPoint(time, value);
//   }

//   updateEnvelopeEndPoint(envType: EnvelopeType, time?: number, value?: number) {
//     const envelope = this.#envelopes.get(envType);
//     envelope?.updateEndPoint(time, value);
//   }

//   deleteEnvelopePoint(envType: EnvelopeType, index: number) {
//     const envelope = this.#envelopes.get(envType);
//     envelope?.deletePoint(index);
//   }

//   // ===== MESSAGES =====

//   onMessage(type: string, handler: MessageHandler<Message>): () => void {
//     return this.#messages.onMessage(type, handler);
//   }

//   sendUpstreamMessage(type: string, data: any) {
//     this.#messages.sendMessage(type, data);
//     return this;
//   }

//   // ===== UTILITIES =====
//   private hasVariation(envelope: CustomEnvelope): boolean {
//     const points = envelope.points;
//     const firstValue = points[0]?.value ?? 0;
//     return points.some((point) => Math.abs(point.value - firstValue) > 0.001);
//   }

//   dispose() {
//     this.#envelopes.forEach((env) => env.dispose());
//     this.#envelopes.clear();
//   }
// }
