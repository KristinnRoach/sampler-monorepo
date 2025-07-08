var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _SamplePlayerProcessor_instances, handleMessage_fn, resetState_fn, stop_fn, _clamp, _clampZeroCrossing, findNearestZeroCrossing_fn, normalizedToSamples_fn, samplesToNormalized_fn, midiVelocityToGain_fn, getBufferLengthSamples_fn, getBufferDurationSeconds_fn, extractPositionParams_fn, calculatePlaybackRange_fn, calculateLoopRange_fn;
class ValueSnapper {
  constructor() {
    this.allowedValues = [];
    this.allowedPeriods = [];
  }
  setAllowedValues(values) {
    this.allowedValues = [...values].sort((a, b) => a - b);
  }
  setAllowedPeriods(periods) {
    this.allowedPeriods = [...periods].sort((a, b) => a - b);
  }
  snapToValue(target) {
    if (this.allowedValues.length === 0) return target;
    return this.allowedValues.reduce(
      (prev, curr) => Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
    );
  }
  snapToMusicalPeriod(periodToSnap) {
    if (this.allowedPeriods.length === 0) return periodToSnap;
    const closestPeriod = this.allowedPeriods.reduce(
      (prev, curr) => Math.abs(curr - periodToSnap) < Math.abs(prev - periodToSnap) ? curr : prev
    );
    return closestPeriod;
  }
  get hasValueSnapping() {
    return this.allowedValues.length > 0;
  }
  get hasPeriodSnapping() {
    return this.allowedPeriods.length > 0;
  }
  get longestPeriod() {
    return this.allowedPeriods[this.allowedPeriods.length - 1] || 0;
  }
}
class SamplePlayerProcessor extends AudioWorkletProcessor {
  // ===== CONSTRUCTOR =====
  constructor() {
    super();
    __privateAdd(this, _SamplePlayerProcessor_instances);
    __privateAdd(this, _clamp, (value, min, max) => Math.max(min, Math.min(max, value)));
    __privateAdd(this, _clampZeroCrossing, (value) => __privateGet(this, _clamp).call(this, value, this.minZeroCrossing, this.maxZeroCrossing));
    this.buffer = null;
    this.snapper = new ValueSnapper();
    this.playbackPosition = 0;
    this.transpositionPlaybackrate = 1;
    this.loopCount = 0;
    this.maxLoopCount = Number.MAX_SAFE_INTEGER;
    this.isPlaying = false;
    this.startTime = 0;
    this.startPoint = 0;
    this.scheduledEndTime = null;
    this.minZeroCrossing = 0;
    this.maxZeroCrossing = 0;
    this.isReleasing = false;
    this.loopEnabled = false;
    this.usePlaybackPosition = false;
    this.blockQuantizedLoopStart = 0;
    this.blockQuantizedLoopEnd = 0;
    this.lastProcessedLoopStart = -1;
    this.lastProcessedLoopEnd = -1;
    this.port.onmessage = __privateMethod(this, _SamplePlayerProcessor_instances, handleMessage_fn).bind(this);
    this.debugCounter = 0;
  }
  // ===== PARAMETER DESCRIPTORS =====
  static get parameterDescriptors() {
    return [
      {
        name: "playbackPosition",
        defaultValue: 0,
        minValue: 0,
        maxValue: 99999,
        automationRate: "k-rate"
      },
      {
        name: "envGain",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "k-rate"
      },
      {
        name: "velocity",
        defaultValue: 100,
        minValue: 0,
        maxValue: 127,
        automationRate: "k-rate"
      },
      {
        name: "playbackRate",
        defaultValue: 1,
        minValue: 0.1,
        maxValue: 8,
        automationRate: "k-rate"
      },
      // NOTE: Time based params always use seconds
      {
        name: "loopStart",
        defaultValue: 0,
        minValue: 0,
        maxValue: 99999,
        // Max sample length in seconds
        automationRate: "k-rate"
      },
      {
        name: "loopEnd",
        defaultValue: 99999,
        // Will be set to actual buffer duration when loaded
        minValue: 0,
        maxValue: 99999,
        automationRate: "k-rate"
      },
      {
        name: "startPoint",
        defaultValue: 0,
        minValue: 0,
        maxValue: 9999,
        // Max sample length in seconds
        automationRate: "k-rate"
      },
      {
        name: "endPoint",
        defaultValue: 9999,
        // Will be set to actual buffer duration when loaded
        minValue: 0,
        maxValue: 9999,
        automationRate: "k-rate"
      }
    ];
  }
  // ===== MAIN PROCESS METHOD =====
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    this.debugCounter++;
    if (!output || !this.isPlaying || !this.buffer) {
      return true;
    }
    const positionParams = __privateMethod(this, _SamplePlayerProcessor_instances, extractPositionParams_fn).call(this, parameters);
    const playbackRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculatePlaybackRange_fn).call(this, positionParams);
    const loopRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculateLoopRange_fn).call(this, positionParams, playbackRange, parameters);
    if (this.playbackPosition === 0) {
      this.playbackPosition = playbackRange.startSamples;
    }
    const playbackRate = parameters.playbackRate[0];
    const envelopeGain = parameters.envGain[0];
    const velocityGain = __privateMethod(this, _SamplePlayerProcessor_instances, midiVelocityToGain_fn).call(this, parameters.velocity[0]);
    const velocitySensitivity = 0.9;
    const finalVelocityGain = velocityGain * velocitySensitivity;
    const numChannels = Math.min(output.length, this.buffer.length);
    for (let i = 0; i < output[0].length; i++) {
      if (this.loopEnabled && this.playbackPosition >= loopRange.loopEndSamples && this.loopCount < this.maxLoopCount) {
        this.port.postMessage({
          type: "voice:looped",
          count: this.loopCount,
          timestamp: currentTime,
          playbackPosition: this.playbackPosition,
          loopEndSamples: loopRange.loopEndSamples,
          loopStartSamples: loopRange.loopStartSamples
        });
        this.playbackPosition = loopRange.loopStartSamples;
        this.loopCount++;
      }
      if (this.playbackPosition >= playbackRange.endSamples) {
        __privateMethod(this, _SamplePlayerProcessor_instances, stop_fn).call(this);
        return true;
      }
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, playbackRange.endSamples - 1);
      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position] || 0;
        const next = bufferChannel[nextPosition] || 0;
        const interpolatedSample = current + fraction * (next - current);
        const finalSample = interpolatedSample * finalVelocityGain * envelopeGain;
        output[c][i] = Math.max(
          -1,
          Math.min(1, isFinite(finalSample) ? finalSample : 0)
        );
      }
      this.playbackPosition += playbackRate * this.transpositionPlaybackrate;
    }
    if (this.usePlaybackPosition) {
      const normalizedPosition = __privateMethod(this, _SamplePlayerProcessor_instances, samplesToNormalized_fn).call(this, this.playbackPosition);
      this.port.postMessage({
        type: "voice:position",
        position: normalizedPosition
      });
    }
    return true;
  }
}
_SamplePlayerProcessor_instances = new WeakSet();
// ===== MESSAGE HANDLING =====
handleMessage_fn = function(event) {
  const {
    type,
    value,
    buffer,
    timestamp,
    durationSeconds,
    zeroCrossings,
    semitones,
    allowedPeriods
  } = event.data;
  switch (type) {
    case "voice:init":
      __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
      this.port.postMessage({ type: "initialized" });
      break;
    case "voice:set_buffer":
      __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
      this.buffer = null;
      this.buffer = buffer;
      this.port.postMessage({
        type: "voice:loaded",
        durationSeconds,
        time: currentTime
      });
      break;
    case "transpose":
      this.transpositionPlaybackrate = Math.pow(2, semitones / 12);
      this.port.postMessage({
        type: "voice:transposed",
        semitones,
        time: currentTime
      });
      break;
    case "voice:set_zero_crossings":
      this.zeroCrossings = (zeroCrossings || []).map(
        (timeSec) => timeSec * sampleRate
      );
      if (this.zeroCrossings.length > 0) {
        this.minZeroCrossing = this.zeroCrossings[0];
        this.maxZeroCrossing = this.zeroCrossings[this.zeroCrossings.length - 1];
      }
      break;
    case "setAllowedPeriods":
      const periodsInSamples = allowedPeriods.map(
        (periodSec) => periodSec * sampleRate
      );
      this.snapper.setAllowedPeriods(periodsInSamples);
      break;
    case "voice:start":
      this.isReleasing = false;
      this.isPlaying = true;
      this.loopCount = 0;
      this.startTime = timestamp || currentTime;
      this.playbackPosition = 0;
      this.port.postMessage({
        type: "voice:started",
        time: timestamp || currentTime
      });
      break;
    case "voice:release":
      this.isReleasing = true;
      this.port.postMessage({
        type: "voice:releasing",
        time: currentTime
      });
      break;
    case "voice:stop":
      __privateMethod(this, _SamplePlayerProcessor_instances, stop_fn).call(this);
      break;
    case "setLoopEnabled":
      this.loopEnabled = value;
      this.port.postMessage({
        type: "loop:enabled"
      });
      break;
    case "voice:usePlaybackPosition":
      this.usePlaybackPosition = value;
      break;
  }
};
// ===== METHODS =====
resetState_fn = function() {
  this.isPlaying = false;
  this.isReleasing = false;
  this.startTime = 0;
  this.startPoint = 0;
  this.scheduledEndTime = null;
  this.playbackPosition = 0;
  this.loopCount = 0;
  this.maxLoopCount = Number.MAX_SAFE_INTEGER;
};
stop_fn = function() {
  this.isPlaying = false;
  this.isReleasing = false;
  this.playbackPosition = 0;
  this.port.postMessage({ type: "voice:stopped" });
};
_clamp = new WeakMap();
_clampZeroCrossing = new WeakMap();
findNearestZeroCrossing_fn = function(position, maxDistance = null) {
  if (!this.zeroCrossings || this.zeroCrossings.length === 0) {
    return position;
  }
  const closest = this.zeroCrossings.reduce(
    (prev, curr) => Math.abs(curr - position) < Math.abs(prev - position) ? curr : prev,
    this.zeroCrossings[0]
  );
  if (maxDistance !== null && Math.abs(closest - position) > maxDistance) {
    return position;
  }
  return closest;
};
// ===== CONVERSION UTILITIES =====
/**
 * Convert normalized position (0-1) to sample index
 * @param {number} normalizedPosition - Position as 0-1 value
 * @returns {number} - Sample index
 */
