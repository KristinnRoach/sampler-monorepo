var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _SamplePlayerProcessor_instances, handleMessage_fn, resetState_fn, stop_fn, _clamp, _clampZeroCrossing, findNearestZeroCrossing_fn, normalizedToSamples_fn, samplesToNormalized_fn, midiVelocityToGain_fn, getBufferDurationSeconds_fn, extractPositionParams_fn, calculatePlaybackRange_fn, calculateLoopRange_fn, getSafeParam_fn, getConstantFlags_fn, generateLoopDrift_fn, analyzeLoopAmplitude_fn;
function findClosestIdx(sortedArray, target, direction = "any", getValue = (x) => x, getDistance = (a, b) => Math.abs(a - b)) {
  if (sortedArray.length === 0) {
    throw new Error("Array cannot be empty");
  }
  if (sortedArray.length === 1) {
    return 0;
  }
  const targetValue = target;
  const firstValue = getValue(sortedArray[0]);
  const lastValue = getValue(sortedArray[sortedArray.length - 1]);
  if (targetValue <= firstValue) return 0;
  if (targetValue >= lastValue) return sortedArray.length - 1;
  let left = 0;
  let right = sortedArray.length - 1;
  while (left < right - 1) {
    const mid = Math.floor((left + right) / 2);
    const midValue = getValue(sortedArray[mid]);
    if (midValue === targetValue) {
      return mid;
    } else if (midValue < targetValue) {
      left = mid;
    } else {
      right = mid;
    }
  }
  if (direction === "left") return left;
  if (direction === "right") return right;
  const leftDistance = getDistance(getValue(sortedArray[left]), targetValue);
  const rightDistance = getDistance(getValue(sortedArray[right]), targetValue);
  return leftDistance <= rightDistance ? left : right;
}
function findClosest(sortedArray, target, direction = "any", getValue = (x) => x, getDistance = (a, b) => Math.abs(a - b)) {
  const index = findClosestIdx(
    sortedArray,
    target,
    direction,
    getValue,
    getDistance
  );
  return sortedArray[index];
}
class SamplePlayerProcessor extends AudioWorkletProcessor {
  // ===== CONSTRUCTOR =====
  constructor() {
    super();
    __privateAdd(this, _SamplePlayerProcessor_instances);
    __privateAdd(this, _clamp, (value, min, max) => Math.max(min, Math.min(max, value)));
    __privateAdd(this, _clampZeroCrossing, (value) => __privateGet(this, _clamp).call(this, value, this.minZeroCrossing, this.maxZeroCrossing));
    this.buffer = null;
    this.minZeroCrossing = 0;
    this.maxZeroCrossing = 0;
    this.usePlaybackPosition = false;
    this.enableLoopSmoothing = true;
    this.enableAdaptiveDrift = true;
    this.enableAmplitudeCompensation = true;
    this.PITCH_PRESERVATION_THRESHOLD = Math.floor(sampleRate * 0.061);
    this.AMPLITUDE_COMPENSATION_THRESHOLD = Math.floor(sampleRate / 16.35);
    this.port.onmessage = __privateMethod(this, _SamplePlayerProcessor_instances, handleMessage_fn).bind(this);
    __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
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
        name: "pan",
        defaultValue: 0,
        minValue: -1,
        // -1 hard left
        maxValue: 1,
        // 1 hard right
        automationRate: "k-rate"
      },
      {
        name: "playbackRate",
        defaultValue: 1,
        minValue: 0.1,
        maxValue: 24,
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
      },
      {
        name: "loopDurationDriftAmount",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        // 0 = no drift, 1 = max drift (up to 100% of loop duration)
        automationRate: "k-rate"
      },
      {
        name: "maxLoopCount",
        defaultValue: 999999,
        minValue: 1,
        maxValue: 999999,
        automationRate: "k-rate"
      }
    ];
  }
  // ===== MAIN PROCESS METHOD =====
  process(inputs, outputs, parameters) {
    var _a, _b, _c;
    const output = outputs[0];
    this.debugCounter++;
    if (!output || !this.isPlaying || !((_b = (_a = this.buffer) == null ? void 0 : _a[0]) == null ? void 0 : _b.length)) {
      return true;
    }
    const masterGain = parameters.masterGain[0];
    const positionParams = __privateMethod(this, _SamplePlayerProcessor_instances, extractPositionParams_fn).call(this, parameters);
    const playbackRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculatePlaybackRange_fn).call(this, positionParams);
    const loopRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculateLoopRange_fn).call(this, positionParams, playbackRange, parameters.loopDurationDriftAmount[0]);
    const amplitudeGain = __privateMethod(this, _SamplePlayerProcessor_instances, analyzeLoopAmplitude_fn).call(this, loopRange.loopStartSamples, loopRange.loopEndSamples);
    const velocityGain = __privateMethod(this, _SamplePlayerProcessor_instances, midiVelocityToGain_fn).call(this, parameters.velocity[0]) * this.velocitySensitivity;
    const basePan = parameters.pan[0];
    const effectivePan = this.panDriftEnabled ? Math.max(-1, Math.min(1, basePan + this.currentPanDrift)) : basePan;
    let outputChannels;
    if (output instanceof Float32Array) {
      outputChannels = [output];
    } else if (Array.isArray(output) && output.every((ch) => ch instanceof Float32Array)) {
      outputChannels = output;
    } else {
      console.error("Unexpected output structure:", {
        outputType: typeof output,
        isArray: Array.isArray(output),
        constructor: (_c = output == null ? void 0 : output.constructor) == null ? void 0 : _c.name,
        length: output == null ? void 0 : output.length
      });
      return true;
    }
    const numChannels = outputChannels.length;
    const isConstant = __privateMethod(this, _SamplePlayerProcessor_instances, getConstantFlags_fn).call(this, parameters);
    if (this.playbackPosition === 0) {
      this.playbackPosition = this.reversePlayback ? playbackRange.endSamples - 1 : playbackRange.startSamples;
    }
    for (let sample = 0; sample < outputChannels[0].length; sample++) {
      const envelopeGain = __privateMethod(this, _SamplePlayerProcessor_instances, getSafeParam_fn).call(this, parameters.envGain, sample, isConstant.envGain);
      const baseRate = __privateMethod(this, _SamplePlayerProcessor_instances, getSafeParam_fn).call(this, parameters.playbackRate, sample, isConstant.playbackRate);
      const effectiveRate = this.reversePlayback ? -Math.abs(baseRate) : Math.abs(baseRate);
      if (this.loopEnabled && this.loopCount < parameters.maxLoopCount[0]) {
        if (!this.reversePlayback && this.playbackPosition >= loopRange.loopEndSamples) {
          const lastLoopSample = this.buffer[0][Math.floor(this.playbackPosition - 1)] || 0;
          const newFirstSample = this.buffer[0][Math.floor(loopRange.loopStartSamples)] || 0;
          const discontinuity = lastLoopSample - newFirstSample;
          if (this.enableLoopSmoothing && Math.abs(discontinuity) > 0.01) {
            this.loopClickCompensation = discontinuity * 0.5;
            this.compensationDecay = 0.9;
            this.applyClickCompensation = true;
          }
          this.playbackPosition = loopRange.loopStartSamples;
          this.loopCount++;
          this.nextDriftGenerated = false;
        } else if (this.reversePlayback && this.playbackPosition <= loopRange.loopStartSamples) {
          this.playbackPosition = loopRange.loopEndSamples - 1;
          this.loopCount++;
          this.nextDriftGenerated = false;
        }
      }
      const shouldStopForward = !this.reversePlayback && this.playbackPosition >= playbackRange.endSamples;
      const shouldStopReverse = this.reversePlayback && this.playbackPosition <= playbackRange.startSamples;
      const isWithinLoop = this.loopEnabled && this.playbackPosition >= loopRange.loopStartSamples && this.playbackPosition <= loopRange.loopEndSamples;
      if ((shouldStopForward || shouldStopReverse) && !(this.loopEnabled && isWithinLoop)) {
        __privateMethod(this, _SamplePlayerProcessor_instances, stop_fn).call(this);
        return true;
      }
      const currentPosition = Math.floor(this.playbackPosition);
      const positionOffset = this.playbackPosition - currentPosition;
      let nextPosition, interpWeight;
      if (this.reversePlayback) {
        nextPosition = Math.max(
          currentPosition - 1,
          playbackRange.startSamples
        );
        interpWeight = 1 - positionOffset;
      } else {
        nextPosition = Math.min(
          currentPosition + 1,
          playbackRange.endSamples - 1
        );
        interpWeight = positionOffset;
      }
      for (let channel = 0; channel < numChannels; channel++) {
        if (!outputChannels[channel]) {
          console.warn(
            `Output channel ${channel} does not exist. Available channels:`,
            outputChannels.length
          );
          continue;
        }
        const bufferChannelIndex = Math.min(channel, this.buffer.length - 1);
        const bufferChannel = this.buffer[bufferChannelIndex];
        const currentSample = bufferChannel[currentPosition] || 0;
        const nextSample = bufferChannel[nextPosition] || 0;
        let interpolatedSample = currentSample + interpWeight * (nextSample - currentSample);
        if (this.applyClickCompensation) {
          interpolatedSample += this.loopClickCompensation;
          if (this.compensationDecay) {
            this.loopClickCompensation *= this.compensationDecay;
            if (Math.abs(this.loopClickCompensation) < 1e-3) {
              this.applyClickCompensation = false;
            }
          } else {
            this.applyClickCompensation = false;
          }
        }
        const finalSample = interpolatedSample * velocityGain * envelopeGain * masterGain * amplitudeGain;
        let panAdjustedSample = finalSample;
        if (outputChannels.length === 2) {
          if (channel === 0) {
            panAdjustedSample = finalSample * (1 - Math.max(0, effectivePan));
          } else if (channel === 1) {
            panAdjustedSample = finalSample * (1 - Math.max(0, -effectivePan));
          }
        }
        outputChannels[channel][sample] = Math.max(
          -1,
          Math.min(1, isFinite(panAdjustedSample) ? panAdjustedSample : 0)
        );
      }
      this.playbackPosition += effectiveRate * this.transpositionPlaybackrate;
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
    allowedPeriods,
    playbackDirection
  } = event.data;
  switch (type) {
    case "voice:init":
      __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
      this.port.postMessage({ type: "initialized" });
      break;
    case "voice:setBuffer":
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
    case "voice:setZeroCrossings":
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
        type: "loop:enabled",
        enabled: value
      });
      break;
    case "setPanDriftEnabled":
      this.panDriftEnabled = value;
      break;
    case "voice:setPlaybackDirection":
      this.reversePlayback = playbackDirection === "reverse" ? true : false;
      this.port.postMessage({
        type: "voice:playbackDirectionChange",
        playbackDirection
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
  this.loopEnabled = false;
  this.transpositionPlaybackrate = 1;
  this.velocitySensitivity = 0.5;
  this.reversePlayback = false;
  this.playbackPosition = 0;
  this.debugCounter = 0;
  this.loopCount = 0;
  this.applyClickCompensation = false;
  this.loopClickCompensation = 0;
  this.driftUpdateCounter = 0;
  this.currentLoopDrift = 0;
  this.currentPanDrift = 0;
  this.panDriftEnabled = true;
  this.nextDriftGenerated = false;
  this.loopAmplitudeGain = 1;
  this.lastAnalyzedLoopStart = -1;
  this.lastAnalyzedLoopEnd = -1;
};
stop_fn = function() {
  this.isPlaying = false;
  this.isReleasing = false;
  this.playbackPosition = 0;
  this.port.postMessage({ type: "voice:stopped" });
};
_clamp = new WeakMap();
_clampZeroCrossing = new WeakMap();
findNearestZeroCrossing_fn = function(position, direction = "any", maxDistance = null) {
  if (!this.zeroCrossings || this.zeroCrossings.length === 0) {
    return position;
  }
  const closestValue = findClosest(this.zeroCrossings, position, direction);
  if (maxDistance !== null && Math.abs(closestValue - position) > maxDistance) {
    return position;
  }
  return closestValue;
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
  const snappedStart = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, start, "right");
  const snappedEnd = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, end, "left");
  return {
    startSamples: snappedStart,
    endSamples: snappedEnd,
    durationSamples: snappedEnd - snappedStart
  };
};
/**
 * Calculate effective loop range in samples with optional drift
 * @param {Object} params - Position parameters from #extractPositionParams
 * @param {Object} playbackRange - Range from #calculatePlaybackRange
 * @param {number} driftAmount - Loop duration drift amount (0-1)
 * @returns {Object} - Effective loop start and end positions with drift applied
 */
