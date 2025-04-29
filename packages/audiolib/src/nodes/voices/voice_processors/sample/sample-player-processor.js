class PlaybackTiming {
  constructor() {
    this.clear();
  }

  clear() {
    this.startTime = null;
    this.stopTime = null;
    this.lengthInSeconds = null;
    this.offsetSeconds = 0;
    this.state = 'idle'; // 'idle', 'playing', 'stopped'
  }

  start(timeToStart, offsetSeconds = 0, lengthInSeconds = null) {
    this.startTime = timeToStart;
    this.offsetSeconds = offsetSeconds;
    this.stopTime = null;
    this.lengthInSeconds = lengthInSeconds;
    this.state = 'playing';
  }

  stop(timeToStop) {
    this.stopTime = timeToStop;
    this.state = 'stopped';
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
const MIN_ABS_AMPLITUDE = 0.001;

class SamplePlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = null;
    this.isPlaying = false;
    this.playbackPosition = 0;
    this.loopCount = 0;
    this.isReleasing = false;
    this.loopEnabled = false; // Initialize loop state
    this.timing = new PlaybackTiming();
    this.usePlaybackPosition = false;

    // Message handling
    this.port.onmessage = (event) => {
      const { type, value, buffer, offset, duration, time } = event.data;

      switch (type) {
        case 'voice:init':
          this.timing = new PlaybackTiming();
          this.usePlaybackPosition = false;
          this.loopEnabled = false;
          break;

        case 'voice:set_buffer':
          this.isPlaying = false;
          this.timing.clear();
          this.playbackPosition = 0;
          this.loopCount = 0;
          this.buffer = buffer;
          break;

        case 'voice:start':
          this.isReleasing = false;
          this.timing.start(time, offset || 0, duration);
          this.playbackPosition = (offset || 0) * sampleRate;
          this.isPlaying = true;
          break;

        case 'voice:release':
          this.isReleasing = true;
          break;

        case 'voice:stop':
          this.timing.stop(currentTime);
          this.isPlaying = false;
          this.isReleasing = false;
          break;

        case 'setLoopEnabled':
          this.loopEnabled = value;
          if (!value && this.isPlaying) {
            // If turning loop off, and we're past the end, stop right away
            if (this.playbackPosition >= this.buffer[0].length) {
              this.#onended(output);
            }
          }
          break;

        case 'voice:usePlaybackPosition':
          this.usePlaybackPosition = value;
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
        minValue: -4,
        maxValue: 4,
        automationRate: 'a-rate',
      },
      {
        name: 'loopStart',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate',
      },
      {
        name: 'loopEnd',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate',
      },
    ];
  }

  #fillWithSilence(output) {
    for (let channel = 0; channel < output.length; channel++) {
      output[channel].fill(0);
    }
  }

  #onended(output) {
    this.isPlaying = false;
    if (this.timing) this.timing.clear();
    this.playbackPosition = 0;
    this.port.postMessage({ type: 'voice:ended' });
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    if (!output || !this.buffer || !this.buffer.length || !this.isPlaying) {
      this.#onended(output);
      return true; // AudioWorklet will zero-fill automatically
    }

    if (this.timing.shouldStop(currentTime)) {
      this.#onended(output);
      return true; // AudioWorklet will zero-fill automatically
    }

    if (this.isReleasing && parameters.envGain[0] < MIN_ABS_AMPLITUDE) {
      this.#onended(output);
      return true; // AudioWorklet will zero-fill automatically
    }

    const pbRate = parameters.playbackRate[0];
    const loopStart = parameters.loopStart[0] * sampleRate;
    const loopEnd = parameters.loopEnd[0] * sampleRate;
    const envelopeGain = parameters.envGain[0];
    const velocityGain = parameters.velocity[0]; // seems to be already normalized from midi values

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
      if (this.loopEnabled && this.playbackPosition >= loopEnd) {
        this.playbackPosition = loopStart;
        this.loopCount++;
        this.port.postMessage({
          type: 'voice:looped',
          loopCount: this.loopCount,
        });
      }

      // Check for end of buffer
      if (this.playbackPosition >= bufferLength) {
        if (!this.loopEnabled) {
          this.#onended(output);
          return true;
        }
        this.playbackPosition = 0; // ? loopend === bufferLength
      }

      // Read and interpolate samples
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, bufferLength - 1);

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

    if (this.usePlaybackPosition) {
      this.port.postMessage({
        type: 'voice:position',
        position: this.playbackPosition / sampleRate,
        // seconds: playbackTime,
        // amplitude: output[0][output.length - 1],
      });
    }

    return true;
  }
}

registerProcessor('sample-player-processor', SamplePlayerProcessor);
