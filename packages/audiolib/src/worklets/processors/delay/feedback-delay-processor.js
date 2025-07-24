// TODO: FIX Gain compensation so that Clipping is audible and max feedback is controlled.
// TODO: Make into separate super simple processors optimized for simplicity and clear separation of concerns. Document usage and relationship between gain params

// Shared classes for reuse across processors

class DelayBuffer {
  constructor(maxDelaySamples) {
    this.buffer = new Array(maxDelaySamples).fill(0);
    this.writePtr = 0;
    this.readPtr = 0;
  }

  write(sample) {
    this.buffer[this.writePtr] = sample;
  }

  read() {
    return this.buffer[this.readPtr];
  }

  updatePointers(delaySamples) {
    this.writePtr = (this.writePtr + 1) % this.buffer.length;
    this.readPtr =
      (this.writePtr - delaySamples + this.buffer.length) % this.buffer.length;
  }
}

class FeedbackDelay {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.buffers = [];
    this.initialized = false;
    this.autoGainEnabled = true;
    this.gainCompensation = 0.97;
  }

  initializeBuffers(channelCount) {
    this.buffers = [];
    const maxSamples = Math.floor(this.sampleRate);
    for (let c = 0; c < channelCount; c++) {
      this.buffers[c] = new DelayBuffer(maxSamples);
    }
    this.initialized = true;
  }

  process(inputSample, channelIndex, feedbackAmount, delayTime) {
    if (!this.initialized) return inputSample;

    const buffer = this.buffers[channelIndex] || this.buffers[0];
    const delaySamples = Math.floor(this.sampleRate * delayTime);

    const delayedSample = buffer.read();

    // Use full feedback amount for the actual feedback loop
    const feedbackSample = feedbackAmount * delayedSample + inputSample;

    // Apply gain compensation only to the output (to control the volume)
    const outputSample = this.autoGainEnabled
      ? feedbackSample * (1 - feedbackAmount * this.gainCompensation)
      : feedbackSample;

    return { outputSample: outputSample, feedbackSample, delaySamples };
  }

  updateBuffers(outputSample, delaySamples) {
    // Write output to all buffers and update pointers
    for (let buffer of this.buffers) {
      buffer.write(outputSample);
      buffer.updatePointers(delaySamples);
    }
  }

  setAutoGain(enabled, compensation = 0.75) {
    this.autoGainEnabled = enabled;
    this.gainCompensation = compensation;
  }
}

class Distortion {
  constructor() {
    this.clippingThreshold = 1;
    this.driveGainScalar = 0.95;
    this.limitingMode = 'hard-clipping';
  }

  applyDrive(sample, driveAmount) {
    if (driveAmount <= 0) return sample;

    const driveMultiplier = 1 + driveAmount * 4; // 1x to 5x drive
    const drivenSample = sample * driveMultiplier;

    let clippedSample;
    switch (this.limitingMode) {
      case 'soft-clipping':
        clippedSample =
          this.clippingThreshold *
          Math.tanh(drivenSample / this.clippingThreshold);
        break;
      case 'hard-clipping':
        clippedSample = Math.max(
          -this.clippingThreshold,
          Math.min(this.clippingThreshold, drivenSample)
        );
        break;
      default:
        clippedSample = drivenSample;
        break;
    }

    return clippedSample * this.driveGainScalar;
  }

  applyClipping(sample, clippingAmount) {
    if (clippingAmount <= 0) return sample;

    let clippedSample;
    switch (this.limitingMode) {
      case 'soft-clipping':
        clippedSample =
          this.clippingThreshold * Math.tanh(sample / this.clippingThreshold);
        break;
      case 'hard-clipping':
        clippedSample = Math.max(
          -this.clippingThreshold,
          Math.min(this.clippingThreshold, sample)
        );
        break;
      default:
        clippedSample = sample;
        break;
    }

    // Blend clean and clipped
    return sample * (1 - clippingAmount) + clippedSample * clippingAmount;
  }

  setLimitingMode(mode) {
    this.limitingMode = mode;
  }

  setClippingThreshold(threshold) {
    this.clippingThreshold = Math.max(0.1, Math.min(2.0, threshold));
  }
}

// Main processor using the modular classes
const C6_SECONDS = 0.00095556;