normalizedToSamples_fn = function(normalizedPosition) {
  if (!this.buffer || !this.buffer[0]) return 0;
  return normalizedPosition * this.buffer[0].length;
};
/**
 * Convert sample index to normalized position (0-1)
 * @param {number} sampleIndex - Sample index
 * @returns {number} - Normalized position 0-1
 */
samplesToNormalized_fn = function(sampleIndex) {
  if (!this.buffer || !this.buffer[0]) return 0;
  return sampleIndex / this.buffer[0].length;
};
/**
 * Convert MIDI velocity (0-127) to gain multiplier (0-1)
 * @param {number} midiVelocity - MIDI velocity 0-127
 * @returns {number} - Gain multiplier 0-1
 */
midiVelocityToGain_fn = function(midiVelocity) {
  return Math.max(0, Math.min(1, midiVelocity / 127));
};
/**
 * Get buffer length in samples
 * @returns {number} - Buffer length in samples
 */
getBufferLengthSamples_fn = function() {
  var _a, _b;
  return ((_b = (_a = this.buffer) == null ? void 0 : _a[0]) == null ? void 0 : _b.length) || 0;
};
/**
 * Get buffer duration in seconds
 * @returns {number} - Buffer duration in seconds
 */
getBufferDurationSeconds_fn = function() {
  return __privateMethod(this, _SamplePlayerProcessor_instances, getBufferLengthSamples_fn).call(this) / sampleRate;
};
/**
 * Extract and convert all position parameters from seconds to samples
 * @param {Object} parameters - AudioWorkletProcessor parameters
 * @returns {Object} - Converted parameters in samples
 */
