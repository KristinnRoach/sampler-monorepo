/**
 * Source processor worklet code as a string constant
 * This allows the worklet to be loaded dynamically without file access
 */
export const sourceProcessorCode = `class SourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'targetStart', defaultValue: 0 },
      { name: 'targetEnd', defaultValue: 1 },
      { name: 'targetLoopStart', defaultValue: 0 },
      { name: 'targetLoopEnd', defaultValue: 1 },
      { name: 'interpolationSpeed', defaultValue: 0.05 },
      { name: 'playbackRate', defaultValue: 1.0 },
      { name: 'targetPlaybackRate', defaultValue: 1.0 },
    ];
  }

  constructor() {
    super();
    this.currentStart = 0;
    this.currentEnd = 1;
    this.currentLoopStart = 0;
    this.currentLoopEnd = 1;
    this.currentPlaybackRate = 1.0;
    this.playing = false;
    this.buffer = null;
    this.playbackPosition = 0;
    this.sampleRate = 44100; // Will be overridden by actual sample rate
    this.sendUpdates = false;
    this.updateCounter = 0;
    this.updateInterval = 100; // frames between updates
    this.loopEnabled = false;

    // Position streaming properties
    this.streamPosition = false;
    this.positionUpdateInterval = 5; // Lower value = more frequent updates

    this.port.onmessage = (event) => {
      if (event.data.type === 'setBuffer') {
        this.buffer = event.data.buffer; // Array of channel data
        this.sampleRate = event.data.sampleRate;
      } else if (event.data.type === 'play') {
        this.playing = true;
        // Ensure start point is within valid buffer range
        if (this.buffer) {
          const maxSample = this.buffer[0].length - 1;
          const startSample = Math.floor(this.currentStart * this.sampleRate);
          // Ensure start point is valid
          this.playbackPosition = Math.min(startSample, maxSample);
        } else {
          this.playbackPosition = 0;
        }
      } else if (event.data.type === 'stop') {
        this.playing = false;
      } else if (event.data.type === 'enableLooping') {
        this.loopEnabled = true;
      } else if (event.data.type === 'disableLooping') {
        this.loopEnabled = false;
      } else if (event.data.type === 'enableUpdates') {
        this.sendUpdates = true;
        this.updateInterval = event.data.interval || 100;
      } else if (event.data.type === 'disableUpdates') {
        this.sendUpdates = false;
      } else if (event.data.type === 'streamPosition') {
        this.streamPosition = event.data.enabled;
        if (event.data.interval !== undefined) {
          this.positionUpdateInterval = Math.max(1, event.data.interval);
        }
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    if (!this.playing || !this.buffer) return true;

    // Get current parameter values
    const targetStart = parameters.targetStart[0];
    const targetEnd = parameters.targetEnd[0];
    const targetLoopStart = parameters.targetLoopStart[0];
    const targetLoopEnd = parameters.targetLoopEnd[0];
    const interpolationSpeed = parameters.interpolationSpeed[0];
    const targetPlaybackRate = parameters.targetPlaybackRate[0];

    // Start and end values change immediately
    this.currentStart = targetStart;
    this.currentEnd = targetEnd;

    // Interpolating current values toward target values:
    // Loop points
    this.currentLoopStart +=
      (targetLoopStart - this.currentLoopStart) * interpolationSpeed;
    this.currentLoopEnd +=
      (targetLoopEnd - this.currentLoopEnd) * interpolationSpeed;
    // Playback rate (more glide: slower interpolation speed)
    this.currentPlaybackRate +=
      (targetPlaybackRate - this.currentPlaybackRate) * interpolationSpeed;

    // Convert time values to sample indices
    const startSample = Math.floor(this.currentStart * this.sampleRate);
    const endSample = Math.floor(this.currentEnd * this.sampleRate);
    const loopStartSample = Math.floor(this.currentLoopStart * this.sampleRate);
    const loopEndSample = Math.floor(this.currentLoopEnd * this.sampleRate);

    // If playback position is out of bounds, reset it
    if (
      !this.playbackPosition ||
      this.playbackPosition < startSample ||
      this.playbackPosition >= endSample
    ) {
      // Ensure we don't exceed buffer boundaries
      const maxSample = this.buffer[0].length - 1;
      this.playbackPosition = Math.min(startSample, maxSample);
    }

    // Process each channel
    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];

      // Only use available channels from the buffer
      const bufferChannel =
        channel < this.buffer.length ? this.buffer[channel] : this.buffer[0]; // Fallback to first channel
      const bufferLength = bufferChannel.length;

      for (let i = 0; i < outputChannel.length; i++) {
        // Linear interpolation for better sound quality at non-integer positions
        const exactPosition = this.playbackPosition;
        const position1 = Math.floor(exactPosition);
        const position2 = Math.min(position1 + 1, bufferLength - 1);
        const fraction = exactPosition - position1;

        // Get sample using linear interpolation with boundary checking
        const sample1 =
          position1 < bufferLength ? bufferChannel[position1] || 0 : 0;
        const sample2 =
          position2 < bufferLength ? bufferChannel[position2] || 0 : 0;
        outputChannel[i] = sample1 + fraction * (sample2 - sample1);

        // Advance playback position using playback rate
        this.playbackPosition += this.currentPlaybackRate;

        // Handle looping or stopping when reaching end
        if (this.playbackPosition >= endSample) {
          if (
            this.loopEnabled &&
            loopEndSample <= endSample &&
            loopStartSample >= startSample
          ) {
            // If looping is enabled and loop points are within sample boundaries, loop back
            this.playbackPosition = loopStartSample;
          } else {
            // If not looping or loop points are invalid, stop playback
            this.playing = false;
            break;
          }
        }

        // Handle looping when playback position is within loop region
        if (
          this.loopEnabled &&
          this.playbackPosition >= loopEndSample &&
          loopEndSample <= endSample &&
          loopStartSample >= startSample
        ) {
          this.playbackPosition = loopStartSample;
        }
      }
    }

    // Send updates to main thread if enabled
    if (this.sendUpdates || this.streamPosition) {
      this.updateCounter++;

      // Handle parameter updates at normal interval
      if (this.sendUpdates && this.updateCounter >= this.updateInterval) {
        this.updateCounter = 0;
        this.port.postMessage({
          type: 'update',
          start: this.currentStart,
          end: this.currentEnd,
          loopStart: this.currentLoopStart,
          loopEnd: this.currentLoopEnd,
          playbackRate: this.currentPlaybackRate,
          isPlaying: this.playing,
        });
      }

      // Stream position at higher frequency if enabled
      if (
        this.streamPosition &&
        this.playing &&
        this.updateCounter % this.positionUpdateInterval === 0
      ) {
        // Convert sample position back to seconds for consistent API
        const currentPositionSeconds = this.playbackPosition / this.sampleRate;
        this.port.postMessage({
          type: 'positionUpdate',
          position: currentPositionSeconds,
        });
      }
    }

    return true;
  }
}

registerProcessor('source-processor', SourceProcessor);`;
