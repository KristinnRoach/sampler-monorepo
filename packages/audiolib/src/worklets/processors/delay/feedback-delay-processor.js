registerProcessor(
  'feedback-delay-processor',
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: 'gain',
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
          automationRate: 'k-rate',
        },
        {
          name: 'delayTime',
          defaultValue: 10,
          minValue: 0,
          maxValue: 1000,
          automationRate: 'k-rate',
        },
        {
          name: 'playbackRate',
          defaultValue: 1.0,
          minValue: 0.1,
          maxValue: 4.0,
          automationRate: 'k-rate',
        },
      ];
    }

    constructor() {
      super();
      this.Buffer = null;
      this.bufferInitialized = false;

      this.ReadPtr = 0;
      this.WritePtr = 0;
      this.fractionalReadPtr = 0; // For pitch shifting

      // defaults, changed via msg
      this.maxOutput = 0.5;
      this.limitingMode = 'hard-clipping';
      this.autoGainEnabled = true;

      this.setupMessageHandling();
    }

    setupMessageHandling() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
          case 'setLimiting':
            this.limitingMode = event.data.mode;
            break;

          case 'setAutoGain':
            this.autoGainEnabled = event.data.enabled;
            break;

          case 'setMaxOutput':
            this.maxOutput = Math.max(0.1, Math.min(1.0, event.data.level));
            break;
        }
      };
    }

    getInterpolatedSample() {
      const index = Math.floor(this.fractionalReadPtr);
      const fraction = this.fractionalReadPtr - index;
      const nextIndex = (index + 1) % this.Buffer.length;

      return (
        this.Buffer[index] * (1 - fraction) + this.Buffer[nextIndex] * fraction
      );
    }

    updateBufferPointers(delaySamples, bufferSize, playbackRate) {
      this.WritePtr = (this.WritePtr + 1) % bufferSize;

      if (playbackRate === 1.0) {
        // Fast path - no pitch shifting
        this.ReadPtr = (this.WritePtr - delaySamples + bufferSize) % bufferSize;
      } else {
        // Fractional movement for pitch shifting
        this.fractionalReadPtr =
          (this.fractionalReadPtr + playbackRate) % bufferSize;
        this.ReadPtr = Math.floor(this.fractionalReadPtr);
      }
    }

    process(inputs, outputs, parameters) {
      if (!this.bufferInitialized) {
        this.Buffer = new Array(Math.round(sampleRate)).fill(0);
        this.bufferInitialized = true;
        this.fractionalReadPtr = 0; // Initialize fractional pointer
      }

      if (!inputs[0] || !outputs[0] || !inputs[0][0] || !outputs[0][0]) {
        return true;
      }

      const delaySamples = Math.round(
        (sampleRate * parameters.delayTime[0]) / 1000
      );
      const bufferSize = this.Buffer.length;
      const gain = parameters.gain[0];
      const playbackRate = parameters.playbackRate[0];
      const outputChannel = outputs[0][0];
      const inputChannel = inputs[0][0];

      // Calculate gain compensation: as feedback increases, reduce overall gain
      const GAIN_COMPENSATION = 0.4;
      const adjustedGain = this.autoGainEnabled
        ? gain * (1 - gain * GAIN_COMPENSATION)
        : gain;

      // Choose limiting function once per block
      switch (this.limitingMode) {
        case 'soft-clipping':
          for (let i = 0; i < outputChannel.length; ++i) {
            // Optimized sample retrieval
            const delayedSample =
              playbackRate === 1.0
                ? this.Buffer[this.ReadPtr]
                : this.getInterpolatedSample();

            let sample = adjustedGain * delayedSample + inputChannel[i];
            sample = this.maxOutput * Math.tanh(sample / this.maxOutput);

            outputChannel[i] = sample;
            this.Buffer[this.WritePtr] = sample;
            this.updateBufferPointers(delaySamples, bufferSize, playbackRate);
          }
          break;

        case 'hard-clipping':
          for (let i = 0; i < outputChannel.length; ++i) {
            // Optimized sample retrieval
            const delayedSample =
              playbackRate === 1.0
                ? this.Buffer[this.ReadPtr]
                : this.getInterpolatedSample();

            let sample = adjustedGain * delayedSample + inputChannel[i];
            sample = Math.max(
              -this.maxOutput,
              Math.min(this.maxOutput, sample)
            );

            outputChannel[i] = sample;
            this.Buffer[this.WritePtr] = sample;
            this.updateBufferPointers(delaySamples, bufferSize, playbackRate);
          }
          break;

        case 'none':
        default:
          for (let i = 0; i < outputChannel.length; ++i) {
            // Optimized sample retrieval
            const delayedSample =
              playbackRate === 1.0
                ? this.Buffer[this.ReadPtr]
                : this.getInterpolatedSample();

            let sample = adjustedGain * delayedSample + inputChannel[i];

            outputChannel[i] = sample;
            this.Buffer[this.WritePtr] = sample;
            this.updateBufferPointers(delaySamples, bufferSize, playbackRate);
          }
          break;
      }
      return true;
    }
  }
);

