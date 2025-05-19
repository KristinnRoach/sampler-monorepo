var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _SamplePlayerProcessor_instances, handleMessage_fn, resetState_fn, onended_fn, shouldEnd_fn, _clamp, _clampZeroCrossing, findNearestZeroCrossing_fn, getCurrentParamValue_fn, normalizeMidi_fn;
const MIN_ABS_AMPLITUDE = 0.05;
class SamplePlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    __privateAdd(this, _SamplePlayerProcessor_instances);
    __privateAdd(this, _clamp, (value, min, max) => Math.max(min, Math.min(max, value)));
    __privateAdd(this, _clampZeroCrossing, (value) => __privateGet(this, _clamp).call(this, value, this.minZeroCrossing, this.maxZeroCrossing));
    this.buffer = null;
    this.playbackPosition = 0;
    this.loopCount = 0;
    this.maxLoopCount = Number.MAX_SAFE_INTEGER;
    this.isPlaying = false;
    this.startTime = 0;
    this.startOffset = 0;
    this.scheduledEndTime = null;
    this.minZeroCrossing = 0;
    this.maxZeroCrossing = 0;
    this.isReleasing = false;
    this.loopEnabled = false;
    this.usePlaybackPosition = false;
    this.port.onmessage = __privateMethod(this, _SamplePlayerProcessor_instances, handleMessage_fn).bind(this);
  }
  static get parameterDescriptors() {
    return [
      {
        name: "playbackPosition",
        defaultValue: 0,
        minValue: -1e3,
        maxValue: 1e3,
        automationRate: "k-rate"
      },
      {
        name: "envGain",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "k-rate"
        // a-rate ?
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
        minValue: -4,
        maxValue: 4,
        automationRate: "a-rate"
      },
      {
        name: "startOffset",
        defaultValue: 0,
        minValue: 0,
        automationRate: "k-rate"
      },
      {
        name: "endOffset",
        defaultValue: 0,
        minValue: 0,
        automationRate: "k-rate"
      },
      {
        name: "loopStart",
        defaultValue: 0,
        minValue: 0,
        automationRate: "k-rate"
        // a-rate ?
      },
      {
        name: "loopEnd",
        defaultValue: 0,
        minValue: 0,
        automationRate: "k-rate"
        // a-rate ?
      }
    ];
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || __privateMethod(this, _SamplePlayerProcessor_instances, shouldEnd_fn).call(this, parameters)) {
      __privateMethod(this, _SamplePlayerProcessor_instances, onended_fn).call(this, output);
      return true;
    }
    if (this.isPlaying && this.playbackPosition === 0) {
      const startOffsetSec2 = parameters.startOffset[0];
      this.playbackPosition = startOffsetSec2 * sampleRate;
    }
    const pbRate = parameters.playbackRate[0];
    const startOffsetSec = parameters.startOffset[0];
    const endOffsetSec = parameters.endOffset[0];
    startOffsetSec * sampleRate;
    const bufferLength = this.buffer[0].length;
    let effectiveBufferEnd = bufferLength;
    if (endOffsetSec > 0) {
      effectiveBufferEnd = Math.min(bufferLength, endOffsetSec * sampleRate);
    }
    let loopStartReq = parameters.loopStart[0] * sampleRate;
    const loopStart = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, loopStartReq);
    const loopEndReq = parameters.loopEnd[0] * sampleRate;
    const loopEnd = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, loopEndReq);
    const envelopeGain = parameters.envGain[0];
    const velocitySensitivity = 0.9;
    const normalizedVelocity = __privateMethod(this, _SamplePlayerProcessor_instances, normalizeMidi_fn).call(this, parameters.velocity[0]);
    const velocityGain = normalizedVelocity * velocitySensitivity;
    const numChannels = Math.min(output.length, this.buffer.length);
    for (let i = 0; i < output[0].length; i++) {
      if (this.loopEnabled && this.playbackPosition >= loopEnd && this.loopCount < this.maxLoopCount) {
        this.playbackPosition = loopStart;
        this.loopCount++;
      }
      if (this.playbackPosition >= effectiveBufferEnd) {
        __privateMethod(this, _SamplePlayerProcessor_instances, onended_fn).call(this, output);
        return true;
      }
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, effectiveBufferEnd - 1);
      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position];
        const next = bufferChannel[nextPosition];
        output[c][i] = (current + fraction * (next - current)) * velocityGain * envelopeGain;
      }
      this.playbackPosition += pbRate;
    }
    if (this.usePlaybackPosition) {
      this.port.postMessage({
        type: "voice:position",
        position: this.playbackPosition / sampleRate
      });
    }
    return true;
  }
}
_SamplePlayerProcessor_instances = new WeakSet();
handleMessage_fn = function(event) {
  const { type, value, buffer, startOffset, duration, when, zeroCrossings } = event.data;
  switch (type) {
    case "voice:init":
      __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
      break;
    case "voice:set_buffer":
      __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
      this.buffer = null;
      this.buffer = buffer;
      break;
    case "voice:set_zero_crossings":
      this.zeroCrossings = zeroCrossings || [];
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
      this.playbackPosition = this.startOffset * sampleRate;
      if (duration) {
        this.scheduledEndTime = this.startTime + duration;
        const paramEndOffset = __privateMethod(this, _SamplePlayerProcessor_instances, getCurrentParamValue_fn).call(this, "endOffset");
        if (paramEndOffset > 0) {
          const effectiveDuration = paramEndOffset - this.startOffset;
          if (effectiveDuration > 0) {
            this.scheduledEndTime = this.startTime + effectiveDuration;
          } else {
            this.scheduledEndTime = null;
          }
        } else {
          this.scheduledEndTime = null;
        }
      }
      this.port.postMessage({
        type: "voice:started",
        time: currentTime,
        actualStartOffset: this.startOffset
      });
      break;
    case "voice:release":
      this.isReleasing = true;
      break;
    case "voice:stop":
      this.isPlaying = false;
      break;
    case "setLoopEnabled":
      this.loopEnabled = value;
      break;
    case "voice:usePlaybackPosition":
      this.usePlaybackPosition = value;
      break;
  }
};
resetState_fn = function() {
  this.isPlaying = false;
  this.isReleasing = false;
  this.startTime = 0;
  this.startOffset = 0;
  this.scheduledEndTime = null;
  this.playbackPosition = 0;
  this.loopCount = 0;
  this.maxLoopCount = Number.MAX_SAFE_INTEGER;
};
onended_fn = function(output) {
  this.isPlaying = false;
  this.isReleasing = false;
  this.playbackPosition = 0;
  this.port.postMessage({ type: "voice:ended" });
};
shouldEnd_fn = function(parameters) {
  return !this.buffer || !this.buffer.length || !this.isPlaying || this.scheduledEndTime !== null && currentTime >= this.scheduledEndTime || this.isReleasing && parameters.envGain[0] <= MIN_ABS_AMPLITUDE;
};
_clamp = new WeakMap();
_clampZeroCrossing = new WeakMap();
findNearestZeroCrossing_fn = function(position) {
  if (!this.zeroCrossings || this.zeroCrossings.length === 0) {
    return position;
  }
  return this.zeroCrossings.reduce(
    (prev, curr) => Math.abs(curr - position) < Math.abs(prev - position) ? curr : prev,
    position
  );
};
getCurrentParamValue_fn = function(paramName) {
  if (!this.parameters) return 0;
  const param = this.parameters.get(paramName);
  if (!param) return 0;
  return param.value || 0;
};
normalizeMidi_fn = function(midiValue) {
  const norm = midiValue / 127;
  return Math.max(0, Math.min(1, norm));
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
        { name: "gain", defaultValue: 0.9, minValue: -1, maxValue: 1 },
        { name: "delayTime", defaultValue: 10, minValue: 0, maxValue: 1e3 }
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
