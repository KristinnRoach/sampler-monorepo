import { ValueSnapper } from '../shared/helpers/ValueSnapper';
import { findClosestIdx } from '../../../utils/search/findClosest';

class SamplePlayerProcessor extends AudioWorkletProcessor {
  // ===== PARAMETER DESCRIPTORS =====
  static get parameterDescriptors() {
    return [
      {
        name: 'masterGain',
        defaultValue: 1,
        minValue: 0,
        maxValue: 2,
        automationRate: 'k-rate',
      },
      {
        name: 'envGain',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate',
      },
      {
        name: 'velocity',
        defaultValue: 100,
        minValue: 0,
        maxValue: 127,
        automationRate: 'k-rate',
      },
      {
        name: 'playbackRate',
        defaultValue: 1,
        minValue: 0.001,
        maxValue: 8,
        automationRate: 'a-rate',
      },
      // NOTE: Time based params use seconds
      {
        name: 'loopStart',
        defaultValue: 0,
        minValue: 0,
        maxValue: 99999, // Max sample length in seconds
        automationRate: 'k-rate',
      },
      {
        name: 'loopEnd',
        defaultValue: 99999, // Will be set to actual buffer duration when loaded
        minValue: 0,
        maxValue: 99999,
        automationRate: 'k-rate',
      },
      {
        name: 'startPoint',
        defaultValue: 0,
        minValue: 0,
        maxValue: 9999, // Max sample length in seconds
        automationRate: 'k-rate',
      },
      {
        name: 'endPoint',
        defaultValue: 9999, // Will be set to actual buffer duration when loaded
        minValue: 0,
        maxValue: 9999,
        automationRate: 'k-rate',
      },
      {
        name: 'playbackPosition',
        defaultValue: 0,
        minValue: 0,
        maxValue: 99999,
        automationRate: 'k-rate',
      },
    ];
  }

  // ===== CONSTRUCTOR =====

  constructor() {
    super();

    this.buffer = null;
    this.snapper = new ValueSnapper();

    this.playbackPosition = 0;
    this.transpositionPlaybackrate = 1;
    this.loopCount = 0;
    this.maxLoopCount = Number.MAX_SAFE_INTEGER;

    // Timing state
    this.isPlaying = false;
    this.startTime = 0; // When playback started
    this.startPoint = 0; // Starting position in seconds
    this.scheduledEndTime = null; // When playback should end (if duration specified)

    // Zero crossing constraints
    this.minZeroCrossing = 0;
    this.maxZeroCrossing = 0;

    // Loop click compensation
    this.applyClickCompensation = false;
    this.loopClickCompensation = 0;

    // Other flags
    this.isReleasing = false;
    this.loopEnabled = false;
    this.lockTrimToloop = false;
    this.usePlaybackPosition = false;

    // Cache quantized values per process block
    this.blockQuantizedLoopStart = 0;
    this.blockQuantizedLoopEnd = 0;
    this.lastProcessedLoopStart = -1;
    this.lastProcessedLoopEnd = -1;

    this.port.onmessage = this.#handleMessage.bind(this);

    this.debugCounter = 0;
  }

  // ===== MESSAGE HANDLING =====

  #handleMessage(event) {
    const {
      type,
      value,
      buffer,
      timestamp,
      durationSeconds,
      zeroCrossings,
      semitones,
      allowedPeriods,
    } = event.data;

