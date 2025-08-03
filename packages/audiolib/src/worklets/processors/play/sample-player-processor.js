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
        minValue: 0.1,
        maxValue: 24,
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
      {
        name: 'loopDurationDriftAmount',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1, // 0 = no drift, 1 = max drift (up to 100% of loop duration)
        automationRate: 'k-rate',
      },
    ];
  }

  // ===== CONSTRUCTOR =====

  constructor() {
    super();

    // Only set properties that should persist across resets
    this.buffer = null;
    this.snapper = new ValueSnapper();
    this.minZeroCrossing = 0;
    this.maxZeroCrossing = 0;
    this.usePlaybackPosition = false;

    this.crossfadeLength = 64; // samples (adjust for smoothness vs latency)
    this.crossfadeBuffer = null;
    this.crossfadePosition = 0;
    this.inCrossfade = false;

    // EXPERIMENTAL: Adaptive loop crossfade for drift compensation
    this.enableAdaptiveCrossfade = true; // Easy toggle to disable
    this.adaptiveCrossfadeLength = 0;
    this.adaptiveCrossfadePosition = 0;
    this.adaptiveCrossfadeActive = false;
    this.preLoopSamples = new Float32Array(16); // Store samples before loop point

    this.port.onmessage = this.#handleMessage.bind(this);

    // Initialize all playback state
    this.#resetState();
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
      playbackDirection,
    } = event.data;

    switch (type) {
      case 'voice:init':
        this.#resetState();

        this.port.postMessage({ type: 'initialized' });
        break;

      case 'voice:setBuffer':
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

      case 'voice:setZeroCrossings':
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
        this.#stop();
        break;

      case 'setLoopEnabled':
        this.loopEnabled = value;

        this.port.postMessage({
          type: 'loop:enabled',
        });
        break;

      case 'voice:setPlaybackDirection':
        this.reversePlayback = playbackDirection === 'reverse' ? true : false;

        this.port.postMessage({
          type: 'voice:playbackDirectionChange',
          playbackDirection,
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
    this.loopEnabled = false;
    this.transpositionPlaybackrate = 1;
    this.velocitySensitivity = 0.5;

    this.startTime = 0;
    this.startPoint = 0;
    this.reversePlayback = false;
    this.scheduledEndTime = null;
    this.playbackPosition = 0;

    this.debugCounter = 0;
    this.loopCount = 0;
    this.maxLoopCount = Number.MAX_SAFE_INTEGER;

    this.applyClickCompensation = false;
    this.loopClickCompensation = 0;
    this.lockTrimToloop = false;

    // EXPERIMENTAL: Reset adaptive crossfade state
    this.adaptiveCrossfadeActive = false;
    this.adaptiveCrossfadePosition = 0;
    this.adaptiveCrossfadeLength = 0;

    // Loop drift state
    this.currentLoopDrift = 0;
    this.nextDriftGenerated = false;
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
   * Calculate effective loop range in samples with optional drift
   * @param {Object} params - Position parameters from #extractPositionParams
   * @param {Object} playbackRange - Range from #calculatePlaybackRange
   * @param {number} driftAmount - Loop duration drift amount (0-1)
   * @returns {Object} - Effective loop start and end positions with drift applied
   */
  #calculateLoopRange(params, playbackRange, driftAmount = 0) {
    const lpStart = params.loopStartSamples;
    const lpEnd = params.loopEndSamples;

    // Default to playback range if loop points are not set
    let calcLoopStart =
      lpStart < lpEnd && lpStart >= 0 ? lpStart : playbackRange.startSamples;

    let calcLoopEnd =
      lpEnd > lpStart && lpEnd <= playbackRange.endSamples
        ? lpEnd
        : playbackRange.endSamples;

    // Apply drift to loop end position
    if (driftAmount > 0 && this.loopEnabled) {
      const baseDuration = calcLoopEnd - calcLoopStart;

      // Generate new drift only at the start of each loop iteration
      if (!this.nextDriftGenerated || this.loopCount === 0) {
        this.currentLoopDrift = this.#generateLoopDrift(
          driftAmount,
          baseDuration
        );
        this.nextDriftGenerated = true;
      }

      // Apply drift to loop end, ensuring it stays within bounds
      const driftedLoopEnd = calcLoopEnd + this.currentLoopDrift;

      // Clamp to stay within playback range and ensure minimum loop duration
      const minLoopDuration = Math.max(1, Math.floor(baseDuration * 0.1)); // At least 10% of original duration
      calcLoopEnd = Math.max(
        calcLoopStart + minLoopDuration,
        Math.min(playbackRange.endSamples, driftedLoopEnd)
      );
    }

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

  /**
   * EXPERIMENTAL: Calculate adaptive crossfade length based on discontinuity severity
   * Can be easily disabled by setting this.enableAdaptiveCrossfade = false
   * @param {number} discontinuity - The amplitude difference between loop points
   * @param {number} driftAmount - Current drift amount (0-1)
   * @returns {number} - Crossfade length in samples
   */
  #calculateAdaptiveCrossfadeLength(discontinuity, driftAmount) {
    if (!this.enableAdaptiveCrossfade) return 0;

    const minCrossfade = 4;
    const maxCrossfade = 16;

    // Scale crossfade based on discontinuity severity and drift amount
    const discontinuityFactor = Math.min(1, Math.abs(discontinuity) * 2);
    const driftFactor = Math.min(1, driftAmount * 1.5);

    const scaleFactor = Math.max(discontinuityFactor, driftFactor);

    return Math.floor(
      minCrossfade + (maxCrossfade - minCrossfade) * scaleFactor
    );
  }

  /**
   * EXPERIMENTAL: Prepare samples for adaptive crossfade at loop boundary
   * @param {number} loopEndPosition - Position where loop ends
   * @param {number} crossfadeLength - Length of crossfade in samples
   */
  #prepareAdaptiveCrossfade(loopEndPosition, crossfadeLength) {
    if (!this.enableAdaptiveCrossfade || crossfadeLength <= 0) return;

    // Capture samples before the loop point for crossfading
    const startCapture = Math.max(0, loopEndPosition - crossfadeLength);
    for (
      let i = 0;
      i < Math.min(crossfadeLength, this.preLoopSamples.length);
      i++
    ) {
      const samplePos = Math.floor(startCapture + i);
      this.preLoopSamples[i] = this.buffer[0][samplePos] || 0;
    }
  }

  /**
   * Generate a new drift amount for the current loop iteration
   * @param {number} driftAmount - Maximum drift amount (0-1)
   * @param {number} baseDuration - Base loop duration in samples
   * @returns {number} - Drift amount in samples
   */
  #generateLoopDrift(driftAmount, baseDuration) {
    if (driftAmount <= 0) return 0;

    // Generate random value between -1 and 1
    const randomFactor = (Math.random() - 0.5) * 2;

    // Scale by drift amount and base duration
    // Maximum drift is driftAmount * baseDuration
    const maxDriftSamples = driftAmount * baseDuration;

    return Math.floor(randomFactor * maxDriftSamples);
  }

  // ===== MAIN PROCESS METHOD =====

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    this.debugCounter++;

    if (!output || !this.isPlaying || !this.buffer?.[0]?.length) {
      return true;
    }

    // ===== GET PARAM VALUES =====

    const masterGain = parameters.masterGain[0];

    const positionParams = this.#extractPositionParams(parameters);

    const playbackRange = this.#calculatePlaybackRange(positionParams);

    const loopRange = this.#calculateLoopRange(
      positionParams,
      playbackRange,
      parameters.loopDurationDriftAmount[0]
    );

    const velocityGain =
      this.#midiVelocityToGain(parameters.velocity[0]) *
      this.velocitySensitivity;

    const numChannels = Math.min(output.length, this.buffer.length);

    const isConstant = this.#getConstantFlags(parameters);

    // ===== Init playback position =====

    if (this.playbackPosition === 0) {
      this.playbackPosition = this.reversePlayback
        ? playbackRange.endSamples - 1
        : playbackRange.startSamples;
    }

    // ===== AUDIO PROCESSING =====

    for (let sample = 0; sample < output[0].length; sample++) {
      // Use getSafeParam for a-rate params
      const envelopeGain = this.#getSafeParam(
        parameters.envGain,
        sample,
        isConstant.envGain
      );

      const baseRate = this.#getSafeParam(
        parameters.playbackRate,
        sample,
        isConstant.playbackRate
      );

      const effectiveRate = this.reversePlayback
        ? -Math.abs(baseRate)
        : Math.abs(baseRate);

      // Handle looping
      if (this.loopEnabled && this.loopCount < this.maxLoopCount) {
        // Forward playback
        if (
          !this.reversePlayback &&
          this.playbackPosition >= loopRange.loopEndSamples
        ) {
          // Get the actual samples we're transitioning between
          const lastLoopSample =
            this.buffer[0][Math.floor(this.playbackPosition - 1)] || 0;
          const newFirstSample =
            this.buffer[0][Math.floor(loopRange.loopStartSamples)] || 0;

          // Store the difference for enhanced compensation
          const discontinuity = lastLoopSample - newFirstSample;

          // EXPERIMENTAL: Adaptive crossfade for smoother transitions
          if (this.enableAdaptiveCrossfade && Math.abs(discontinuity) > 0.05) {
            this.adaptiveCrossfadeLength =
              this.#calculateAdaptiveCrossfadeLength(
                discontinuity,
                parameters.loopDurationDriftAmount[0]
              );

            if (this.adaptiveCrossfadeLength > 0) {
              this.#prepareAdaptiveCrossfade(
                this.playbackPosition,
                this.adaptiveCrossfadeLength
              );
              this.adaptiveCrossfadeActive = true;
              this.adaptiveCrossfadePosition = 0;
            }
          }

          // Original compensation method (still active)
          if (Math.abs(discontinuity) > 0.1) {
            // Only if significant
            this.loopClickCompensation = discontinuity * 0.3; // Reduced impact
            this.compensationDecay = 0.8; // Fade out over multiple samples
            this.applyClickCompensation = true;
          }

          this.playbackPosition = loopRange.loopStartSamples;
          this.loopCount++;

          // Reset drift flag to generate new drift for next loop iteration
          this.nextDriftGenerated = false;
        }
        // Reverse playback
        else if (
          this.reversePlayback &&
          this.playbackPosition <= loopRange.loopStartSamples
        ) {
          // Set to one sample before end to avoid immediate boundary trigger
          this.playbackPosition = loopRange.loopEndSamples - 1;
          this.loopCount++;

          // Reset drift flag to generate new drift for next loop iteration
          this.nextDriftGenerated = false;
        }
      }

      // Check for end of playback range (forward & reversed)
      // Don't stop if we're looping and within the playback range
      const shouldStopForward =
        !this.reversePlayback &&
        this.playbackPosition >= playbackRange.endSamples;
      const shouldStopReverse =
        this.reversePlayback &&
        this.playbackPosition <= playbackRange.startSamples;
      const isWithinLoop =
        this.loopEnabled &&
        this.playbackPosition >= loopRange.loopStartSamples &&
        this.playbackPosition <= loopRange.loopEndSamples;

      if (
        (shouldStopForward || shouldStopReverse) &&
        !(this.loopEnabled && isWithinLoop)
      ) {
        this.#stop();
        return true;
      }

      // Sample interpolation
      const currentPosition = Math.floor(this.playbackPosition);
      const positionOffset = this.playbackPosition - currentPosition;

      // Pre-calculate interpolation positions outside channel loop
      let nextPosition, interpWeight;
      if (this.reversePlayback) {
        nextPosition = Math.max(
          currentPosition - 1,
          playbackRange.startSamples
        );
        interpWeight = 1 - positionOffset; // Reverse: weight toward previous sample
      } else {
        nextPosition = Math.min(
          currentPosition + 1,
          playbackRange.endSamples - 1
        );
        interpWeight = positionOffset; // Forward: weight toward next sample
      }

      // Generate output for each channel
      for (let channel = 0; channel < numChannels; channel++) {
        const bufferChannel =
          this.buffer[Math.min(channel, this.buffer.length - 1)];

        // Linear interpolation between current and next positions
        const currentSample = bufferChannel[currentPosition] || 0;
        const nextSample = bufferChannel[nextPosition] || 0;
        let interpolatedSample =
          currentSample + interpWeight * (nextSample - currentSample);

        // EXPERIMENTAL: Apply adaptive crossfade if active
        if (this.adaptiveCrossfadeActive && this.enableAdaptiveCrossfade) {
          const crossfadeProgress =
            this.adaptiveCrossfadePosition / this.adaptiveCrossfadeLength;

          if (crossfadeProgress < 1.0) {
            // Get corresponding sample from pre-loop buffer
            const preLoopIndex = Math.floor(this.adaptiveCrossfadePosition);
            const preLoopSample = this.preLoopSamples[preLoopIndex] || 0;

            // Smooth cosine crossfade curve
            const fadeWeight =
              0.5 * (1 - Math.cos(Math.PI * crossfadeProgress));
            interpolatedSample =
              preLoopSample * (1 - fadeWeight) +
              interpolatedSample * fadeWeight;

            this.adaptiveCrossfadePosition++;
          } else {
            this.adaptiveCrossfadeActive = false;
          }
        }

        // Original click compensation (still active)
        if (this.applyClickCompensation) {
          interpolatedSample += this.loopClickCompensation;

          // Apply decay for multi-sample smoothing
          if (this.compensationDecay) {
            this.loopClickCompensation *= this.compensationDecay;
            if (Math.abs(this.loopClickCompensation) < 0.001) {
              this.applyClickCompensation = false;
            }
          } else {
            this.applyClickCompensation = false; // Single sample mode
          }
        }

        const finalSample =
          interpolatedSample * velocityGain * envelopeGain * masterGain;

        // Basic hard limiting
        output[channel][sample] = Math.max(
          -1,
          Math.min(1, isFinite(finalSample) ? finalSample : 0)
        );
      }

      this.playbackPosition += effectiveRate * this.transpositionPlaybackrate;
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