registerProcessor(
  'feedback-delay-processor',
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: 'feedbackAmount',
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
          automationRate: 'k-rate',
        },
        {
          name: 'delayTime',
          defaultValue: 0.01,
          minValue: C6_SECONDS,
          maxValue: 4,
          automationRate: 'k-rate',
        },
        {
          name: 'distortionDrive',
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          automationRate: 'a-rate',
        },
        {
          name: 'clippingAmount',
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          automationRate: 'a-rate',
        },
      ];
    }

    constructor() {
      super();
      this.feedbackDelay = new FeedbackDelay(sampleRate);
      this.distortion = new Distortion();
      this.setupMessageHandling();
    }

    setupMessageHandling() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
          case 'setLimiting':
            this.distortion.setLimitingMode(event.data.mode);
            break;
          case 'setMaxOutput':
            this.distortion.setClippingThreshold(event.data.level);
            break;
          case 'setAutoGain':
            this.feedbackDelay.setAutoGain(
              event.data.enabled,
              event.data.amount
            );
            break;
        }
      };
    }

    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];

      if (!input || !output) return true;

      // Initialize delay buffers if needed
      if (
        !this.feedbackDelay.initialized ||
        this.feedbackDelay.buffers.length !== input.length
      ) {
        this.feedbackDelay.initializeBuffers(input.length);
      }

      const feedbackAmount = parameters.feedbackAmount[0];
      const delayTime = parameters.delayTime[0];

      // ! Should delaySamples & feedbackSample be declared here instead ?
      // let delaySamples; // Track for buffer updates
      // let feedbackSample;

      // Process each sample
      for (let i = 0; i < output[0].length; ++i) {
        const distortionDrive =
          parameters.distortionDrive[
            Math.min(i, parameters.distortionDrive.length - 1)
          ];
        const clippingAmount =
          parameters.clippingAmount[
            Math.min(i, parameters.clippingAmount.length - 1)
          ];

        let delaySamples; // Track for buffer updates
        let feedbackSample;

        // Process each channel
        for (let c = 0; c < Math.min(input.length, output.length); c++) {
          // 1. Feedback delay processing
          const delayResult = this.feedbackDelay.process(
            input[c][i],
            c,
            feedbackAmount,
            delayTime
          );
          let sample = delayResult.outputSample;
          delaySamples = delayResult.delaySamples;

          // Store feedback sample from first channel for buffer update
          if (c === 0) {
            feedbackSample = delayResult.feedbackSample;
          }

          // 2. Apply distortion drive
          sample = this.distortion.applyDrive(sample, distortionDrive);

          // 3. Apply clipping blend
          sample = this.distortion.applyClipping(sample, clippingAmount);

          // 4. Apply auto-gain AGAIN ? at the very end
          // if (this.feedbackDelay.autoGainEnabled) {
          //   sample =
          //     sample * (1 - feedbackAmount * this.feedbackDelay.gainCompensation);
          // }

          output[c][i] = sample;
        }

        // Update delay buffers once per sample using feedback signal
        this.feedbackDelay.updateBuffers(feedbackSample, delaySamples);
      }

      return true;
    }
  }
);

// const C6_SECONDS = 0.00095556;

// registerProcessor(
//   'feedback-delay-processor',
//   class extends AudioWorkletProcessor {
//     static get parameterDescriptors() {
//       return [
//         {
//           name: 'feedbackAmount',
//           defaultValue: 0.5,
//           minValue: 0,
//           maxValue: 1,
//           automationRate: 'k-rate',
//         },
//         {
//           name: 'delayTime',
//           defaultValue: 0.01, // seconds
//           minValue: C6_SECONDS,
//           maxValue: 4,
//           automationRate: 'k-rate',
//         },

//         {
//           name: 'distortionDrive',
//           defaultValue: 0, // 0 = no drive, 1 = max drive
//           minValue: 0,
//           maxValue: 1,
//           automationRate: 'a-rate',
//         },

//         {
//           name: 'clippingAmount',
//           defaultValue: 0, // 0 = pure feedback, 1 = full clipping
//           minValue: 0,
//           maxValue: 1,
//           automationRate: 'a-rate',
//         },
//       ];
//     }

//     constructor() {
//       super();
//       this.Buffers = []; // buffer per channel
//       this.bufferInitialized = false;

//       this.ReadPtr = 0;
//       this.WritePtr = 0;

//       // defaults, changed via msg
//       this.clippingThreshold = 1.5;
//       this.limitingMode = 'soft-clipping';
//       this.autoGainEnabled = true;
//       this.GAIN_COMPENSATION = 0.05; // useable range ?

//       this.setupMessageHandling();
//     }

//     setupMessageHandling() {
//       this.port.onmessage = (event) => {
//         switch (event.data.type) {
//           case 'setLimiting':
//             this.limitingMode = event.data.mode;
//             break;

//           case 'setClippingThreshold':
//             this.clippingThreshold = Math.max(
//               0.1,
//               Math.min(1.0, event.data.level)
//             );
//             break;

//           case 'setAutoGain':
//             this.autoGainEnabled = event.data.enabled;
//             if (event.data.amount > 0 && event.data.amount < 1) {
//               // todo: map 0-1 to usable range "ca. 0.1 - 0.6"
//               this.GAIN_COMPENSATION = event.data.amount;
//             }
//             break;
//         }
//       };
//     }