extractPositionParams_fn = function(parameters) {
  const samples = {
    startPointSamples: Math.floor(parameters.startPoint[0] * sampleRate),
    endPointSamples: Math.floor(parameters.endPoint[0] * sampleRate),
    loopStartSamples: Math.floor(parameters.loopStart[0] * sampleRate),
    loopEndSamples: Math.floor(parameters.loopEnd[0] * sampleRate)
  };
  return samples;
};
/**
 * Calculate effective playback range in samples
 * @param {Object} params - Position parameters from #extractPositionParams
 * @returns {Object} - Effective start and end positions
 */
calculatePlaybackRange_fn = function(params) {
  const bufferLength = __privateMethod(this, _SamplePlayerProcessor_instances, getBufferLengthSamples_fn).call(this);
  const start = Math.max(0, params.startPointSamples);
  const end = params.endPointSamples > start ? Math.min(bufferLength, params.endPointSamples) : bufferLength;
  const snappedStart = start;
  const snappedEnd = end;
  return {
    startSamples: snappedStart,
    endSamples: snappedEnd,
    durationSamples: snappedEnd - snappedStart
  };
};
/**
 * Calculate effective loop range in samples
 * @param {Object} params - Position parameters from #extractPositionParams
 * @param {Object} playbackRange - Range from #calculatePlaybackRange
 * @returns {Object} - Effective loop start and end positions
 */
