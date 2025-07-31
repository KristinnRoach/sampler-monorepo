var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _SamplePlayerProcessor_instances, handleMessage_fn, resetState_fn, stop_fn, _clamp, _clampZeroCrossing, findNearestZeroCrossing_fn, normalizedToSamples_fn, samplesToNormalized_fn, midiVelocityToGain_fn, getBufferDurationSeconds_fn, extractPositionParams_fn, calculatePlaybackRange_fn, calculateLoopRange_fn, getSafeParam_fn, getConstantFlags_fn;
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
    this.applyClickCompensation = false;
    this.loopClickCompensation = 0;
    this.isReleasing = false;
    this.loopEnabled = false;
    this.lockTrimToloop = false;
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
        name: "masterGain",
        defaultValue: 1,
        minValue: 0,
        maxValue: 2,
        automationRate: "k-rate"
      },
      {
        name: "envGain",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "a-rate"
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
        automationRate: "a-rate"
      },
      // NOTE: Time based params use seconds
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
      },
      {
        name: "playbackPosition",
        defaultValue: 0,
        minValue: 0,
        maxValue: 99999,
        automationRate: "k-rate"
      }
    ];
  }
  // ===== MAIN PROCESS METHOD =====
  process(inputs, outputs, parameters) {
    var _a, _b;
    const output = outputs[0];
    this.debugCounter++;
    if (!output || !this.isPlaying || !((_b = (_a = this.buffer) == null ? void 0 : _a[0]) == null ? void 0 : _b.length)) {
      return true;
    }
    const positionParams = __privateMethod(this, _SamplePlayerProcessor_instances, extractPositionParams_fn).call(this, parameters);
    const playbackRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculatePlaybackRange_fn).call(this, positionParams);
    const loopRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculateLoopRange_fn).call(this, positionParams, playbackRange, parameters);
    if (this.playbackPosition === 0 || this.playbackPosition < playbackRange.startSamples) {
      this.playbackPosition = playbackRange.startSamples;
    }
    const masterGain = parameters.masterGain[0];
    const velocityGain = __privateMethod(this, _SamplePlayerProcessor_instances, midiVelocityToGain_fn).call(this, parameters.velocity[0]) * this.velocitySensitivity;
    const numChannels = Math.min(output.length, this.buffer.length);
    const isConstant = __privateMethod(this, _SamplePlayerProcessor_instances, getConstantFlags_fn).call(this, parameters);
    for (let i = 0; i < output[0].length; i++) {
      const envelopeGain = __privateMethod(this, _SamplePlayerProcessor_instances, getSafeParam_fn).call(this, parameters.envGain, i, isConstant.envGain);
      const playbackRate = __privateMethod(this, _SamplePlayerProcessor_instances, getSafeParam_fn).call(this, parameters.playbackRate, i, isConstant.playbackRate);
      if (this.loopEnabled && this.loopCount < this.maxLoopCount) {
        if (this.playbackPosition >= loopRange.loopEndSamples) {
          const lastLoopSample = this.buffer[0][Math.floor(this.playbackPosition - 1)] || 0;
          const newFirstSample = this.buffer[0][Math.floor(loopRange.loopStartSamples)] || 0;
          this.loopClickCompensation = (lastLoopSample - newFirstSample) * 0.5;
          this.applyClickCompensation = true;
          this.playbackPosition = loopRange.loopStartSamples;
          this.loopCount++;
        }
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
        let interpolatedSample = current + fraction * (next - current);
        if (this.applyClickCompensation) {
          interpolatedSample += this.loopClickCompensation;
          this.applyClickCompensation = false;
        }
        const finalSample = interpolatedSample * velocityGain * envelopeGain * masterGain;
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
    case "lock:trimToloop":
      this.lockTrimToloop = true;
      break;
    case "unlock:trimToLoop":
      this.lockTrimToloop = false;
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
  this.velocitySensitivity = 0.5;
  this.applyClickCompensation = false;
  this.loopClickCompensation = 0;
  this.lockTrimToloop = false;
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
 * Get buffer duration in seconds
 * @returns {number} - Buffer duration in seconds
 */
getBufferDurationSeconds_fn = function() {
  var _a, _b;
  return (((_b = (_a = this.buffer) == null ? void 0 : _a[0]) == null ? void 0 : _b.length) || 0) / sampleRate;
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
  var _a, _b;
  const bufferLength = ((_b = (_a = this.buffer) == null ? void 0 : _a[0]) == null ? void 0 : _b.length) || 0;
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
  let calcLoopEnd = lpEnd > lpStart && lpEnd <= playbackRange.endSamples ? lpEnd : playbackRange.endSamples;
  const loopDuration = calcLoopEnd - calcLoopStart;
  return {
    loopStartSamples: calcLoopStart,
    loopEndSamples: calcLoopEnd,
    loopDurationSamples: loopDuration
  };
};
getSafeParam_fn = function(paramArray, index, isConstant) {
  return isConstant ? paramArray[0] : paramArray[Math.min(index, paramArray.length - 1)];
};
getConstantFlags_fn = function(parameters) {
  return Object.fromEntries(
    Object.keys(parameters).map((key) => [key, parameters[key].length === 1])
  );
};
registerProcessor("sample-player-processor", SamplePlayerProcessor);
class RandomNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.previousNoise = 0;
    this.previousFiltered = 0;
    this.hpfHz = 150;
    this.alpha = this.hpfHz / (this.hpfHz + sampleRate / (2 * Math.PI));
    this.port.onmessage = (event) => {
      if (event.data.type === "setHpfHz") {
        this.hpfHz = event.data.value;
        this.alpha = this.calculateAlpha(this.hpfHz);
      }
    };
  }
  calculateAlpha(frequency) {
    return frequency / (frequency + sampleRate / (2 * Math.PI));
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        const noise = Math.random() * 2 - 1;
        const filtered = this.alpha * (noise - this.previousNoise) + this.previousFiltered;
        this.previousNoise = noise;
        this.previousFiltered = filtered;
        channel[i] = filtered;
      }
    });
    return true;
  }
}
registerProcessor("random-noise-processor", RandomNoiseProcessor);
const compressSingleSample = (input, threshold = 0.75, ratio = 4, limiter = { enabled: true, outputRange: { min: -1, max: 1 } }) => {
  const { min, max } = limiter.outputRange;
  let x = input;
  if (Math.abs(x) > threshold) {
    x = Math.sign(x) * (threshold + (Math.abs(x) - threshold) / ratio);
  }
  if (limiter.enabled) {
    x = Math.max(min, Math.min(max, x));
  }
  return x;
};
class DelayBuffer {
  constructor(maxDelaySamples) {
    this.buffer = new Array(maxDelaySamples).fill(0);
    this.writePtr = 0;
    this.readPtr = 0;
  }
  write(sample) {
    this.buffer[this.writePtr] = sample;
  }
  read() {
    return this.buffer[this.readPtr];
  }
  updatePointers(delaySamples) {
    this.writePtr = (this.writePtr + 1) % this.buffer.length;
    this.readPtr = (this.writePtr - delaySamples + this.buffer.length) % this.buffer.length;
  }
}
const SAFETY_GAIN_COMPENSATION = 0.05;
const AUTO_GAIN_THRESHOLD = 0.8;
class FeedbackDelay {
  constructor(sampleRate2) {
    this.sampleRate = sampleRate2;
    this.buffers = [];
    this.initialized = false;
    this.autoGainEnabled = true;
    this.gainCompensation = SAFETY_GAIN_COMPENSATION;
  }
  initializeBuffers(channelCount) {
    this.buffers = [];
    const maxSamples = Math.floor(this.sampleRate);
    for (let c = 0; c < channelCount; c++) {
      this.buffers[c] = new DelayBuffer(maxSamples);
    }
    this.initialized = true;
  }
  process(inputSample, channelIndex, feedbackAmount, delayTime) {
    if (!this.initialized) return inputSample;
    const buffer = this.buffers[channelIndex] || this.buffers[0];
    const delaySamples = Math.floor(this.sampleRate * delayTime);
    const delayedSample = buffer.read();
    const feedbackSample = feedbackAmount * delayedSample + inputSample;
    const compressedFeedback = compressSingleSample(feedbackSample, 0.75, 3, {
      enabled: true,
      // Hard limiter enabled
      outputRange: { min: -0.999, max: 0.999 }
    });
    let outputSample = compressedFeedback;
    if (this.autoGainEnabled && feedbackAmount > AUTO_GAIN_THRESHOLD) {
      const safetyReduction = 1 - (feedbackAmount - AUTO_GAIN_THRESHOLD) * this.gainCompensation;
      outputSample = compressedFeedback * safetyReduction;
    }
    return { outputSample, feedbackSample: compressedFeedback, delaySamples };
  }
  updateBuffer(channelIndex, sample, delaySamples) {
    const buffer = this.buffers[channelIndex] || this.buffers[0];
    buffer.write(sample);
    buffer.updatePointers(delaySamples);
  }
  setAutoGain(enabled, compensation = SAFETY_GAIN_COMPENSATION) {
    this.autoGainEnabled = enabled;
    this.gainCompensation = compensation;
  }
}
registerProcessor(
  "feedback-delay-processor",
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: "feedbackAmount",
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
          automationRate: "k-rate"
        },
        {
          name: "delayTime",
          defaultValue: 0.5,
          minValue: 12656238799684143e-20,
          // <- B natural in seconds (highest note period that works)
          maxValue: 4,
          automationRate: "k-rate"
        },
        {
          name: "decay",
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          automationRate: "k-rate"
        }
      ];
    }
    constructor() {
      super();
      this.feedbackDelay = new FeedbackDelay(sampleRate);
      this.decayStartTime = null;
      this.decayActive = false;
      this.baseFeedbackAmount = 0.5;
      this.setupMessageHandling();
    }
    setupMessageHandling() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
          case "setAutoGain":
            this.feedbackDelay.setAutoGain(
              event.data.enabled,
              event.data.amount
            );
            break;
          case "triggerDecay":
            this.decayStartTime = currentTime;
            this.decayActive = true;
            this.baseFeedbackAmount = event.data.baseFeedbackAmount || 0.5;
            break;
          case "stopDecay":
            this.decayActive = false;
            this.decayStartTime = null;
            break;
        }
      };
    }
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      if (!input || !output) return true;
      if (!this.feedbackDelay.initialized || this.feedbackDelay.buffers.length !== input.length) {
        this.feedbackDelay.initializeBuffers(input.length);
      }
      const baseFeedbackAmount = parameters.feedbackAmount[0];
      const delayTime = parameters.delayTime[0];
      const decay = parameters.decay[0];
      const channelCount = Math.min(input.length, output.length);
      const frameCount = output[0].length;
      for (let i = 0; i < frameCount; ++i) {
        let effectiveFeedbackAmount = baseFeedbackAmount;
        if (this.decayActive && this.decayStartTime !== null) {
          const elapsedTime = currentTime - this.decayStartTime + i / sampleRate;
          const delayCompensation = Math.min(5, 0.5 / delayTime);
          const timeConstant = Math.pow(decay, 5) * 1e3 * delayCompensation + 0.5;
          const decayFactor = Math.exp(-elapsedTime / timeConstant);
          effectiveFeedbackAmount = baseFeedbackAmount * decayFactor;
          if (effectiveFeedbackAmount < 1e-3) {
            this.decayActive = false;
            effectiveFeedbackAmount = 0;
          }
        }
        for (let c = 0; c < channelCount; c++) {
          const processed = this.feedbackDelay.process(
            input[c][i],
            c,
            effectiveFeedbackAmount,
            delayTime
          );
          output[c][i] = processed.outputSample;
          this.feedbackDelay.updateBuffer(
            c,
            processed.feedbackSample,
            processed.delaySamples
          );
        }
      }
      return true;
    }
  }
);
class DattorroReverb extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      ["preDelay", 0, 0, sampleRate - 1, "k-rate"],
      ["bandwidth", 0.9999, 0, 1, "k-rate"],
      ["inputDiffusion1", 0.75, 0, 1, "k-rate"],
      ["inputDiffusion2", 0.625, 0, 1, "k-rate"],
      ["decay", 0.5, 0, 1, "k-rate"],
      ["decayDiffusion1", 0.7, 0, 0.999999, "k-rate"],
      ["decayDiffusion2", 0.5, 0, 0.999999, "k-rate"],
      ["damping", 5e-3, 0, 1, "k-rate"],
      ["excursionRate", 0.5, 0, 2, "k-rate"],
      ["excursionDepth", 0.7, 0, 2, "k-rate"],
      ["wet", 0.3, 0, 1, "k-rate"],
      ["dry", 0.6, 0, 1, "k-rate"]
    ].map(
      (x) => new Object({
        name: x[0],
        defaultValue: x[1],
        minValue: x[2],
        maxValue: x[3],
        automationRate: x[4]
      })
    );
  }
  constructor(options) {
    super(options);
    this._Delays = [];
    this._pDLength = sampleRate + (128 - sampleRate % 128);
    this._preDelay = new Float32Array(this._pDLength);
    this._pDWrite = 0;
    this._lp1 = 0;
    this._lp2 = 0;
    this._lp3 = 0;
    this._excPhase = 0;
    [
      4771345e-9,
      3595309e-9,
      0.012734787,
      9307483e-9,
      0.022579886,
      0.149625349,
      0.060481839,
      0.1249958,
      0.030509727,
      0.141695508,
      0.089244313,
      0.106280031
    ].forEach((x) => this.makeDelay(x));
    this._taps = Int16Array.from(
      [
        8937872e-9,
        0.099929438,
        0.064278754,
        0.067067639,
        0.066866033,
        6283391e-9,
        0.035818689,
        0.011861161,
        0.121870905,
        0.041262054,
        0.08981553,
        0.070931756,
        0.011256342,
        4065724e-9
      ],
      (x) => Math.round(x * sampleRate)
    );
  }
  makeDelay(length) {
    let len = Math.round(length * sampleRate);
    let nextPow2 = 2 ** Math.ceil(Math.log2(len));
    this._Delays.push([
      new Float32Array(nextPow2),
      len - 1,
      // ? or should be 0 ?
      0 | 0,
      // ? or should be len - 1 ?
      nextPow2 - 1
    ]);
  }
  writeDelay(index, data) {
    return this._Delays[index][0][this._Delays[index][1]] = data;
  }
  readDelay(index) {
    return this._Delays[index][0][this._Delays[index][2]];
  }
  readDelayAt(index, i) {
    let d = this._Delays[index];
    return d[0][d[2] + i & d[3]];
  }
  // cubic interpolation
  // O. Niemitalo: https://www.musicdsp.org/en/latest/Other/49-cubic-interpollation.html
  readDelayCAt(index, i) {
    let d = this._Delays[index], frac = i - ~~i, int = ~~i + d[2] - 1, mask = d[3];
    let x0 = d[0][int++ & mask], x1 = d[0][int++ & mask], x2 = d[0][int++ & mask], x3 = d[0][int & mask];
    let a = (3 * (x1 - x2) - x0 + x3) / 2, b = 2 * x2 + x0 - (5 * x1 + x3) / 2, c = (x2 - x0) / 2;
    return ((a * frac + b) * frac + c) * frac + x1;
  }
  // First input will be downmixed to mono if number of channels is not 2
  // Outputs Stereo.
  process(inputs, outputs, parameters) {
    const TWO_PI = 6.283185307179586;
    const TWO_PI_DETUNE = 6.284702653297906;
    const pd = ~~parameters.preDelay[0], bw = parameters.bandwidth[0], fi = parameters.inputDiffusion1[0], si = parameters.inputDiffusion2[0], dc = parameters.decay[0], ft = parameters.decayDiffusion1[0], st = parameters.decayDiffusion2[0], dp = 1 - parameters.damping[0], ex = parameters.excursionRate[0] / sampleRate, ed = parameters.excursionDepth[0] * sampleRate / 1e3, we = parameters.wet[0] * 0.6, dr = parameters.dry[0];
    if (inputs[0].length == 2) {
      for (let i2 = 127; i2 >= 0; i2--) {
        this._preDelay[this._pDWrite + i2] = (inputs[0][0][i2] + inputs[0][1][i2]) * 0.5;
        outputs[0][0][i2] = inputs[0][0][i2] * dr;
        outputs[0][1][i2] = inputs[0][1][i2] * dr;
      }
    } else if (inputs[0].length > 0) {
      this._preDelay.set(inputs[0][0], this._pDWrite);
      for (let i2 = 127; i2 >= 0; i2--)
        outputs[0][0][i2] = outputs[0][1][i2] = inputs[0][0][i2] * dr;
    } else {
      this._preDelay.set(new Float32Array(128), this._pDWrite);
    }
    let i = 0 | 0;
    while (i < 128) {
      let lo = 0, ro = 0;
      this._lp1 += bw * (this._preDelay[(this._pDLength + this._pDWrite - pd + i) % this._pDLength] - this._lp1);
      let pre = this.writeDelay(0, this._lp1 - fi * this.readDelay(0));
      pre = this.writeDelay(
        1,
        fi * (pre - this.readDelay(1)) + this.readDelay(0)
      );
      pre = this.writeDelay(
        2,
        fi * pre + this.readDelay(1) - si * this.readDelay(2)
      );
      pre = this.writeDelay(
        3,
        si * (pre - this.readDelay(3)) + this.readDelay(2)
      );
      let split = si * pre + this.readDelay(3);
      let exc = ed * (1 + Math.cos(this._excPhase * TWO_PI));
      let exc2 = ed * (1 + Math.sin(this._excPhase * TWO_PI_DETUNE));
      let temp = this.writeDelay(
        4,
        split + dc * this.readDelay(11) + ft * this.readDelayCAt(4, exc)
      );
      this.writeDelay(5, this.readDelayCAt(4, exc) - ft * temp);
      this._lp2 += dp * (this.readDelay(5) - this._lp2);
      temp = this.writeDelay(6, dc * this._lp2 - st * this.readDelay(6));
      this.writeDelay(7, this.readDelay(6) + st * temp);
      temp = this.writeDelay(
        8,
        split + dc * this.readDelay(7) + ft * this.readDelayCAt(8, exc2)
      );
      this.writeDelay(9, this.readDelayCAt(8, exc2) - ft * temp);
      this._lp3 += dp * (this.readDelay(9) - this._lp3);
      temp = this.writeDelay(10, dc * this._lp3 - st * this.readDelay(10));
      this.writeDelay(11, this.readDelay(10) + st * temp);
      lo = this.readDelayAt(9, this._taps[0]) + this.readDelayAt(9, this._taps[1]) - this.readDelayAt(10, this._taps[2]) + this.readDelayAt(11, this._taps[3]) - this.readDelayAt(5, this._taps[4]) - this.readDelayAt(6, this._taps[5]) - this.readDelayAt(7, this._taps[6]);
      ro = this.readDelayAt(5, this._taps[7]) + this.readDelayAt(5, this._taps[8]) - this.readDelayAt(6, this._taps[9]) + this.readDelayAt(7, this._taps[10]) - this.readDelayAt(9, this._taps[11]) - this.readDelayAt(10, this._taps[12]) - this.readDelayAt(11, this._taps[13]);
      outputs[0][0][i] += lo * we;
      outputs[0][1][i] += ro * we;
      this._excPhase += ex;
      if (this._excPhase >= 1) this._excPhase -= 1;
      i++;
      const delays = this._Delays;
      for (let j = 0; j < delays.length; j++) {
        const d = delays[j];
        d[1] = d[1] + 1 & d[3];
        d[2] = d[2] + 1 & d[3];
      }
    }
    this._pDWrite = (this._pDWrite + 128) % this._pDLength;
    return true;
  }
}
registerProcessor("dattorro-reverb-processor", DattorroReverb);
class Distortion {
  constructor() {
    this.limitingMode = "hard-clipping";
  }
  applyDrive(sample, driveAmount) {
    if (driveAmount <= 0) return sample;
    const driveMultiplier = 1 + driveAmount * 3;
    const tameGainScalar = 0.95;
    const drivenSample = sample * driveMultiplier * tameGainScalar;
    return drivenSample;
  }
  applyClipping(sample, clippingAmount, clipThreshold) {
    if (clippingAmount <= 0) return sample;
    let clippedSample;
    switch (this.limitingMode) {
      case "soft-clipping":
        clippedSample = clipThreshold * Math.tanh(sample / clipThreshold);
        break;
      case "hard-clipping":
        clippedSample = Math.max(
          -clipThreshold,
          Math.min(clipThreshold, sample)
        );
        break;
      case "bypass":
      default:
        clippedSample = sample;
        break;
    }
    const makeupGain = 1 / Math.max(clipThreshold, 0.1);
    clippedSample *= makeupGain;
    return sample * (1 - clippingAmount) + clippedSample * clippingAmount;
  }
  setLimitingMode(mode) {
    this.limitingMode = mode;
  }
}
registerProcessor(
  "distortion-processor",
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: "distortionDrive",
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          automationRate: "a-rate"
        },
        {
          name: "clippingAmount",
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          automationRate: "a-rate"
        },
        {
          name: "clippingThreshold",
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
          automationRate: "k-rate"
        }
      ];
    }
    constructor() {
      super();
      this.distortion = new Distortion();
      this.setupMessageHandling();
    }
    setupMessageHandling() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
          case "setLimitingMode":
            this.distortion.setLimitingMode(event.data.mode);
            break;
          default:
            console.warn("distortion-processor: Unsupported message");
            break;
        }
      };
    }
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      if (!input || !output) return true;
      const clipThreshold = parameters.clippingThreshold[0];
      for (let i = 0; i < output[0].length; ++i) {
        const distortionDrive = parameters.distortionDrive[Math.min(i, parameters.distortionDrive.length - 1)];
        const clippingAmount = parameters.clippingAmount[Math.min(i, parameters.clippingAmount.length - 1)];
        for (let c = 0; c < Math.min(input.length, output.length); c++) {
          let sample = input[c][i];
          sample = this.distortion.applyDrive(sample, distortionDrive);
          sample = this.distortion.applyClipping(
            sample,
            clippingAmount,
            clipThreshold
          );
          output[c][i] = Math.max(-0.999, Math.min(0.999, sample));
        }
      }
      return true;
    }
  }
);
registerProcessor(
  "envelope-follower-processor",
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: "inputGain",
          // linear gain (1.0 = unity)
          defaultValue: 1,
          minValue: 0,
          maxValue: 10,
          automationRate: "k-rate"
        },
        {
          name: "outputGain",
          // linear gain (1.0 = unity)
          defaultValue: 1,
          minValue: 0,
          maxValue: 10,
          automationRate: "k-rate"
        },
        {
          name: "attack",
          // seconds
          defaultValue: 3e-3,
          minValue: 1e-3,
          maxValue: 1,
          automationRate: "k-rate"
        },
        {
          name: "release",
          // seconds
          defaultValue: 0.05,
          minValue: 1e-3,
          maxValue: 5,
          automationRate: "k-rate"
        }
      ];
    }
    constructor() {
      super();
      this.envelope = 0;
      this.gateThreshold = 5e-3;
      this.debugCounter = 0;
    }
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      const channel = inputs[0][0];
      if (!input || !output || !channel || input.length === 0 || output.length === 0 || channel.length === 0) {
        return true;
      }
      const inChannel = input[0];
      if (!inChannel || inChannel.length === 0) return true;
      const attack = parameters.attack[0];
      const release = parameters.release[0];
      const inputGain = parameters.inputGain[0];
      const outputGain = parameters.outputGain[0];
      const attackCoeff = Math.exp(-1 / (attack * sampleRate));
      const releaseCoeff = Math.exp(-1 / (release * sampleRate));
      for (let sample = 0; sample < output[0].length; sample++) {
        const inputLevel = Math.abs((input[0][sample] || 0) * inputGain);
        if (inputLevel > 1e-6) {
          if (inputLevel > this.envelope) {
            this.envelope = inputLevel + (this.envelope - inputLevel) * attackCoeff;
          } else {
            this.envelope = inputLevel + (this.envelope - inputLevel) * releaseCoeff;
          }
        } else {
          this.envelope *= releaseCoeff;
        }
        if (this.envelope < this.gateThreshold) this.envelope = 0;
        const finalOutput = this.envelope * outputGain;
        for (let channel2 = 0; channel2 < output.length; channel2++) {
          output[channel2][sample] = finalOutput;
        }
      }
      return true;
    }
  }
);
