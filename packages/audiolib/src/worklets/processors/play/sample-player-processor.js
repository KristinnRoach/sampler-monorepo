import { MIN_ABS_AMPLITUDE } from '../shared/constants';

class SamplePlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.buffer = null;

    this.playbackPosition = 0;
    this.loopCount = 0;
    this.maxLoopCount = Number.MAX_SAFE_INTEGER;

    // Timing state (replacing PlaybackTiming)
    this.isPlaying = false;
    this.startTime = 0; // When playback started
    this.startOffset = 0; // Starting position in seconds
    this.scheduledEndTime = null; // When playback should end (if duration specified)

    // Zero crossing constraints
    this.minZeroCrossing = 0;
    this.maxZeroCrossing = 0;

    // Other flags
    this.isReleasing = false;
    this.loopEnabled = false;
    this.usePlaybackPosition = false;

    // Cache quantized values per process block
    this.blockQuantizedLoopStart = 0;
    this.blockQuantizedLoopEnd = 0;
    this.lastProcessedLoopStart = -1;
    this.lastProcessedLoopEnd = -1;

    this.port.onmessage = this.#handleMessage.bind(this);
  }

  #handleMessage(event) {
    const { type, value, buffer, startOffset, duration, when, zeroCrossings } =
      event.data;

    switch (type) {
      case 'voice:init':
        this.#resetState();
        break;

      case 'voice:set_buffer':
        this.#resetState();
        this.buffer = null;
        this.buffer = buffer;
        break;

      case 'voice:set_zero_crossings':
        // this.zeroCrossings = zeroCrossings || [];
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
        this.startTime = when || currentTime;

        this.playbackPosition = this.startOffset * sampleRate;

        if (duration) {
          // todo: remove or use
          this.scheduledEndTime = this.startTime + duration;

          const paramEndOffset = this.#getCurrentParamValue('endOffset');
          if (paramEndOffset > 0) {
            // If endOffset is set, use it to calculate scheduled end time
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
          type: 'voice:started',
          time: currentTime,
          actualStartOffset: this.startOffset,
        });
        break;

      case 'voice:release':
        this.isReleasing = true;
        break;

      case 'voice:stop':
        this.isPlaying = false;
        break;

      case 'setLoopEnabled':
        this.loopEnabled = value;
        break;

      case 'voice:usePlaybackPosition':
        this.usePlaybackPosition = value;
        break;
    }
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'playbackPosition',
        defaultValue: 0,
        minValue: 0, // ???
        maxValue: 1000, // ???
        automationRate: 'k-rate',
      },
      {
        name: 'envGain',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate',
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
        minValue: -8, // 0.1, // ? test negative -8,
        maxValue: 8, // ? test 10,
        automationRate: 'k-rate', // ! a or k ?
      },
      {
        name: 'startOffset',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate',
      },
      {
        name: 'endOffset',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate',
      },
      {
        name: 'loopStart',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate', // a or k ?
      },
      {
        name: 'loopEnd',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate', // a or k ?
      },
    ];
  }

  #resetState() {
    this.isPlaying = false;
    this.isReleasing = false;
    this.startTime = 0;
    this.startOffset = 0;
    this.scheduledEndTime = null;
    this.playbackPosition = 0;
    this.loopCount = 0;
    this.maxLoopCount = Number.MAX_SAFE_INTEGER;
  }

  #onended(output) {
    this.isPlaying = false;
    this.isReleasing = false;
    this.playbackPosition = 0;
    this.port.postMessage({ type: 'voice:ended' });
  }

  #shouldEnd(parameters) {
    return (
      !this.buffer ||
      !this.buffer.length ||
      !this.isPlaying ||
      (this.scheduledEndTime !== null &&
        currentTime >= this.scheduledEndTime) ||
      (this.isReleasing && parameters.envGain[0] <= MIN_ABS_AMPLITUDE)
    );
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

  #getCurrentParamValue(paramName) {
    if (!this.parameters) return 0;

    const param = this.parameters.get(paramName);
    if (!param) return 0;

    return param.value || 0;
  }

  #normalizeMidi(midiValue) {
    const norm = midiValue / 127;
    return Math.max(0, Math.min(1, norm));
  }

  #getParamValueInSamples(paramName, parameters) {
    if (!parameters || !parameters[paramName]) return 0;

    let valueInSamples = parameters[paramName][0] * sampleRate;

    // Apply zero crossing constraint for "buffer-position" parameters
    if (paramName === 'loopStart' || paramName === 'loopEnd') {
      return this.#findNearestZeroCrossing(valueInSamples);
    }

    return valueInSamples;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    if (!output || this.#shouldEnd(parameters)) {
      this.#onended(output);
      return true;
    }

    // If this is the first process call after starting playback,
    // initialize playback position using startOffset
    if (this.isPlaying && this.playbackPosition === 0) {
      const startOffsetSec = parameters.startOffset[0];
      this.playbackPosition = startOffsetSec * sampleRate;
    }

    const pbRate = parameters.playbackRate[0];

    // Get start and end offsets from parameters and convert to samples
    const startOffsetSec = parameters.startOffset[0];
    const endOffsetSec = parameters.endOffset[0];

    // Convert to samples
    const startOffsetSamples = startOffsetSec * sampleRate;

    // Handle end offset - if endOffset is set (greater than 0), use it to limit playback
    const bufferLength = this.buffer[0].length;
    let effectiveBufferEnd = bufferLength;
    if (endOffsetSec > 0) {
      // Treat endOffset as an absolute position from the beginning
      effectiveBufferEnd = Math.min(bufferLength, endOffsetSec * sampleRate);
    }

    // Quantize once per block, not per sample
    const rawLoopStart = parameters.loopStart[0] * sampleRate;
    const rawLoopEnd = parameters.loopEnd[0] * sampleRate;

    const loopStart = rawLoopStart;
    const loopEnd = rawLoopEnd;

    const constrainedLoopEnd = Math.min(loopEnd, effectiveBufferEnd);

    const envelopeGain = parameters.envGain[0];
    const velocitySensitivity = 0.9;
    const normalizedVelocity = this.#normalizeMidi(parameters.velocity[0]);
    const velocityGain = normalizedVelocity * velocitySensitivity;

    const numChannels = Math.min(output.length, this.buffer.length);

    // Process samples
    for (let i = 0; i < output[0].length; i++) {
      // Handle looping
      if (
        this.loopEnabled &&
        this.playbackPosition >= constrainedLoopEnd &&
        this.loopCount < this.maxLoopCount
      ) {
        this.playbackPosition = loopStart;
        this.loopCount++;
      }

      // Check for end of buffer or effective end position
      if (this.playbackPosition >= effectiveBufferEnd) {
        this.#onended(output);
        return true;
      }

      // Read and interpolate samples
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, effectiveBufferEnd - 1);

      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position];
        const next = bufferChannel[nextPosition];

        // output[c][i] =
        //   (current + fraction * (next - current)) * velocityGain * envelopeGain;

        const sample =
          (current + fraction * (next - current)) * velocityGain * envelopeGain;
        output[c][i] = Math.max(-1, Math.min(1, isFinite(sample) ? sample : 0));
      }
      // Advance playback position
      this.playbackPosition += pbRate;
    }

    if (this.usePlaybackPosition) {
      this.port.postMessage({
        type: 'voice:position',
        position: this.playbackPosition / sampleRate,
      });
    }

    return true;
  }
}