// registerProcessor(
//   'feedback-delay-processor',
//   class extends AudioWorkletProcessor {
//     static get parameterDescriptors() {
//       return [
//         {
//           name: 'gain',
//           defaultValue: 0.5,
//           minValue: 0,
//           maxValue: 1,
//           automationRate: 'k-rate',
//         },
//         {
//           name: 'delayTime',
//           defaultValue: 10,
//           minValue: 0,
//           maxValue: 1000,
//           automationRate: 'k-rate',
//         },
//       ];
//     }

//     constructor() {
//       super();
//       this.Buffer = null; // init in process()
//       this.bufferInitialized = false;

//       this.ReadPtr = 0;
//       this.WritePtr = 0;

//       // defaults, changed via msg
//       this.maxOutput = 0.5;
//       this.limitingMode = 'hard-clipping';
//       this.autoGainEnabled = true;

//       this.setupMessageHandling();
//     }

//     setupMessageHandling() {
//       this.port.onmessage = (event) => {
//         switch (event.data.type) {
//           case 'setLimiting':
//             this.limitingMode = event.data.mode;
//             break;

//           case 'setAutoGain':
//             this.autoGainEnabled = event.data.enabled;
//             break;

//           case 'setMaxOutput':
//             this.maxOutput = Math.max(0.1, Math.min(1.0, event.data.level));
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
//       if (!this.bufferInitialized) {
//         this.Buffer = new Array(Math.round(sampleRate)).fill(0);
//         this.bufferInitialized = true;
//       }

//       if (!inputs[0] || !outputs[0] || !inputs[0][0] || !outputs[0][0]) {
//         return true;
//       }

//       const delaySamples = Math.round(
//         (sampleRate * parameters.delayTime[0]) / 1000
//       );
//       const bufferSize = this.Buffer.length;
//       const gain = parameters.gain[0];
//       const outputChannel = outputs[0][0];
//       const inputChannel = inputs[0][0];
//       const blockLength = outputChannel.length;

//       // Calculate gain compensation: as feedback increases, reduce overall gain
//       const GAIN_COMPENSATION = 0.4; // reasonable range = 0.1 - 0.5
//       const adjustedGain = this.autoGainEnabled
//         ? // ? gain * (1 - Math.sqrt(gain) * GAIN_COMPENSATION) // smoother reduction curve (just use if sounds better)
//           gain * (1 - gain * GAIN_COMPENSATION)
//         : gain;

//       // Choose limiting function once per block
//       switch (this.limitingMode) {
//         case 'soft-clipping':
//           for (let i = 0; i < outputChannel.length; ++i) {
//             let sample =
//               adjustedGain * this.Buffer[this.ReadPtr] + inputChannel[i];
//             sample = this.maxOutput * Math.tanh(sample / this.maxOutput);

//             outputChannel[i] = sample;
//             this.Buffer[this.WritePtr] = sample;
//             this.updateBufferPointers(delaySamples, bufferSize);
//           }
//           break;

//         case 'hard-clipping':
//           for (let i = 0; i < outputChannel.length; ++i) {
//             let sample =
//               adjustedGain * this.Buffer[this.ReadPtr] + inputChannel[i];
//             sample = Math.max(
//               -this.maxOutput,
//               Math.min(this.maxOutput, sample)
//             );
//             outputChannel[i] = sample;
//             this.Buffer[this.WritePtr] = sample;
//             this.updateBufferPointers(delaySamples, bufferSize);
//           }
//           break;

//         case 'none':
//         default:
//           for (let i = 0; i < outputChannel.length; ++i) {
//             let sample =
//               adjustedGain * this.Buffer[this.ReadPtr] + inputChannel[i];
//             outputChannel[i] = sample;
//             this.Buffer[this.WritePtr] = sample;
//             this.updateBufferPointers(delaySamples, bufferSize);
//           }
//           break;
//       }
//       return true;
//     }
//   }
// );
