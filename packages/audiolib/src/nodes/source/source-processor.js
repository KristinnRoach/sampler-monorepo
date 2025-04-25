const DEFAULT_VELOCITY = {
  peak: { midi: 100, normalized: 0.78125 },
  sustain: { midi: 100, normalized: 0.78125 },
}; //as const;

const MIN_ABS_AMPLITUDE = 0.000001;

class PlaybackTiming {
  constructor() {
    this.clear();
  }

  clear() {
    this.startTime = null;
    this.stopTime = null;
    this.lengthInSeconds = null;
    this.offsetSeconds = 0;
  }

  start(timeToStart, offsetSeconds = 0, lengthInSeconds = null) {
    this.startTime = timeToStart;
    this.offsetSeconds = offsetSeconds;
    this.stopTime = null;
    this.lengthInSeconds = lengthInSeconds;
  }

  stop(timeToStop) {
    this.stopTime = timeToStop;
  }

  isActive(now) {
    if (!this.startTime) return false;
    if (now < this.startTime) return false;
    if (this.stopTime && now >= this.stopTime) return false;
    if (this.lengthInSeconds && now >= this.startTime + this.lengthInSeconds)
      return false;

    return true;
  }

  shouldStop(now) {
    if (!this.startTime) return false;
    if (this.stopTime && now >= this.stopTime) return true;
    if (this.lengthInSeconds && now >= this.startTime + this.lengthInSeconds)
      return true;

    return false;
  }

  getPlaybackProgress(now) {
    return {
      currentTime: now,
      elapsedTime: now - this.startTime,
      playbackTime: now - this.startTime + this.offsetSeconds,
    };
  }
}

class SourceProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = null;
    this.isPlaying = false;
    this.playbackPosition = 0;
    this._loopCount = 0;

    // Message handling
    this.port.onmessage = (event) => {
      const data = event.data;

      switch (data.type) {
        case 'voice:init':
          this.timing = new PlaybackTiming();
          this.usePlaybackPosition = false;
          break;
        case 'voice:set_buffer':
          this.isPlaying = false;
          this.timing.clear();
          this.playbackPosition = 0;
          this._loopCount = 0;

          this.buffer = data.buffer;
          // ? use data.duration // ? clear timing and reset params & vars ?
          console.debug(
            `buffer set for voice with nodeId: ${this.nodeId}, 
            length: ${this.buffer[0].length}, 
            duration in seconds: ${data.duration}`
          );
          break;

        case 'voice:start':
          this.timing.start(currentTime, data.offset || 0, data.duration);
          this.playbackPosition = (data.offset || 0) * sampleRate;
          this.isPlaying = true;
          break;

        case 'voice:release': // make it clearer how to enter release phase
          // this.isPlaying = false;
          break;

        case 'voice:stop':
          this.timing.stop(currentTime);
          this.isPlaying = false;
          break;

        case 'voice:usePlaybackPosition': // todo: add option to disable position tracking
          this.usePlaybackPosition = data.value;
          break;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'playbackPosition',
        defaultValue: 0,
        minValue: 0,
        // maxValue: 1000000, // ?
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
        minValue: -4,
        maxValue: 4,
        automationRate: 'a-rate',
      },
      {
        name: 'loop',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate',
      },
      {
        name: 'loopStart',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'a-rate',
      },
      {
        name: 'loopEnd',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'a-rate',
      },
    ];
  }

  #isLoopEnabled(loopParam) {
    return loopParam[0] > 0.5;
  }

  #fillWithSilence(output) {
    for (let channel = 0; channel < output.length; channel++) {
      output[channel].fill(0);
    }
  }

  #interpolateSample(channel, position, fraction) {
    const bufferChannel = this.buffer[channel];
    const current = bufferChannel[position];
    const next =
      bufferChannel[Math.min(position + 1, bufferChannel.length - 1)];
    return current + fraction * (next - current);
  }

  #onended(output, zeroFillBuffer = true, resetPlayPosition = true) {
    this.isPlaying = false;
    this._loopCount = 0;
    this.timing.clear();
    if (zeroFillBuffer) this.#fillWithSilence(output);
    if (resetPlayPosition) this.playbackPosition = 0;
    this.port.postMessage({ type: 'voice:ended' });
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    if (!output || !this.buffer || !this.buffer.length || !this.isPlaying) {
      this.#fillWithSilence(output);
      return true;
    }

    // Check timing state
    if (this.timing.shouldStop(currentTime)) {
      this.#onended(output);
      return true;
    }

    const loopEnabled = this.#isLoopEnabled(parameters.loop);

    const pbRate = parameters.playbackRate[0];
    const loopStart = parameters.loopStart[0] * sampleRate;
    const loopEnd = parameters.loopEnd[0] * sampleRate;

    const envelopeGain = parameters.envGain[0];
    const velocityGain = parameters.velocity[0] / 127;

    const numChannels = Math.min(output.length, this.buffer.length);
    const bufferLength = this.buffer[0].length;

    if (!this.timing.isActive(currentTime)) {
      console.error('timing not active');
      this.#onended(output);
      return true;
    }

    // Process samples
    for (let i = 0; i < output[0].length; i++) {
      // Handle looping
      if (loopEnabled && this.playbackPosition >= loopEnd) {
        this.playbackPosition = loopStart;
        this.port.postMessage({
          type: 'voice:looped',
          loopCount: ++this._loopCount,
        });
      }

      // Check for end of buffer
      if (this.playbackPosition >= bufferLength) {
        if (!loopEnabled) {
          this.#onended(output);
          return true;
        }
        this.playbackPosition = 0; // ? loopend === bufferLength
      }

      // Read and interpolate samples
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, bufferLength - 1);

      // const envelopeGain = parameters.envGain[i];
      // const velocityGain = parameters.velocity[i] / 127;

      // const pbRate = parameters.playbackRate[i];
      // const loopStart = parameters.loopStart[i] * sampleRate;
      // const loopEnd = parameters.loopEnd[i] * sampleRate;

      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position];
        const next = bufferChannel[nextPosition];

        output[c][i] =
          (current + fraction * (next - current)) * velocityGain * envelopeGain;
      }

      // Advance playback position
      this.playbackPosition += pbRate;
    }

    const playbackTime = currentTime - this.startTime;
    const currentAmplitude = output[0][output.length - 1]; // ? last sample vs first vs median
    const absAmplitude = Math.abs(currentAmplitude);
    // Only store variable here and move the condition to beginning of process with the others
    // get rid off redundant stuff
    if (playbackTime > 0.3 && absAmplitude < MIN_ABS_AMPLITUDE) {
      // fix hardcoded 0.3 threshold // make robust
      this.isPlaying = false;
      this.timing.clear();
      this.port.postMessage({ type: 'voice:ended' });
    } else if (this.usePlaybackPosition) {
      this.port.postMessage({
        type: 'voice:position_and_amplitude',
        position: this.playbackPosition / sampleRate,
        seconds: playbackTime,
        amplitude: currentAmplitude,
      });
    }

    return true;
  }
}

registerProcessor('source-processor', SourceProcessor);
