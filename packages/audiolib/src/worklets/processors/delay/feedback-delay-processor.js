import { FeedbackDelay } from './FeedbackDelay';

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
          defaultValue: 0.5,
          minValue: 0.001,
          maxValue: 4,
          automationRate: 'k-rate',
        },
      ];
    }

    constructor() {
      super();
      this.feedbackDelay = new FeedbackDelay(sampleRate);
      this.setupMessageHandling();
    }

    setupMessageHandling() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
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

      // Process each sample
      for (let i = 0; i < output[0].length; ++i) {
        // Process each channel
        for (let c = 0; c < Math.min(input.length, output.length); c++) {
          // Process feedback delay
          const delayResult = this.feedbackDelay.process(
            input[c][i],
            c,
            feedbackAmount,
            delayTime
          );

          const clamped = Math.max(
            -0.999,
            Math.min(0.999, delayResult.outputSample)
          );

          // Output with basic limiting to prevent clipping
          output[c][i] = clamped;

          // Update buffer with feedback signal
          this.feedbackDelay.updateBuffer(
            c,
            delayResult.feedbackSample,
            delayResult.delaySamples
          );
        }
      }

      return true;
    }
  }
);
