const DEFAULT_VELOCITY = {
  peak: { midi: 100, normalized: 0.78125 },
  sustain: { midi: 100, normalized: 0.78125 },
}; //as const;

const MIN_ABS_AMPLITUDE = 0.000001;

// envelope.js - Reusable envelope module
class Envelope {
  constructor(sampleRate, attackTime = 0.01, releaseTime = 0.3) {
    this.sampleRate = sampleRate;
    this.envelope = 0;
    this.gate = false;
    this.phase = 'idle'; // 'idle', 'attack', 'sustain', 'release'
    this.attackTime = attackTime;
    this.releaseTime = releaseTime;

    this.updateCoefficients(attackTime, releaseTime);
  }

  updateCoefficients(attackTime, releaseTime) {
    // Update coefficients only when parameters change
    this.attackCoef = 1 - Math.exp(-1 / (this.sampleRate * attackTime));
    this.releaseCoef = Math.exp(-1 / (this.sampleRate * releaseTime));
  }

  process(gate, attackTime, releaseTime) {
    // Update coefficients if needed
    if (this.attackTime !== attackTime || this.releaseTime !== releaseTime) {
      this.updateCoefficients(attackTime, releaseTime);
      this.attackTime = attackTime;
      this.releaseTime = releaseTime;
    }

    if (gate && !this.gate) {
      // Attack phase
      this.phase = 'attack';
    } else if (!gate && this.gate) {
      // Release phase
      this.phase = 'release';
    }

    switch (this.phase) {
      case 'attack':
        this.envelope += (1.0 - this.envelope) * this.attackCoef;
        if (this.envelope >= 0.999) {
          this.phase = 'sustain';
          this.envelope = 1.0;
        }
        break;
      case 'sustain':
        this.envelope = 1.0;
        break;
      case 'release':
        this.envelope *= this.releaseCoef;
        if (this.envelope < 0.0001) {
          this.phase = 'idle';
          this.envelope = 0;
        }
        break;
      case 'idle':
        this.envelope = 0;
        break;
    }

    this.gate = gate;
    return this.envelope;
  }
}

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
    this.velocity = 1;
    this.playbackPosition = 0;
    this._loopCount = 0;

    // Message handling
    this.port.onmessage = (event) => {
      const data = event.data;

      switch (data.type) {
        case 'voice:init':
          this.timing = new PlaybackTiming();
          this.envelope = new Envelope(sampleRate);
          this.useEnvelope = true;
          this.usePlaybackPosition = true;
          break;
        case 'voice:set_buffer':
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
          this.isPlaying = true;
          this.velocity = data.velocity || 1;
          this.playbackPosition = (data.offset || 0) * sampleRate;
          break;

        case 'voice:release': // make it clearer how to enter release phase
          this.isPlaying = false;
          break;

        case 'voice:stop':
          this.timing.stop(currentTime);
          this.isPlaying = false;
          break;

        case 'voice:usePlaybackPosition': // todo: add option to disable position tracking
          this.usePlaybackPosition = data.value;
          break;

        case 'voice:useEnvelope':
          this.useEnvelope = data.value;
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
        name: 'attackTime',
        defaultValue: 0.31,
        minValue: 0,
        maxValue: 2.0, // default for now
        automationRate: 'k-rate',
      },

      {
        name: 'releaseTime',
        defaultValue: 1.3,
        minValue: 0,
        maxValue: 5.0, // default for now
        automationRate: 'k-rate',
      },

      {
        name: 'playbackRate',
        defaultValue: 1,
        minValue: -4,
        maxValue: 4,
        automationRate: 'k-rate',
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
        automationRate: 'k-rate',
      },
      {
        name: 'loopEnd',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate',
      },
      {
        name: 'useEnvelope',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate',
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

    const pbRate = parameters.playbackRate[0];
    const loopEnabled = this.#isLoopEnabled(parameters.loop);
    const loopStart = parameters.loopStart[0] * sampleRate;
    const loopEnd = parameters.loopEnd[0] * sampleRate;

    const attackTime = parameters.attackTime[0];
    const releaseTime = parameters.releaseTime[0];
    const useEnvelope = parameters.useEnvelope[0] > 0.5;

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

      // Process envelope for this sample
      let envelopeValue = 1.0;
      if (useEnvelope) {
        envelopeValue = this.envelope.process(
          this.isPlaying,
          attackTime,
          releaseTime
        );
      }

      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position];
        const next = bufferChannel[nextPosition];
        const velocityGain = this.velocity;

        output[c][i] =
          (current + fraction * (next - current)) *
          velocityGain *
          envelopeValue;
      }

      // Advance playback position
      this.playbackPosition += pbRate;
    }

    const { playbackTime } = this.timing.getPlaybackProgress(currentTime);
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
