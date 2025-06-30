var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _SamplePlayerProcessor_instances, normalizedToSamples_fn, samplesToNormalized_fn, normalizedToSeconds_fn, midiVelocityToGain_fn, getBufferLengthSamples_fn, getBufferDurationSeconds_fn, extractPositionParams_fn, calculatePlaybackRange_fn, calculateLoopRange_fn, handleMessage_fn, resetState_fn, stop_fn, _clamp, _clampZeroCrossing, findNearestZeroCrossing_fn;
class SamplePlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    __privateAdd(this, _SamplePlayerProcessor_instances);
    // #shouldEnd(parameters) {
    //   const shouldEnd =
    //     !this.buffer ||
    //     !this.buffer.length ||
    //     !this.isPlaying ||
    //     (this.scheduledEndTime !== null && currentTime >= this.scheduledEndTime);
    //   // if (shouldEnd) {
    //   //   console.log('PROCESSOR: Ending because:', {
    //   //     noBuffer: !this.buffer,
    //   //     noBufferLength: !this.buffer?.length,
    //   //     notPlaying: !this.isPlaying,
    //   //     timeExpired:
    //   //       this.scheduledEndTime !== null &&
    //   //       currentTime >= this.scheduledEndTime,
    //   //     currentTime,
    //   //     scheduledEndTime: this.scheduledEndTime,
    //   //   });
    //   // }
    //   return shouldEnd;
    // }
    __privateAdd(this, _clamp, (value, min, max) => Math.max(min, Math.min(max, value)));
    __privateAdd(this, _clampZeroCrossing, (value) => __privateGet(this, _clamp).call(this, value, this.minZeroCrossing, this.maxZeroCrossing));
    this.buffer = null;
    this.playbackPosition = 0;
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
  }
  // ===== PARAMETER DESCRIPTORS =====
  static get parameterDescriptors() {
    return [
      {
        name: "playbackPosition",
        defaultValue: 0,
        minValue: 0,
        // ???
        maxValue: 1e3,
        // ???
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
        // ? normalize ?
        minValue: 0,
        maxValue: 127,
        automationRate: "k-rate"
      },
      {
        name: "playbackRate",
        defaultValue: 1,
        minValue: -8,
        // ? test negative
        maxValue: 8,
        // ? test
        automationRate: "k-rate"
        // ! a or k ?
      },
      {
        name: "startPoint",
        // start & end points are normalized
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "k-rate"
      },
      {
        name: "endPoint",
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        automationRate: "k-rate"
      },
      {
        name: "loopStart",
        defaultValue: 0,
        // ? normalize ?
        minValue: 0,
        // maxValue: 1,
        automationRate: "k-rate"
        // a or k ?
      },
      {
        name: "loopEnd",
        defaultValue: 1,
        // ? normalize ?
        minValue: 0,
        // maxValue: 1,
        automationRate: "k-rate"
        // a or k ?
      }
    ];
  }
  // ===== MAIN PROCESS METHOD =====
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !this.isPlaying || !this.buffer) {
      return true;
    }
    const positionParams = __privateMethod(this, _SamplePlayerProcessor_instances, extractPositionParams_fn).call(this, parameters);
    const playbackRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculatePlaybackRange_fn).call(this, positionParams);
    const loopRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculateLoopRange_fn).call(this, positionParams, playbackRange);
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
      if (this.loopEnabled && this.playbackPosition >= loopRange.endSamples && this.loopCount < this.maxLoopCount) {
        this.playbackPosition = loopRange.startSamples;
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
      this.playbackPosition += playbackRate;
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
  // process(inputs, outputs, parameters) {
  //   const output = outputs[0];
  //   if (!output || !this.isPlaying) {
  //     return true;
  //   }
  //   // If this is the first process call after starting playback,
  //   // initialize playback position using startPoint
  //   if (this.playbackPosition === 0) {
  //     const startPointSec = parameters.startPoint[0];
  //     this.playbackPosition = startPointSec * sampleRate;
  //   }
  //   const pbRate = parameters.playbackRate[0];
  //   // Get start and end offsets from parameters and convert to samples
  //   const startPointSec = parameters.startPoint[0];
  //   const endPointSec = parameters.endPoint[0];
  //   // Convert to samples
  //   const startPointSamples = startPointSec * sampleRate;
  //   // Handle end offset - if endPoint is set (greater than 0), use it to limit playback
  //   const bufferLength = this.buffer[0].length;
  //   let effectiveBufferEnd = bufferLength;
  //   if (endPointSec > 0) {
  //     effectiveBufferEnd = Math.min(bufferLength, endPointSec * sampleRate);
  //   }
  //   // Quantize once per block, not per sample
  //   const rawLoopStart = parameters.loopStart[0] * sampleRate;
  //   const rawLoopEnd = parameters.loopEnd[0] * sampleRate;
  //   const loopStart = rawLoopStart;
  //   const loopEnd = rawLoopEnd;
  //   const constrainedLoopEnd = Math.min(loopEnd, effectiveBufferEnd);
  //   const envelopeGain = parameters.envGain[0];
  //   const velocitySensitivity = 0.9;
  //   const normalizedVelocity = this.#normalizeMidi(parameters.velocity[0]);
  //   const velocityGain = normalizedVelocity * velocitySensitivity;
  //   const numChannels = Math.min(output.length, this.buffer.length);
  //   // Process samples
  //   for (let i = 0; i < output[0].length; i++) {
  //     // Handle looping
  //     if (
  //       this.loopEnabled &&
  //       this.playbackPosition >= constrainedLoopEnd &&
  //       this.loopCount < this.maxLoopCount
  //     ) {
  //       this.playbackPosition = loopStart;
  //       this.loopCount++;
  //     }
  //     // Check for end of buffer or effective end position
  //     if (this.playbackPosition >= effectiveBufferEnd) {
  //       this.#stop(output);
  //       return true;
  //     }
  //     // Read and interpolate samples
  //     const position = Math.floor(this.playbackPosition);
  //     const fraction = this.playbackPosition - position;
  //     const nextPosition = Math.min(position + 1, effectiveBufferEnd - 1);
  //     for (let c = 0; c < numChannels; c++) {
  //       const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
  //       const current = bufferChannel[position];
  //       const next = bufferChannel[nextPosition];
  //       // output[c][i] =
  //       //   (current + fraction * (next - current)) * velocityGain * envelopeGain;
  //       const sample =
  //         (current + fraction * (next - current)) * velocityGain * envelopeGain;
  //       output[c][i] = Math.max(-1, Math.min(1, isFinite(sample) ? sample : 0));
  //     }
  //     // Advance playback position
  //     this.playbackPosition += pbRate;
  //   }
  //   if (this.usePlaybackPosition) {
  //     this.port.postMessage({
  //       type: 'voice:position',
  //       position: this.playbackPosition / sampleRate,
  //     });
  //   }
  //   return true;
  // }
}
_SamplePlayerProcessor_instances = new WeakSet();
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
 * Convert normalized time (0-1) to absolute seconds based on buffer duration
 * @param {number} normalizedTime - Time as 0-1 value
 * @returns {number} - Time in seconds
 */
