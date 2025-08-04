import { findClosest } from '../../../utils/search/findClosest';

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
        name: 'pan',
        defaultValue: 0,
        minValue: -1, // -1 hard left
        maxValue: 1, // 1 hard right
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
      {
        name: 'maxLoopCount',
        defaultValue: 999999,
        minValue: 1,
        maxValue: 999999,
        automationRate: 'k-rate',
      },
    ];
  }

  // ===== CONSTRUCTOR =====

  constructor() {
    super();

    // Only set properties that should persist across resets
    this.buffer = null;
    this.minZeroCrossing = 0;
    this.maxZeroCrossing = 0;

    this.usePlaybackPosition = false;
    this.enableLoopSmoothing = true; // Crossfade between loop points
    this.enableAdaptiveDrift = true; // Adaptive drift scaling based on loop duration

    // C0 (lowest piano note) = ~16.35 Hz
    // Period = 1/16.35 ≈ 0.061 seconds
    // At 44.1kHz: 0.061 * 44100 ≈ 2690 samples
    this.PITCH_PRESERVATION_THRESHOLD = Math.floor(sampleRate * 0.061); // ~2690 samples @ 44.1kHz

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

      case 'voice:start':
        this.isReleasing = false;
        this.isPlaying = true;
        this.loopCount = 0;

        // will be set in process() using parameters
        this.playbackPosition = 0;

        this.port.postMessage({
          type: 'voice:started',
          time: timestamp || currentTime,
        });
        break;

      case 'voice:release':
        this.isReleasing = true;

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
          enabled: value,
        });
        break;

      case 'setPanDriftEnabled':
        this.panDriftEnabled = value;
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
    }
  }

  // ===== METHODS =====

  #resetState() {
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

    // Loop & Pan drift feature
    this.driftUpdateCounter = 0;
    this.currentLoopDrift = 0;
    this.currentPanDrift = 0;
    this.panDriftEnabled = true;
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

  #findNearestZeroCrossing(position, direction = 'any', maxDistance = null) {
    if (!this.zeroCrossings || this.zeroCrossings.length === 0) {
      return position;
    }

    const closestValue = findClosest(this.zeroCrossings, position, direction);

    if (
      maxDistance !== null &&
      Math.abs(closestValue - position) > maxDistance
    ) {
      // If maxDistance specified and closest is too far, use original position
      return position;
    }

    return closestValue;
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

    const snappedStart = this.#findNearestZeroCrossing(start, 'right'); // Snap forward
    const snappedEnd = this.#findNearestZeroCrossing(end, 'left'); // Snap backward

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

    const baseDuration = calcLoopEnd - calcLoopStart;

    // Only snap to zero crossing if it doesnt affect pitch (audio-rate loop duration)
    if (baseDuration > this.PITCH_PRESERVATION_THRESHOLD) {
      calcLoopStart = this.#findNearestZeroCrossing(calcLoopStart, 'right');
      calcLoopEnd = this.#findNearestZeroCrossing(calcLoopEnd, 'left');
    }

    // Apply drift to loop end position
    if (driftAmount > 0 && this.loopEnabled) {
      // Generate new drift only at the start of each loop iteration
      if (!this.nextDriftGenerated || this.loopCount === 0) {
        // For short loops (audio-rate), update drift less frequently
        const updateInterval =
          baseDuration <= this.PITCH_PRESERVATION_THRESHOLD
            ? Math.max(
                1,
                Math.floor(this.PITCH_PRESERVATION_THRESHOLD / baseDuration)
              )
            : 1;

        const shouldUpdateDrift =
          this.driftUpdateCounter % updateInterval === 0;

        if (shouldUpdateDrift) {
          this.currentLoopDrift = this.#generateLoopDrift(
            driftAmount,
            baseDuration
          );

          if (this.panDriftEnabled && driftAmount > 0 && this.loopCount > 0) {
            this.currentPanDrift = this.currentLoopDrift * 0.00064;
          } else {
            this.currentPanDrift = 0;
          }
        }

        this.driftUpdateCounter++;
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
    } else {
      // Ensure pan drift is set to zero if no loopDrift applied
      this.currentPanDrift = 0;
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
   * Generate a new drift amount for the current loop iteration
   * @param {number} driftAmount - Maximum drift amount (0-1)
   * @param {number} baseDuration - Base loop duration in samples
   * @returns {number} - Drift amount in samples
   */
  #generateLoopDrift(driftAmount, baseDuration) {
    if (driftAmount <= 0) return 0;

    // Generate random value between -1 and 1
    const randomFactor = (Math.random() - 0.5) * 2;

    // EXPERIMENTAL: Adaptive scaling based on loop duration
    let effectiveDriftAmount = driftAmount;

    if (this.enableAdaptiveDrift) {
      // Scale drift based on loop duration
      // Short loops (< 1024 samples ~= 23ms @ 44.1kHz) get much less drift
      // Long loops (> 8192 samples ~= 186ms @ 44.1kHz) get full drift
      const shortThreshold = 1024;
      const longThreshold = 8192;

      if (baseDuration < shortThreshold) {
        // Very short loops: reduce drift to 10% to preserve pitch
        effectiveDriftAmount *= 0.1;
      } else if (baseDuration < longThreshold) {
        // Medium loops: linear scaling from 10% to 100%
        const scaleFactor =
          0.1 +
          (0.9 * (baseDuration - shortThreshold)) /
            (longThreshold - shortThreshold);
        effectiveDriftAmount *= scaleFactor;
      }
      // Long loops: use full drift amount (no scaling)
    }

    // Scale by effective drift amount and base duration
    const maxDriftSamples = effectiveDriftAmount * baseDuration;

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

    // EXPERIMENTAL: Apply pan drift if enabled
    const basePan = parameters.pan[0];
    const effectivePan = this.panDriftEnabled
      ? Math.max(-1, Math.min(1, basePan + this.currentPanDrift))
      : basePan;

    // Handle different output structures
    let outputChannels;
    if (output instanceof Float32Array) {
      // Case 1: output is a single Float32Array (mono output - legacy)
      outputChannels = [output];
    } else if (
      Array.isArray(output) &&
      output.every((ch) => ch instanceof Float32Array)
    ) {
      // Case 2: output is array of Float32Arrays (stereo/multi-channel output)
      outputChannels = output;
    } else {
      console.error('Unexpected output structure:', {
        outputType: typeof output,
        isArray: Array.isArray(output),
        constructor: output?.constructor?.name,
        length: output?.length,
      });
      return true;
    }

    const numChannels = outputChannels.length; // Always process all output channels

    const isConstant = this.#getConstantFlags(parameters);

    // ===== Init playback position =====

    if (this.playbackPosition === 0) {
      this.playbackPosition = this.reversePlayback
        ? playbackRange.endSamples - 1
        : playbackRange.startSamples;
    }

    // ===== AUDIO PROCESSING =====

    for (let sample = 0; sample < outputChannels[0].length; sample++) {
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
      if (this.loopEnabled && this.loopCount < parameters.maxLoopCount[0]) {
        if (
          !this.reversePlayback &&
          this.playbackPosition >= loopRange.loopEndSamples
        ) {
          // Get the actual samples we're transitioning between
          const lastLoopSample =
            this.buffer[0][Math.floor(this.playbackPosition - 1)] || 0;
          const newFirstSample =
            this.buffer[0][Math.floor(loopRange.loopStartSamples)] || 0;

          const discontinuity = lastLoopSample - newFirstSample;

          if (this.enableLoopSmoothing && Math.abs(discontinuity) > 0.01) {
            // Simple exponential smoothing
            this.loopClickCompensation = discontinuity * 0.5;
            this.compensationDecay = 0.9; // Smooth over ~32 samples
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
        // Safety check: ensure output channel exists
        if (!outputChannels[channel]) {
          console.warn(
            `Output channel ${channel} does not exist. Available channels:`,
            outputChannels.length
          );
          continue;
        }

        // For mono buffers, use channel 0 for both left and right
        // For stereo buffers, use the appropriate channel
        const bufferChannelIndex = Math.min(channel, this.buffer.length - 1);
        const bufferChannel = this.buffer[bufferChannelIndex];

        // Linear interpolation between current and next positions
        const currentSample = bufferChannel[currentPosition] || 0;
        const nextSample = bufferChannel[nextPosition] || 0;
        let interpolatedSample =
          currentSample + interpWeight * (nextSample - currentSample);

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

        // Apply pan (only affects stereo output)
        let panAdjustedSample = finalSample;
        if (outputChannels.length === 2) {
          if (channel === 0) {
            // Left channel: reduce gain when panned right (positive pan)
            panAdjustedSample = finalSample * (1 - Math.max(0, effectivePan));
          } else if (channel === 1) {
            // Right channel: reduce gain when panned left (negative pan)
            panAdjustedSample = finalSample * (1 - Math.max(0, -effectivePan));
          }
        }

        // Basic hard limiting
        outputChannels[channel][sample] = Math.max(
          -1,
          Math.min(1, isFinite(panAdjustedSample) ? panAdjustedSample : 0)
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