calculateLoopRange_fn = function(params, playbackRange, driftAmount = 0) {
  const lpStart = params.loopStartSamples;
  const lpEnd = params.loopEndSamples;
  let calcLoopStart = lpStart < lpEnd && lpStart >= 0 ? lpStart : playbackRange.startSamples;
  let calcLoopEnd = lpEnd > lpStart && lpEnd <= playbackRange.endSamples ? lpEnd : playbackRange.endSamples;
  const baseDuration = calcLoopEnd - calcLoopStart;
  if (baseDuration > this.PITCH_PRESERVATION_THRESHOLD) {
    calcLoopStart = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, calcLoopStart, "right");
    calcLoopEnd = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, calcLoopEnd, "left");
  }
  if (driftAmount > 0 && this.loopEnabled) {
    if (!this.nextDriftGenerated || this.loopCount === 0) {
      const updateInterval = baseDuration <= this.PITCH_PRESERVATION_THRESHOLD ? Math.max(
        1,
        Math.floor(this.PITCH_PRESERVATION_THRESHOLD / baseDuration)
      ) : 1;
      const shouldUpdateDrift = this.driftUpdateCounter % updateInterval === 0;
      if (shouldUpdateDrift) {
        this.currentLoopDrift = __privateMethod(this, _SamplePlayerProcessor_instances, generateLoopDrift_fn).call(this, driftAmount, baseDuration);
        if (this.panDriftEnabled && driftAmount > 0 && this.loopCount > 0) {
          this.currentPanDrift = this.currentLoopDrift * 64e-5;
        } else {
          this.currentPanDrift = 0;
        }
      }
      this.driftUpdateCounter++;
      this.nextDriftGenerated = true;
    }
    const driftedLoopEnd = calcLoopEnd + this.currentLoopDrift;
    const minLoopDuration = Math.max(1, Math.floor(baseDuration * 0.1));
    calcLoopEnd = Math.max(
      calcLoopStart + minLoopDuration,
      Math.min(playbackRange.endSamples, driftedLoopEnd)
    );
  } else {
    this.currentPanDrift = 0;
  }
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
/**
 * Generate a new drift amount for the current loop iteration
 * @param {number} driftAmount - Maximum drift amount (0-1)
 * @param {number} baseDuration - Base loop duration in samples
 * @returns {number} - Drift amount in samples
 */