registerProcessor('sample-player-processor', SamplePlayerProcessor);

// IGNORE BELOW - OLD CODE

// TODO: test with and without internal zero snapping. Remove this if works well without it.
// // Calculate max acceptable distance based on loop length with scaling
// const loopLength = Math.abs(rawLoopEnd - rawLoopStart);

// let maxDistance;
// if (loopLength < 50) {
//   // Very short loops (< ~1ms at 44.1kHz)
//   maxDistance = Math.min(loopLength * 0.3, 20); // 30% tolerance, max 20 samples
// } else if (loopLength < 200) {
//   // Short loops (< ~4.5ms)
//   maxDistance = Math.min(loopLength * 0.15, 50); // 15% tolerance
// } else {
//   maxDistance = Math.min(loopLength * 0.1, 100); // Original formula for longer loops
// }

// if (rawLoopStart !== this.lastProcessedLoopStart) {
//   this.blockQuantizedLoopStart = this.#findNearestZeroCrossing(
//     rawLoopStart,
//     maxDistance
//   );
//   this.lastProcessedLoopStart = rawLoopStart;
// }

// if (rawLoopEnd !== this.lastProcessedLoopEnd) {
//   this.blockQuantizedLoopEnd = this.#findNearestZeroCrossing(
//     rawLoopEnd,
//     maxDistance
//   );
//   this.lastProcessedLoopEnd = rawLoopEnd;
// }

// Use cached values in the sample loop
// const loopStart = this.blockQuantizedLoopStart;
// const loopEnd = this.blockQuantizedLoopEnd;
// TODO: test with and without internal zero snapping. Remove this if works well without it.

// #findNearestZeroCrossing(position) {
//   if (!this.zeroCrossings || this.zeroCrossings.length === 0) {
//     return position;
//   }

//   // Find the closest zero crossing to the requested position
//   return this.zeroCrossings.reduce(
//     (prev, curr) =>
//       Math.abs(curr - position) < Math.abs(prev - position) ? curr : prev,
//     position
//   );
// }
