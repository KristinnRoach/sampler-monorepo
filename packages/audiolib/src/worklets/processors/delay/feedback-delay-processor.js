const C6_SECONDS = 0.00095556;

registerProcessor(
  'feedback-delay-processor',
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: 'gain',
          defaultValue: 0.5,
          minValue: 0.001,
          maxValue: 1.5, // TODO: make 0-1 and update all mapping functions for ks effect and voices
          automationRate: 'k-rate',
        },
        {
          name: 'delayTime',
          defaultValue: 0.01, // seconds
          minValue: C6_SECONDS,
          maxValue: 4,
          automationRate: 'k-rate',
        },
      ];
    }

    constructor() {
      super();
      this.Buffers = []; // buffer per channel
      this.bufferInitialized = false;

      this.ReadPtr = 0;
      this.WritePtr = 0;

      // defaults, changed via msg
      this.maxOutput = 0.1;
      this.limitingMode = 'hard-clipping';
      this.autoGainEnabled = true;
      this.GAIN_COMPENSATION = 0.3; // useable range ca. 0.15 - 0.5

      this.setupMessageHandling();
    }

    setupMessageHandling() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
          case 'setLimiting':
            this.limitingMode = event.data.mode;
            break;

          case 'setMaxOutput':
            this.maxOutput = Math.max(0.1, Math.min(1.0, event.data.level));
            break;

          case 'setAutoGain':
            this.autoGainEnabled = event.data.enabled;
            if (event.data.amount > 0 && event.data.amount < 1) {
              // todo: map 0-1 to usable range "ca. 0.1 - 0.6"
              this.GAIN_COMPENSATION = event.data.amount;
            }
            break;
        }
      };
    }

    updateBufferPointers(delaySamples, bufferSize) {
      this.WritePtr++;
      if (this.WritePtr >= bufferSize)
        this.WritePtr = this.WritePtr - bufferSize;
      this.ReadPtr = this.WritePtr - delaySamples;
      if (this.ReadPtr < 0) this.ReadPtr = this.ReadPtr + bufferSize;
    }

    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];

      // No input or output channels
      if (!input || !output) return true;

      // Initialize buffers if needed
      if (!this.bufferInitialized) {
        for (let c = 0; c < input.length; c++) {
          this.Buffers[c] = new Array(Math.floor(sampleRate)).fill(0);
        }
        this.bufferInitialized = true;
      }

      const delaySamples = Math.floor(sampleRate * parameters.delayTime[0]);
      const bufferSize = this.Buffers[0].length;
      const gain = parameters.gain[0];

      // Calculate gain compensation
      const adjustedGain = this.autoGainEnabled
        ? gain * (1 - gain * this.GAIN_COMPENSATION)
        : gain;

      // Process each available channel
      for (let c = 0; c < Math.min(input.length, output.length); c++) {
        const inputChannel = input[c];
        const outputChannel = output[c];
        const buffer = this.Buffers[c] || this.Buffers[0]; // Fallback if buffer missing

        // Choose limiting function (existing switch/case logic for each channel)
        switch (this.limitingMode) {
          case 'soft-clipping':
            for (let i = 0; i < outputChannel.length; ++i) {
              let sample =
                adjustedGain * buffer[this.ReadPtr] + inputChannel[i];
              sample = this.maxOutput * Math.tanh(sample / this.maxOutput);

              outputChannel[i] = sample;
              buffer[this.WritePtr] = sample;

              if (c === input.length - 1) {
                // Update pointers only once per sample
                this.updateBufferPointers(delaySamples, bufferSize);
              }
            }
            break;

          case 'hard-clipping':
            for (let i = 0; i < outputChannel.length; ++i) {
              let sample =
                adjustedGain * buffer[this.ReadPtr] + inputChannel[i];
              sample = Math.max(
                -this.maxOutput,
                Math.min(this.maxOutput, sample)
              );
              outputChannel[i] = sample;
              buffer[this.WritePtr] = sample;

              if (c === input.length - 1) {
                // Update pointers only once per sample
                this.updateBufferPointers(delaySamples, bufferSize);
              }
            }
            break;

          case 'none':
          default:
            for (let i = 0; i < outputChannel.length; ++i) {
              let sample =
                adjustedGain * buffer[this.ReadPtr] + inputChannel[i];
              outputChannel[i] = sample;
              buffer[this.WritePtr] = sample;

              if (c === input.length - 1) {
                // Update pointers only once per sample
                this.updateBufferPointers(delaySamples, bufferSize);
              }
            }
            break;
        }
      }

      return true;
    }
  }
);
