import { compressSingleSample } from '../shared/utils/compress-utils';
import { DelayBuffer } from './DelayBuffer';

// Minimal safety compensation - just enough to prevent sub-threshold buildup
const SAFETY_GAIN_COMPENSATION = 0.05;

export class FeedbackDelay {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.buffers = [];
    this.initialized = false;
    this.autoGainEnabled = true;
    this.gainCompensation = SAFETY_GAIN_COMPENSATION;
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

    const feedbackSample = feedbackAmount * delayedSample + inputSample;
    const compressedFeedback = compressSingleSample(feedbackSample, 0.75, 3.0, {
      enabled: true, // Hard limiter enabled
      outputRange: { min: -0.999, max: 0.999 },
    });
    let outputSample = compressedFeedback;

    if (this.autoGainEnabled && feedbackAmount > 0.8) {
      // Safety net only for output sample:
      // minimal gain reduction to prevent sub-threshold feedback buildup
      const safetyReduction =
        1 - (feedbackAmount - 0.8) * this.gainCompensation;
      outputSample = compressedFeedback * safetyReduction;
    }

    return { outputSample, feedbackSample: compressedFeedback, delaySamples };
  }

  updateBuffer(channelIndex, sample, delaySamples) {
    const buffer = this.buffers[channelIndex] || this.buffers[0];
    buffer.write(sample);
    buffer.updatePointers(delaySamples);
  }

  setAutoGain(enabled, compensation = SAFETY_GAIN_COMPENSATION) {
    this.autoGainEnabled = enabled;
    this.gainCompensation = compensation;
  }
}

// const DEFAULT_GAIN_COMPENSATION = 0.954;
// this.gainCompensation = DEFAULT_GAIN_COMPENSATION;

// // Apply gain compensation only to the output (not the feedback)
// if (this.autoGainEnabled) {
//   const compensation = 1 - feedbackAmount * this.gainCompensation; // 1 - Math.sqrt(feedbackAmount) * this.gainCompensation;
//   outputSample = compressedFeedback * compensation;
// }