normalizedToSeconds_fn = function(normalizedTime) {
  if (!this.buffer || !this.buffer[0]) return 0;
  const bufferDurationSec = this.buffer[0].length / sampleRate;
  return normalizedTime * bufferDurationSec;
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
 * Extract and convert all position parameters from normalized to samples
 * @param {Object} parameters - AudioWorkletProcessor parameters
 * @returns {Object} - Converted parameters in samples
 */
extractPositionParams_fn = function(parameters) {
  return {
    startPointSamples: __privateMethod(this, _SamplePlayerProcessor_instances, normalizedToSamples_fn).call(this, parameters.startPoint[0]),
    endPointSamples: __privateMethod(this, _SamplePlayerProcessor_instances, normalizedToSamples_fn).call(this, parameters.endPoint[0]),
    loopStartSamples: __privateMethod(this, _SamplePlayerProcessor_instances, normalizedToSamples_fn).call(this, parameters.loopStart[0]),
    loopEndSamples: __privateMethod(this, _SamplePlayerProcessor_instances, normalizedToSamples_fn).call(this, parameters.loopEnd[0])
  };
};
/**
 * Calculate effective playback range in samples
 * @param {Object} params - Position parameters from #extractPositionParams
 * @returns {Object} - Effective start and end positions
 */
calculatePlaybackRange_fn = function(params) {
  const bufferLength = __privateMethod(this, _SamplePlayerProcessor_instances, getBufferLengthSamples_fn).call(this);
  const effectiveStart = Math.max(0, params.startPointSamples);
  const effectiveEnd = params.endPointSamples > 0 ? Math.min(bufferLength, params.endPointSamples) : bufferLength;
  return {
    startSamples: effectiveStart,
    endSamples: effectiveEnd,
    durationSamples: effectiveEnd - effectiveStart
  };
};
/**
 * Calculate effective loop range in samples
 * @param {Object} params - Position parameters from #extractPositionParams
 * @param {Object} playbackRange - Range from #calculatePlaybackRange
 * @returns {Object} - Effective loop start and end positions
 */
calculateLoopRange_fn = function(params, playbackRange) {
  const loopStart = params.loopStartSamples > 0 ? Math.max(playbackRange.startSamples, params.loopStartSamples) : playbackRange.startSamples;
  const loopEnd = params.loopEndSamples > 0 ? Math.min(playbackRange.endSamples, params.loopEndSamples) : playbackRange.endSamples;
  return {
    startSamples: loopStart,
    endSamples: loopEnd,
    durationSamples: loopEnd - loopStart
  };
};
// #normalizeMidi(midiValue) {
//   const norm = midiValue / 127;
//   return Math.max(0, Math.min(1, norm));
// }
// #getParamValueInSamples(paramName, parameters) {
//   if (!parameters || !parameters[paramName]) return 0;
//   let valueInSamples = parameters[paramName][0] * sampleRate;
//   // Apply zero crossing constraint for "buffer-position" parameters
//   if (paramName === 'loopStart' || paramName === 'loopEnd') {
//     return this.#findNearestZeroCrossing(valueInSamples);
//   }
//   return valueInSamples;
// }
// ===== MESSAGE HANDLING =====
handleMessage_fn = function(event) {
  const { type, value, buffer, startPoint, duration, when, zeroCrossings } = event.data;
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
        duration,
        // send back the received duration
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
    case "voice:start":
      this.isReleasing = false;
      this.isPlaying = true;
      this.loopCount = 0;
      this.startTime = when || currentTime;
      this.playbackPosition = 0;
      this.port.postMessage({
        type: "voice:started",
        time: currentTime
      });
      break;
    // case 'voice:start':
    //   this.isReleasing = false;
    //   this.isPlaying = true;
    //   this.loopCount = 0;
    //   this.startTime = when || currentTime;
    //   this.playbackPosition = this.startPoint * sampleRate;
    //   if (duration) {
    //     // todo: remove or use
    //     this.scheduledEndTime = this.startTime + duration;
    //     const paramendPoint = parameters['endPoint'][0];
    //     if (paramendPoint > 0) {
    //       // If endPoint is set, use it to calculate scheduled end time
    //       const effectiveDuration = paramendPoint - this.startPoint;
    //       if (effectiveDuration > 0) {
    //         this.scheduledEndTime = this.startTime + effectiveDuration;
    //       } else {
    //         this.scheduledEndTime = null;
    //       }
    //     } else {
    //       this.scheduledEndTime = null;
    //     }
    //   }
    //   this.port.postMessage({
    //     type: 'voice:started',
    //     time: currentTime,
    //     actualstartPoint: this.startPoint,
    //   });
    //   break;
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
