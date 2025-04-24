// Helper function to handle timing and scheduling
function scheduleTiming(currentTime, startTime, stopTime) {
  return {
    isPlaying:
      currentTime >= startTime &&
      (stopTime === null || stopTime === undefined || currentTime < stopTime),
    progress: currentTime - startTime,
  };
}

class SourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'playbackRate',
        defaultValue: 1.0,
        minValue: 0.1,
        maxValue: 10.0,
        automationRate: 'a-rate',
      },
      {
        name: 'loopStart',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 1000.0,
        automationRate: 'a-rate',
      },
      {
        name: 'loopEnd',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 1000.0,
        automationRate: 'a-rate',
      },
      {
        name: 'loop',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 1.0,
        automationRate: 'k-rate',
      },
    ];
  }

  constructor(options) {
    super();

    // Initialize default state
    this.buffer = [];
    this.sampleRate = 48000;
    this.playbackPosition = 0;
    // this.isLooping = false;
    this.startTime = null;
    this.stopTime = null;
    this.startOffset = 0;
    this.duration = undefined;
    this.endTime = null;
    this.velocity = 1.0; // todo: amp env class import here + velocity

    // Initialize the options with defaults in case values are missing // ? spread
    const processorOptions = options?.processorOptions || {};

    // Process audio data if provided
    if (
      processorOptions.audioData &&
      Array.isArray(processorOptions.audioData)
    ) {
      this.buffer = processorOptions.audioData;
    }

    // Set sample rate if provided
    if (processorOptions.sampleRate) {
      this.sampleRate = processorOptions.sampleRate;
    }

    // Handle messages from main thread
    this.port.onmessage = (event) => {
      const data = event.data;

      if (data.type === 'setBuffer') {
        this.buffer = data.buffer;
        this.sampleRate = data.sampleRate;
        // todo: more to reset on set buffer?
      } else if (data.type === 'start') {
        this.stopTime = null;
        this.endTime = null;
        this.startTime = data.time;
        this.startOffset = data.offset || 0;
        this.duration = data.duration;
        // this.isLooping = !!data.loopEnabled;
        if (this.duration !== undefined) {
          this.endTime = this.startTime + this.duration;
        }
        // else if (data.type === 'noteOn') {
        //   this.currentNote = data.midiNote;
        //   this.velocity = data.velocity || 1.0;
        // }

        // Initialize playback position based on offset
        this.playbackPosition = Math.floor(this.startOffset * this.sampleRate);
      } else if (data.type === 'stop') {
        this.stopTime = data.time + 0.01; // ! test: adding 0.05 cause immediate does not work
      } else if (data.type === 'debug-loop') {
        console.log('Current loop (enabled) value:', event.data.value);
      }
    };
  }

  #isLoopEnabled(loopParam) {
    return (loopParam[0] ?? 0) > 0.5;
  }

  process(inputs, outputs, parameters) {
    // Get output channel data
    const output = outputs[0];
    const numChannels = output.length;

    // Skip processing if no buffer or channels
    if (
      !this.buffer ||
      !this.buffer.length ||
      numChannels === 0 ||
      !this.startTime
    ) {
      return true;
    }

    // Calculate current time from currentFrame and sampleRate
    const currentTime = currentFrame / sampleRate;

    if (!this._hasLoggedProcessing && this.buffer && this.buffer.length) {
      this._hasLoggedProcessing = true;
    }

    // Get parameter values with fallbacks
    const playbackRate = parameters.playbackRate || [1.0];
    const loopStart = parameters.loopStart || [0.0];
    const loopEnd = parameters.loopEnd || [0.0];
    const loop = parameters.loop || [0.0];
    const shouldLoop = this.#isLoopEnabled(loop);

    // Single-value vs. audio-rate parameters
    const isPlaybackRateConstant = playbackRate.length === 1;
    const isLoopStartConstant = loopStart.length === 1;
    const isLoopEndConstant = loopEnd.length === 1;
    const isLoopConstant = loop.length === 1;

    // Get buffer info
    const bufferLength = this.buffer[0].length;

    // Check playback timing relative to current time
    const timing = scheduleTiming(currentTime, this.startTime, this.stopTime);

    if (!timing.isPlaying) {
      // Fill output with silence if not playing
      for (let c = 0; c < numChannels; c++) {
        const outputChannel = output[c];
        for (let i = 0; i < outputChannel.length; i++) {
          outputChannel[i] = 0;
        }
      }

      // Check if we need to notify that playback ended
      if (
        this.startTime !== null &&
        !this.#isLoopEnabled(loop) &&
        (currentTime >= this.stopTime ||
          (this.endTime !== null && currentTime >= this.endTime))
      ) {
        this.port.postMessage({ type: 'ended' });
        this.stopTime = null;
        this.endTime = null;
        this.startTime = null;
      }

      return true;
    }

    // todo: simplify loop logic
    // Process each sample in the current block
    for (let i = 0; i < output[0].length; i++) {
      // Get parameter values for this sample
      const pbRate = isPlaybackRateConstant ? playbackRate[0] : playbackRate[i];
      const loopS = isLoopStartConstant ? loopStart[0] : loopStart[i];
      const loopE = isLoopEndConstant ? loopEnd[0] : loopEnd[i];
      const shouldLoop = isLoopConstant ? loop[0] > 0.5 : loop[i] > 0.5;

      // Calculate loop points in samples
      // const loopStartSample = Math.f16round(loopS * this.sampleRate); // * this.sampleRate;
      // const loopEndSample = Math.f16round(loopE * this.sampleRate); // * this.sampleRate

      const loopStartSample = Math.floor(loopS * this.sampleRate);
      const loopEndSample = Math.min(
        Math.max(
          Math.floor(loopE * this.sampleRate),
          loopStartSample + 1 // Ensure loopEnd is at least one sample after loopStart
        ),
        bufferLength - 1
      );

      // const loopEndSample = Math.max(
      //   Math.floor(loopE * this.sampleRate),
      //   loopStartSample + 1 // Ensure loopEnd is at least one sample after loopStart
      // );

      // Check duration-based ending
      if (
        this.endTime !== null &&
        currentTime + i / this.sampleRate >= this.endTime &&
        !this.#isLoopEnabled(loop)
      ) {
        // Fill remaining samples with silence
        for (let c = 0; c < numChannels; c++) {
          output[c][i] = 0;
        }

        // Only send ended message once
        if (i === 0) {
          this.port.postMessage({ type: 'ended' });
          this.startTime = null; // ?! go through and simplify / cleanup
          this.stopTime = null;
          this.endTime = null;
        }

        continue;
      }

      // Handle looping logic
      if (shouldLoop && this.playbackPosition >= loopEndSample) {
        // setInterval(() => {
        //   console.debug({ playPos: this.playbackPosition }); // !remove
        //   console.debug({ loopEndSample }); // !remove
        //   console.debug({ loopStart_sample: loopStartSample }); // !remove
        // }, 400);

        this.playbackPosition = loopStartSample;
      }

      // Check if we've reached the end of the buffer
      if (this.playbackPosition >= bufferLength) {
        if (shouldLoop) {
          this.playbackPosition = loopStartSample;
        } else {
          // End of buffer reached without looping
          for (let c = 0; c < numChannels; c++) {
            output[c][i] = 0;
          }

          // Only send ended message once
          if (i === 0) {
            this.port.postMessage({ type: 'ended' });
            this.startTime = null; // ?!
            this.stopTime = null;
            this.endTime = null;
          }

          continue;
        }
      }

      // Read sample with basic interpolation for fractional positions
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, bufferLength - 1);

      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position];
        const next = bufferChannel[nextPosition];
        const velocityGain = this.velocity || 1.0;

        // Linear interpolation between samples
        output[c][i] = (current + fraction * (next - current)) * velocityGain;
      }

      // Advance playback position
      this.playbackPosition += pbRate;
    }

    return true;
  }
}

registerProcessor('source-processor', SourceProcessor);