    switch (type) {
      case 'voice:init':
        this.#resetState();

        this.port.postMessage({ type: 'initialized' });
        break;

      case 'voice:set_buffer':
        this.#resetState();
        this.buffer = null;
        this.buffer = buffer;

        this.port.postMessage({
          type: 'voice:loaded',
          durationSeconds,
          time: currentTime,
        });
        break;

      case 'transpose':
        // Convert semitones to playback-rate scalar
        this.transpositionPlaybackrate = Math.pow(2, semitones / 12);

        this.port.postMessage({
          type: 'voice:transposed',
          semitones,
          time: currentTime,
        });
        break;

      case 'voice:set_zero_crossings':
        this.zeroCrossings = (zeroCrossings || []).map(
          (timeSec) => timeSec * sampleRate
        );

        // Set min/max zero crossings for parameter constraints
        if (this.zeroCrossings.length > 0) {
          this.minZeroCrossing = this.zeroCrossings[0];
          this.maxZeroCrossing =
            this.zeroCrossings[this.zeroCrossings.length - 1];
        }
        break;

      case 'setAllowedPeriods':
        // Convert seconds to samples
        const periodsInSamples = allowedPeriods.map(
          (periodSec) => periodSec * sampleRate
        );

        this.snapper.setAllowedPeriods(periodsInSamples);
        break;

      case 'voice:start':
        this.isReleasing = false;
        this.isPlaying = true;
        this.loopCount = 0;
        this.startTime = timestamp || currentTime; // Test timestamp handling

        // will be set in process() using parameters
        this.playbackPosition = 0;

        this.port.postMessage({
          type: 'voice:started',
          time: timestamp || currentTime,
        });
        break;

      case 'voice:release':
        this.isReleasing = true;
        // const startReleaseTime = timestamp || currentTime; // Test timestamp handling

        this.port.postMessage({
          type: 'voice:releasing',
          time: currentTime,
        });
        break;

      case 'voice:stop':
        // const stopTime = timestamp || currentTime; // Test timestamp handling
        this.#stop();
        break;

      case 'setLoopEnabled':
        this.loopEnabled = value;

        this.port.postMessage({
          type: 'loop:enabled',
        });
        break;

      case 'voice:usePlaybackPosition':
        this.usePlaybackPosition = value;
        break;

      case 'lock:trimToloop':
        this.lockTrimToloop = true;
        break;

      case 'unlock:trimToLoop':
        this.lockTrimToloop = false;
        break;
    }
  }

  // ===== METHODS =====

  #resetState() {
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
  }

  #stop() {
    this.isPlaying = false;
    this.isReleasing = false;
    this.playbackPosition = 0;
    this.port.postMessage({ type: 'voice:stopped' });
  }

  #clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  #clampZeroCrossing = (value) =>
    this.#clamp(value, this.minZeroCrossing, this.maxZeroCrossing);

  #findNearestZeroCrossing(position, maxDistance = null) {
    if (!this.zeroCrossings || this.zeroCrossings.length === 0) {
      return position;
    }

    // Find closest zero crossing
    const closest = this.zeroCrossings.reduce(
      (prev, curr) =>
        Math.abs(curr - position) < Math.abs(prev - position) ? curr : prev,
      this.zeroCrossings[0]
    );

    // If maxDistance specified and closest is too far, use original position
    if (maxDistance !== null && Math.abs(closest - position) > maxDistance) {
      return position;
    }

    return closest;
  }

  // ===== CONVERSION UTILITIES =====

  /**
   * Convert normalized position (0-1) to sample index
   * @param {number} normalizedPosition - Position as 0-1 value
   * @returns {number} - Sample index
   */
  #normalizedToSamples(normalizedPosition) {
    if (!this.buffer || !this.buffer[0]) return 0;
    return normalizedPosition * this.buffer[0].length;
  }

  /**
   * Convert sample index to normalized position (0-1)
   * @param {number} sampleIndex - Sample index
   * @returns {number} - Normalized position 0-1
   */
  #samplesToNormalized(sampleIndex) {
    if (!this.buffer || !this.buffer[0]) return 0;
    return sampleIndex / this.buffer[0].length;
  }

  /**
   * Convert MIDI velocity (0-127) to gain multiplier (0-1)
   * @param {number} midiVelocity - MIDI velocity 0-127
   * @returns {number} - Gain multiplier 0-1
   */
  #midiVelocityToGain(midiVelocity) {
    return Math.max(0, Math.min(1, midiVelocity / 127));
  }

  /**
   * Get buffer duration in seconds
   * @returns {number} - Buffer duration in seconds
   */
  #getBufferDurationSeconds() {
    return (this.buffer?.[0]?.length || 0) / sampleRate;
  }

  /**
   * Extract and convert all position parameters from seconds to samples
   * @param {Object} parameters - AudioWorkletProcessor parameters
   * @returns {Object} - Converted parameters in samples
   */
  #extractPositionParams(parameters) {
    const samples = {
      startPointSamples: Math.floor(parameters.startPoint[0] * sampleRate),
      endPointSamples: Math.floor(parameters.endPoint[0] * sampleRate),
      loopStartSamples: Math.floor(parameters.loopStart[0] * sampleRate),
      loopEndSamples: Math.floor(parameters.loopEnd[0] * sampleRate),
    };
    return samples;
  }

  /**
   * Calculate effective playback range in samples
   * @param {Object} params - Position parameters from #extractPositionParams
   * @returns {Object} - Effective start and end positions
   */
  #calculatePlaybackRange(params) {
    const bufferLength = this.buffer?.[0]?.length || 0;

    const start = Math.max(0, params.startPointSamples);
    const end =
      params.endPointSamples > start
        ? Math.min(bufferLength, params.endPointSamples)
        : bufferLength;

    const snappedStart = start; // findClosest(this.zeroCrossings, start, right); // this.#findNearestZeroCrossing(start);
    const snappedEnd = end; // findClosest(this.zeroCrossings, left); // this.#findNearestZeroCrossing(end);

    return {
      startSamples: snappedStart,
      endSamples: snappedEnd,
      durationSamples: snappedEnd - snappedStart,
    };
  }

  /**
   * Calculate effective loop range in samples
   * @param {Object} params - Position parameters from #extractPositionParams
   * @param {Object} playbackRange - Range from #calculatePlaybackRange
   * @returns {Object} - Effective loop start and end positions
   */
  #calculateLoopRange(params, playbackRange, originalParams) {
    const lpStart = params.loopStartSamples;
    const lpEnd = params.loopEndSamples;

    // Default to playback range if loop points are not set
    let calcLoopStart =
      lpStart < lpEnd && lpStart >= 0 ? lpStart : playbackRange.startSamples;

    let calcLoopEnd =
      lpEnd > lpStart && lpEnd <= playbackRange.endSamples
        ? lpEnd
        : playbackRange.endSamples;

    const loopDuration = calcLoopEnd - calcLoopStart;

    return {
      loopStartSamples: calcLoopStart,
      loopEndSamples: calcLoopEnd,
      loopDurationSamples: loopDuration,
    };
  }

  #getSafeParam(paramArray, index, isConstant) {
    return isConstant
      ? paramArray[0]
      : paramArray[Math.min(index, paramArray.length - 1)];
  }

  #getConstantFlags(parameters) {
    return Object.fromEntries(
      Object.keys(parameters).map((key) => [key, parameters[key].length === 1])
    );
  }

  // ===== MAIN PROCESS METHOD =====

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    this.debugCounter++;

    if (!output || !this.isPlaying || !this.buffer?.[0]?.length) {
      return true;
    }

    // ===== USE EXPLICIT CONVERSION UTILITIES =====
    const positionParams = this.#extractPositionParams(parameters);
    const playbackRange = this.#calculatePlaybackRange(positionParams);
    const loopRange = this.#calculateLoopRange(
      positionParams,
      playbackRange,
      parameters
    );

    // Initialize playback position
    if (
      this.playbackPosition === 0 ||
      this.playbackPosition < playbackRange.startSamples
    ) {
      this.playbackPosition = playbackRange.startSamples;
    }

    // ===== AUDIO PROCESSING =====
    const masterGain = parameters.masterGain[0];

    const velocityGain =
      this.#midiVelocityToGain(parameters.velocity[0]) *
      this.velocitySensitivity;

    const numChannels = Math.min(output.length, this.buffer.length);

    const isConstant = this.#getConstantFlags(parameters);

    // Process each sample
    for (let i = 0; i < output[0].length; i++) {
      const envelopeGain = this.#getSafeParam(
        parameters.envGain,
        i,
        isConstant.envGain
      );

      const playbackRate = this.#getSafeParam(
        parameters.playbackRate,
        i,
        isConstant.playbackRate
      );
      // ... etc for params that should support a-rate

      // Handle looping
      if (this.loopEnabled && this.loopCount < this.maxLoopCount) {
        if (this.playbackPosition >= loopRange.loopEndSamples) {
          // Get the actual samples we're transitioning between
          const lastLoopSample =
            this.buffer[0][Math.floor(this.playbackPosition - 1)] || 0;
          const newFirstSample =
            this.buffer[0][Math.floor(loopRange.loopStartSamples)] || 0;

          // Store the difference for ONE sample compensation
          this.loopClickCompensation = (lastLoopSample - newFirstSample) * 0.5;
          this.applyClickCompensation = true;

          this.playbackPosition = loopRange.loopStartSamples;
          this.loopCount++;
        }
      }

      // Check for end of playback range
      if (this.playbackPosition >= playbackRange.endSamples) {
        this.#stop();
        return true;
      }

      // Sample interpolation
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, playbackRange.endSamples - 1);

      // Generate output for each channel
      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position] || 0;
        const next = bufferChannel[nextPosition] || 0;

        let interpolatedSample = current + fraction * (next - current);

        // Apply ONE-SAMPLE click compensation
        if (this.applyClickCompensation) {
          interpolatedSample += this.loopClickCompensation;
          this.applyClickCompensation = false; // Only apply to the very first sample
        }

        const finalSample =
          interpolatedSample * velocityGain * envelopeGain * masterGain;

        // Basic hard limiting
        output[c][i] = Math.max(
          -1,
          Math.min(1, isFinite(finalSample) ? finalSample : 0)
        );
      }

      this.playbackPosition += playbackRate * this.transpositionPlaybackrate;
    }

    // Send position updates if requested
    if (this.usePlaybackPosition) {
      const normalizedPosition = this.#samplesToNormalized(
        this.playbackPosition
      );
      this.port.postMessage({
        type: 'voice:position',
        position: normalizedPosition,
      });
    }

    return true;
  }
}

registerProcessor('sample-player-processor', SamplePlayerProcessor);
