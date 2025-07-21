class RampController {
  #isRamping = false;
  #rampMethod = 'linear';
  #sampleRate = 48000;
  #currVal = 0;
  #targetVal = 0;
  #rampSamples = 0;
  #currSample = 0;
  #increment = 0;
  #multiplier = 1;

  constructor(sampleRate = 48000) {
    this.#sampleRate = sampleRate;
  }

  linearRamp(targetValue, rampTimeSeconds) {
    this.#rampMethod = 'linear';
    this.#isRamping = true;

    this.#targetVal = targetValue;
    this.#rampSamples = Math.floor(rampTimeSeconds * this.#sampleRate);
    this.#currSample = 0;
    this.#increment = (targetValue - this.#currVal) / this.#rampSamples;
  }

  exponentialRamp(targetValue, rampTimeSeconds) {
    this.#rampMethod = 'exponential';
    this.#isRamping = true;

    if (this.#currVal === 0) {
      this.linearRamp(targetValue, rampTimeSeconds);
      return; // fallback
    }

    this.#targetVal = targetValue;
    this.#rampSamples = Math.floor(rampTimeSeconds * this.#sampleRate);
    this.#currSample = 0;
    this.#multiplier = Math.pow(
      targetValue / this.#currVal,
      1 / this.#rampSamples
    );
  }

  getNextValue() {
    if (!this.#isRamping) return this.#currVal;

    if (this.#currSample < this.#rampSamples) {
      switch (this.#rampMethod) {
        case 'linear':
          this.#currVal += this.#increment;
          break;
        case 'exponential':
          this.#currVal *= this.#multiplier;
          break;
      }
      this.#currSample++;
    } else {
      this.#currVal = this.#targetVal;
      this.#isRamping = false;
    }

    return this.#currVal;
  }

  setValue(value) {
    this.#currVal = value;
    this.#targetVal = value;
    this.#isRamping = false;
  }

  setSampleRate(rate) {
    this.#sampleRate = rate;
  }

  get value() {
    return this.#currVal;
  }

  get sampleRate() {
    return this.#sampleRate;
  }

  get isRamping() {
    return this.#isRamping;
  }
}
