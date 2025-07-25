import { DelayBuffer } from './DelayBuffer';

const DEFAULT_GAIN_COMPENSATION = 0.954;

export class FeedbackDelay {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.buffers = [];
    this.initialized = false;
    this.autoGainEnabled = true;
    this.gainCompensation = DEFAULT_GAIN_COMPENSATION;
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

    let outputSample = feedbackSample;

    // Apply gain compensation only to the output (not the feedback)
    if (this.autoGainEnabled) {
      const compensation = 1 - feedbackAmount * this.gainCompensation;
      outputSample = feedbackSample * compensation;
    }

    return { outputSample, feedbackSample, delaySamples };
  }

  updateBuffer(channelIndex, sample, delaySamples) {
    const buffer = this.buffers[channelIndex] || this.buffers[0];
    buffer.write(sample);
    buffer.updatePointers(delaySamples);
  }

  setAutoGain(enabled, compensation = DEFAULT_GAIN_COMPENSATION) {
    this.autoGainEnabled = enabled;
    this.gainCompensation = compensation;
  }
}
