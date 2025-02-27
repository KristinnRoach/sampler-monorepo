class LoopInterpolatorProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'targetLoopStart', defaultValue: 0 },
      { name: 'targetLoopEnd', defaultValue: 1 },
      { name: 'interpolationSpeed', defaultValue: 0.05 },
    ];
  }

  constructor() {
    super();
    this.currentLoopStart = 0;
    this.currentLoopEnd = 1;
    this.playing = false;
    this.buffer = null;
    this.playbackPosition = 0;
    this.sampleRate = 44100; // Will be overridden by actual sample rate

    this.port.onmessage = (event) => {
      if (event.data.type === 'setBuffer') {
        this.buffer = event.data.buffer; // Array of channel data
        this.sampleRate = event.data.sampleRate;
      } else if (event.data.type === 'play') {
        this.playing = true;
      } else if (event.data.type === 'stop') {
        this.playing = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    if (!this.playing || !this.buffer) return true;

    // Get current parameter values
    const targetLoopStart = parameters.targetLoopStart[0];
    const targetLoopEnd = parameters.targetLoopEnd[0];
    const interpolationSpeed = parameters.interpolationSpeed[0];

    // Smoothly interpolate current values toward targets
    this.currentLoopStart +=
      (targetLoopStart - this.currentLoopStart) * interpolationSpeed;
    this.currentLoopEnd +=
      (targetLoopEnd - this.currentLoopEnd) * interpolationSpeed;

    // Convert time values to sample indices
    const loopStartSample = Math.floor(this.currentLoopStart * this.sampleRate);
    const loopEndSample = Math.floor(this.currentLoopEnd * this.sampleRate);

    if (
      !this.playbackPosition ||
      this.playbackPosition < loopStartSample ||
      this.playbackPosition >= loopEndSample
    ) {
      this.playbackPosition = loopStartSample;
    }

    // Process each channel
    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];

      // Only use available channels from the buffer
      const bufferChannel =
        channel < this.buffer.length ? this.buffer[channel] : this.buffer[0]; // Fallback to first channel

      for (let i = 0; i < outputChannel.length; i++) {
        // Copy sample from buffer to output
        outputChannel[i] = bufferChannel[this.playbackPosition];

        // Increment position and handle loop
        this.playbackPosition++;
        if (this.playbackPosition >= loopEndSample) {
          this.playbackPosition = loopStartSample;
        }
      }
    }

    return true;
  }
}

registerProcessor('loop-interpolator', LoopInterpolatorProcessor);

// class LoopInterpolatorProcessor extends AudioWorkletProcessor {
//   static get parameterDescriptors() {
//     return [
//       { name: 'targetLoopStart', defaultValue: 0 },
//       { name: 'targetLoopEnd', defaultValue: 1 },
//       { name: 'interpolationSpeed', defaultValue: 0.05 },
//     ];
//   }

//   constructor() {
//     super();
//     this.currentLoopStart = 0;
//     this.currentLoopEnd = 1;
//     this.playing = false;
//     this.buffer = null;
//     this.playbackPosition = 0;
//     this.sampleRate = 44100; // Will be overridden by actual sample rate

//     this.port.onmessage = (event) => {
//       if (event.data.type === 'setBuffer') {
//         this.buffer = event.data.buffer;
//       } else if (event.data.type === 'play') {
//         this.playing = true;
//       } else if (event.data.type === 'stop') {
//         this.playing = false;
//       }
//     };
//   }

//   process(inputs, outputs, parameters) {
//     const output = outputs[0];

//     if (!this.playing || !this.buffer) return true;

//     // Get current parameter values
//     const targetLoopStart = parameters.targetLoopStart[0];
//     const targetLoopEnd = parameters.targetLoopEnd[0];
//     const interpolationSpeed = parameters.interpolationSpeed[0];

//     // Smoothly interpolate current values toward targets
//     this.currentLoopStart +=
//       (targetLoopStart - this.currentLoopStart) * interpolationSpeed;
//     this.currentLoopEnd +=
//       (targetLoopEnd - this.currentLoopEnd) * interpolationSpeed;

//     // Convert time values to sample indices
//     const loopStartSample = Math.floor(this.currentLoopStart * sampleRate);
//     const loopEndSample = Math.floor(this.currentLoopEnd * sampleRate);

//     if (
//       !this.playbackPosition ||
//       this.playbackPosition < loopStartSample ||
//       this.playbackPosition >= loopEndSample
//     ) {
//       this.playbackPosition = loopStartSample;
//     }

//     // Process each channel
//     for (let channel = 0; channel < output.length; channel++) {
//       const outputChannel = output[channel];

//       // Only use available channels from the buffer
//       const bufferChannel =
//         channel < this.buffer.numberOfChannels
//           ? this.buffer.getChannelData(channel)
//           : this.buffer.getChannelData(0); // Fallback to first channel

//       for (let i = 0; i < outputChannel.length; i++) {
//         // Copy sample from buffer to output
//         outputChannel[i] = bufferChannel[this.playbackPosition];

//         // Increment position and handle loop
//         this.playbackPosition++;
//         if (this.playbackPosition >= loopEndSample) {
//           this.playbackPosition = loopStartSample;
//         }
//       }
//     }

//     return true;
//   }
// }

// registerProcessor('loop-interpolator', LoopInterpolatorProcessor);

// class LoopInterpolator extends AudioWorkletProcessor {
//   static get parameterDescriptors() {
//     return [
//       { name: 'targetLoopStart', defaultValue: 0 },
//       { name: 'targetLoopEnd', defaultValue: 1 },
//       { name: 'interpolationSpeed', defaultValue: 0.1 },
//     ];
//   }

//   constructor() {
//     super();
//     this.currentLoopStart = 0;
//     this.currentLoopEnd = 1;
//     this.playing = false;
//     this.buffer = null;
//     this.playbackPosition = 0;

//     this.port.onmessage = (event) => {
//       if (event.data.type === 'setBuffer') {
//         this.buffer = event.data.buffer;
//       } else if (event.data.type === 'play') {
//         this.playing = true;
//       } else if (event.data.type === 'stop') {
//         this.playing = false;
//       }
//     };
//   }

//   process(inputs, outputs, parameters) {
//     const output = outputs[0];

//     if (!this.playing || !this.buffer) return true;

//     // Get current parameter values
//     const targetLoopStart = parameters.targetLoopStart[0];
//     const targetLoopEnd = parameters.targetLoopEnd[0];
//     const interpolationSpeed = parameters.interpolationSpeed[0];

//     // Smoothly interpolate current values toward targets
//     this.currentLoopStart +=
//       (targetLoopStart - this.currentLoopStart) * interpolationSpeed;
//     this.currentLoopEnd +=
//       (targetLoopEnd - this.currentLoopEnd) * interpolationSpeed;

//     // Process audio
//     for (let channel = 0; channel < output.length; channel++) {
//       const outputChannel = output[channel];

//       for (let i = 0; i < outputChannel.length; i++) {
//         // Get audio from buffer
//         outputChannel[i] =
//           this.buffer[channel][Math.floor(this.playbackPosition)];

//         // Advance playback position
//         this.playbackPosition++;

//         // Handle looping
//         if (this.playbackPosition >= this.currentLoopEnd * sampleRate) {
//           this.playbackPosition = this.currentLoopStart * sampleRate;
//         }
//       }
//     }

//     return true;
//   }
// }

// registerProcessor('loop-interpolator', LoopInterpolator);
