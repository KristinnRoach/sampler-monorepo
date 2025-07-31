// feedback-delay-processor.js

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
          minValue: 0.00012656238799684144, // <- B natural in seconds (highest note period that works)
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
      const channelCount = Math.min(input.length, output.length);
      const frameCount = output[0].length;

      // Process each sample
      for (let i = 0; i < frameCount; ++i) {
        // Process each channel
        for (let c = 0; c < channelCount; c++) {
          // Process feedback delay
          const processed = this.feedbackDelay.process(
            input[c][i],
            c,
            feedbackAmount,
            delayTime
          );

          // Direct assignment (processing handled in FeedbackDelay)
          output[c][i] = processed.outputSample;

          // Update buffer with feedback signal
          this.feedbackDelay.updateBuffer(
            c,
            processed.feedbackSample,
            processed.delaySamples
          );
        }
      }

      return true;
    }
  }
);