//     updateBufferPointers(delaySamples, bufferSize) {
//       this.WritePtr++;
//       if (this.WritePtr >= bufferSize)
//         this.WritePtr = this.WritePtr - bufferSize;
//       this.ReadPtr = this.WritePtr - delaySamples;
//       if (this.ReadPtr < 0) this.ReadPtr = this.ReadPtr + bufferSize;
//     }

//     process(inputs, outputs, parameters) {
//       const input = inputs[0];
//       const output = outputs[0];

//       if (!input || !output) return true;

//       // Initialize or resize buffers if channel count changed
//       if (!this.bufferInitialized || this.Buffers.length !== input.length) {
//         this.Buffers = [];
//         for (let c = 0; c < input.length; c++) {
//           this.Buffers[c] = new Array(Math.floor(sampleRate)).fill(0);
//         }
//         this.bufferInitialized = true;
//         this.ReadPtr = 0;
//         this.WritePtr = 0;
//       }

//       const delaySamples = Math.floor(sampleRate * parameters.delayTime[0]);
//       const bufferSize = this.Buffers[0].length;
//       const fbGain = parameters.feedbackAmount[0];

//       // Calculate gain compensation
//       const compensatedFbGain = this.autoGainEnabled
//         ? fbGain * (1 - fbGain * this.GAIN_COMPENSATION)
//         : fbGain;

//       // Process each sample across all channels, then advance pointers
//       for (let i = 0; i < output[0].length; ++i) {
//         const distortionDrive =
//           parameters.distortionDrive[
//             Math.min(i, parameters.distortionDrive.length - 1)
//           ];
//         const clippingAmount =
//           parameters.clippingAmount[
//             Math.min(i, parameters.clippingAmount.length - 1)
//           ];

//         // Process all channels for this sample
//         for (let c = 0; c < Math.min(input.length, output.length); c++) {
//           const buffer = this.Buffers[c] || this.Buffers[0];
//           let sample = compensatedFbGain * buffer[this.ReadPtr] + input[c][i];

//           // Apply drive-based distortion if active
//           if (distortionDrive > 0) {
//             const driveAmount = 1 + distortionDrive * 4; // 1x to 5x drive
//             const drivenSample = sample * driveAmount;

//             // Apply clipping based on current mode
//             let clippedSample;
//             switch (this.limitingMode) {
//               case 'soft-clipping':
//                 clippedSample =
//                   this.clippingThreshold *
//                   Math.tanh(drivenSample / this.clippingThreshold);
//                 break;
//               case 'hard-clipping':
//                 clippedSample = Math.max(
//                   -this.clippingThreshold,
//                   Math.min(this.clippingThreshold, drivenSample)
//                 );
//                 break;
//               default:
//                 clippedSample = drivenSample;
//                 break;
//             }

//             sample = clippedSample / driveAmount; // scale back
//           }

//           // Apply clipping blend if active
//           if (clippingAmount > 0) {
//             // Calculate clipped version
//             let clippedSample;
//             switch (this.limitingMode) {
//               case 'soft-clipping':
//                 clippedSample =
//                   this.clippingThreshold *
//                   Math.tanh(sample / this.clippingThreshold);
//                 break;
//               case 'hard-clipping':
//                 clippedSample = Math.max(
//                   -this.clippingThreshold,
//                   Math.min(this.clippingThreshold, sample)
//                 );
//                 break;
//               default:
//                 clippedSample = sample; // no clipping
//                 break;
//             }

//             // Blend clean and clipped
//             sample =
//               sample * (1 - clippingAmount) + clippedSample * clippingAmount;
//           }

//           output[c][i] = sample;
//           buffer[this.WritePtr] = sample;
//         }

//         this.updateBufferPointers(delaySamples, bufferSize);
//       }

//       return true;
//     }
//   }
// );

/*
        for (let c = 0; c < Math.min(input.length, output.length); c++) {
          const buffer = this.Buffers[c] || this.Buffers[0];
          let sample = adjustedGain * buffer[this.ReadPtr] + input[c][i];

          switch (this.limitingMode) {
            case 'soft-clipping':
              sample =
                this.clippingThreshold *
                Math.tanh(sample / this.clippingThreshold);
              break;
            case 'hard-clipping':
              sample = Math.max(
                -this.clippingThreshold,
                Math.min(this.clippingThreshold, sample)
              );
              break;
            case 'none':
            default:
              // No limiting applied
              break;
          }

          // Output the processed sample
          output[c][i] = sample;

          // Write to delay buffer (feedback)
          buffer[this.WritePtr] = sample;
        }

        // Update pointers once per sample (after all channels processed)
        this.updateBufferPointers(delaySamples, bufferSize);
      }

      return true;
    }
  }
);

*/
