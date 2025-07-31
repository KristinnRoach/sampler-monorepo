// feedback-delay-processor.js

import { FeedbackDelay } from './FeedbackDelay';

registerProcessor(
  'feedback-delay-processor',
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: 'feedbackAmount',
          defaultValue: 0.8,
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
        {
          name: 'decay',
          defaultValue: 0.0,
          minValue: 0,
          maxValue: 1,
          automationRate: 'k-rate',
        },
      ];
    }

    constructor() {
      super();
      this.feedbackDelay = new FeedbackDelay(sampleRate);
      this.decayStartTime = null;
      this.decayActive = false;
      this.baseFeedbackAmount = 0.5;
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
          case 'triggerDecay':
            this.decayStartTime = currentTime;
            this.decayActive = true;
            this.baseFeedbackAmount = event.data.baseFeedbackAmount || 0.5;
            break;
          case 'stopDecay':
            this.decayActive = false;
            this.decayStartTime = null;
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

      const baseFeedbackAmount = parameters.feedbackAmount[0];
      const delayTime = parameters.delayTime[0];
      const decay = parameters.decay[0];
      const channelCount = Math.min(input.length, output.length);
      const frameCount = output[0].length;

      // Process each sample
      for (let i = 0; i < frameCount; ++i) {
        let effectiveFeedbackAmount = baseFeedbackAmount;

        // Apply decay if active
        if (this.decayActive && this.decayStartTime !== null) {
          const elapsedTime =
            currentTime - this.decayStartTime + i / sampleRate;

          // Extremely gradual curve
          const delayCompensation = Math.min(5, 0.5 / delayTime); // Boost for short delays
          const timeConstant =
            Math.pow(decay, 5) * 1000 * delayCompensation + 0.5;
          const decayFactor = Math.exp(-elapsedTime / timeConstant);
          effectiveFeedbackAmount = baseFeedbackAmount * decayFactor;

          // Stop decay when feedback becomes negligible
          if (effectiveFeedbackAmount < 0.001) {
            this.decayActive = false;
            effectiveFeedbackAmount = 0;
          }
        }

        // Process each channel
        for (let c = 0; c < channelCount; c++) {
          // Main processing happens in FeedbackDelay's process method
          const processed = this.feedbackDelay.process(
            input[c][i],
            c,
            effectiveFeedbackAmount,
            delayTime
          );

          // Direct output assignment (already processed)
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