generateLoopDrift_fn = function(driftAmount, baseDuration) {
  if (driftAmount <= 0) return 0;
  const randomFactor = (Math.random() - 0.5) * 2;
  let effectiveDriftAmount = driftAmount;
  if (this.enableAdaptiveDrift) {
    const shortThreshold = 1024;
    const longThreshold = 8192;
    if (baseDuration < shortThreshold) {
      effectiveDriftAmount *= 0.1;
    } else if (baseDuration < longThreshold) {
      const scaleFactor = 0.1 + 0.9 * (baseDuration - shortThreshold) / (longThreshold - shortThreshold);
      effectiveDriftAmount *= scaleFactor;
    }
  }
  const maxDriftSamples = effectiveDriftAmount * baseDuration;
  return Math.floor(randomFactor * maxDriftSamples);
};
/**
 * Analyze loop amplitude and calculate makeup gain for short loops
 * @param {number} loopStart - Loop start position in samples
 * @param {number} loopEnd - Loop end position in samples
 * @returns {number} - Makeup gain multiplier (1.0 = no change)
 */
analyzeLoopAmplitude_fn = function(loopStart, loopEnd) {
  if (!this.enableAmplitudeCompensation || !this.buffer || !this.buffer[0]) {
    return 1;
  }
  const loopDuration = loopEnd - loopStart;
  if (loopDuration >= this.AMPLITUDE_COMPENSATION_THRESHOLD) {
    return 1;
  }
  if (loopStart === this.lastAnalyzedLoopStart && loopEnd === this.lastAnalyzedLoopEnd) {
    return this.loopAmplitudeGain;
  }
  let sumSquares = 0;
  let sampleCount = 0;
  const channel = this.buffer[0];
  const startIndex = Math.floor(loopStart);
  const endIndex = Math.floor(loopEnd);
  for (let i = startIndex; i < endIndex && i < channel.length; i++) {
    const sample = channel[i];
    sumSquares += sample * sample;
    sampleCount++;
  }
  if (sampleCount === 0) return 1;
  const rmsAmplitude = Math.sqrt(sumSquares / sampleCount);
  const targetAmplitude = 0.3;
  let makeupGain = 1;
  if (rmsAmplitude < targetAmplitude) {
    const safeRms = Math.max(rmsAmplitude, 1e-3);
    makeupGain = targetAmplitude / safeRms;
    makeupGain = Math.min(2, makeupGain);
  }
  this.lastAnalyzedLoopStart = loopStart;
  this.lastAnalyzedLoopEnd = loopEnd;
  this.loopAmplitudeGain = makeupGain;
  return makeupGain;
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
const cheapSoftClipSingleSample = (sample, max = 0.9) => {
  const a = Math.abs(sample);
  if (a <= max) return sample;
  const x = a / max;
  const compressed = x / (1 + x);
  return Math.sign(sample) * max * compressed;
};
const compressSingleSample = (input, threshold = 0.75, ratio = 4, limiter = { enabled: true, type: "soft", outputRange: { min: -1, max: 1 } }) => {
  const { min, max } = limiter.outputRange;
  let x = input;
  if (Math.abs(x) > threshold) {
    x = Math.sign(x) * (threshold + (Math.abs(x) - threshold) / ratio);
  }
  if (limiter.enabled) {
    if (limiter.type === "soft") {
      x = cheapSoftClipSingleSample(x, Math.abs(max));
    } else if (limiter.type === "hard") {
      x = Math.max(min, Math.min(max, x));
    }
  }
  return x;
};
class DelayBuffer {
  constructor(maxDelaySamples) {
    this.buffer = new Float32Array(maxDelaySamples);
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
const AUTO_GAIN_THRESHOLD = 0.8;
const SAFETY_GAIN_COMPENSATION = 0.2;
class FeedbackDelay {
  constructor(sampleRate2) {
    this.sampleRate = sampleRate2;
    this.buffers = [];
    this.initialized = false;
    this.autoGainEnabled = false;
    this.gainCompensation = SAFETY_GAIN_COMPENSATION;
    this.lowpassStates = [];
    this.highpassStates = [];
    this.highpassInputStates = [];
  }
  initializeBuffers(channelCount) {
    this.buffers = [];
    this.lowpassStates = [];
    this.highpassStates = [];
    this.highpassInputStates = [];
    const maxSamples = Math.floor(this.sampleRate * 2);
    for (let c = 0; c < channelCount; c++) {
      this.buffers[c] = new DelayBuffer(maxSamples);
      this.lowpassStates[c] = 0;
      this.highpassStates[c] = 0;
      this.highpassInputStates[c] = 0;
    }
    this.initialized = true;
  }
  /** Simple one-pole lowpass filter */
  lowpass(input, cutoffFreq, channelIndex) {
    if (cutoffFreq >= this.sampleRate * 0.4) {
      return input;
    }
    const omega = 2 * Math.PI * cutoffFreq / this.sampleRate;
    const alpha = Math.max(
      0,
      Math.min(0.99, Math.sin(omega) / (Math.sin(omega) + Math.cos(omega)))
    );
    this.lowpassStates[channelIndex] = alpha * input + (1 - alpha) * this.lowpassStates[channelIndex];
    return this.lowpassStates[channelIndex];
  }
  /** Simple one-pole highpass filter */
  highpass(input, cutoffFreq, channelIndex) {
    if (cutoffFreq < 5) return input;
    const omega = 2 * Math.PI * cutoffFreq / this.sampleRate;
    const alpha = Math.max(
      0,
      Math.min(0.99, Math.sin(omega) / (Math.sin(omega) + Math.cos(omega)))
    );
    const lowpassOutput = alpha * input + (1 - alpha) * this.highpassStates[channelIndex];
    const highpassOutput = input - lowpassOutput;
    this.highpassStates[channelIndex] = lowpassOutput;
    return highpassOutput;
  }
  process(inputSample, channelIndex, feedbackAmount, delayTime, lowpassFreq = 1e4, highpassFreq = 100) {
    if (!this.initialized) return inputSample;
    const buffer = this.buffers[channelIndex] || this.buffers[0];
    const delaySamples = Math.floor(this.sampleRate * delayTime);
    const delayedSample = buffer.read();
    let filteredDelay = this.highpass(
      delayedSample,
      highpassFreq,
      channelIndex
    );
    filteredDelay = this.lowpass(filteredDelay, lowpassFreq, channelIndex);
    const feedbackSample = feedbackAmount * filteredDelay + inputSample;
    let outputSample = feedbackSample;
    const compressedFeedback = compressSingleSample(feedbackSample, 0.5, 4, {
      enabled: true,
      // limiter enabled
      outputRange: { min: -0.99, max: 0.99 },
      type: "soft"
      // soft clip
    });
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
          // <- B8 natural in seconds (highest note period that works)
          maxValue: 2,
          automationRate: "k-rate"
        },
        {
          name: "decay",
          // feedback decay time factor
          defaultValue: 1,
          minValue: 0,
          maxValue: 1,
          automationRate: "k-rate"
        },
        {
          name: "lowpass",
          defaultValue: 1e4,
          minValue: 100,
          maxValue: 16e3,
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
      const lowpassFreq = parameters.lowpass[0];
      const channelCount = Math.min(input.length, output.length);
      const frameCount = output[0].length;
      for (let i = 0; i < frameCount; ++i) {
        let effectiveFeedbackAmount = baseFeedbackAmount;
        if (this.decayActive && this.decayStartTime !== null) {
          const elapsedTime = currentTime - this.decayStartTime + i / sampleRate;
          const delayCompensation = Math.min(100, 0.5 / delayTime);
          const timeConstant = Math.pow(decay, 5) * 1e3 * delayCompensation + 0.5;
          const decayFactor = Math.exp(-elapsedTime / timeConstant);
          effectiveFeedbackAmount = baseFeedbackAmount * decayFactor;
          if (effectiveFeedbackAmount < 0.01) {
            this.decayActive = false;
            effectiveFeedbackAmount = 0;
          }
        }
        for (let c = 0; c < channelCount; c++) {
          const processed = this.feedbackDelay.process(
            input[c][i],
            c,
            effectiveFeedbackAmount,
            delayTime,
            lowpassFreq
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
    const SHORT_DELAY_SCALE = 0.5;
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
    ].map((x) => x * SHORT_DELAY_SCALE).forEach((x) => this.makeDelay(x));
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
    const drivenSample = sample * driveMultiplier;
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
    if (clipThreshold < 0.08) {
      const makeupGain = Math.min(2, Math.pow(0.1 / clipThreshold, 0.5));
      clippedSample *= makeupGain;
    }
    const blended = sample * (1 - clippingAmount) + clippedSample * clippingAmount;
    return blended;
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