calculateLoopRange_fn = function(params, playbackRange, originalParams) {
  const lpStart = params.loopStartSamples;
  const lpEnd = params.loopEndSamples;
  let calcLoopStart = lpStart < lpEnd && lpStart >= 0 ? lpStart : playbackRange.startSamples;
  let calcLoopEnd = lpEnd > lpStart && lpEnd < playbackRange.endSamples ? lpEnd : playbackRange.endSamples;
  const loopDuration = calcLoopEnd - calcLoopStart;
  return {
    loopStartSamples: calcLoopStart,
    loopEndSamples: calcLoopEnd,
    loopDurationSamples: loopDuration
  };
};
registerProcessor("sample-player-processor", SamplePlayerProcessor);
class RandomNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1;
      }
    });
    return true;
  }
}
registerProcessor("random-noise-processor", RandomNoiseProcessor);
registerProcessor(
  "feedback-delay-processor",
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: "gain",
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
          automationRate: "k-rate"
        },
        // ? minValue used to be -1, why ?
        {
          name: "delayTime",
          defaultValue: 10,
          minValue: 0,
          maxValue: 1e3,
          automationRate: "k-rate"
        }
      ];
    }
    constructor() {
      super();
      this.Buffer = new Array(48e3).fill(0);
      this.ReadPtr = 0, this.WritePtr = 0;
    }
    process(inputs, outputs, parameters) {
      let delaySamples = Math.round(
        sampleRate * parameters.delayTime[0] / 1e3
      ), bufferSize = this.Buffer.length;
      for (let i = 0; i < outputs[0][0].length; ++i) {
        outputs[0][0][i] = parameters.gain[0] * this.Buffer[this.ReadPtr] + inputs[0][0][i];
        this.Buffer[this.WritePtr] = outputs[0][0][i];
        this.WritePtr++;
        if (this.WritePtr >= bufferSize)
          this.WritePtr = this.WritePtr - bufferSize;
        this.ReadPtr = this.WritePtr - delaySamples;
        if (this.ReadPtr < 0) this.ReadPtr = this.ReadPtr + bufferSize;
      }
      return true;
    }
  }
);
