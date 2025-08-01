export class LFO {
  #context: AudioContext;
  #oscillator: OscillatorNode;
  #gain: GainNode;
  #targets: Set<AudioParam> = new Set();

  constructor(context: AudioContext) {
    this.#context = context;
    this.#oscillator = context.createOscillator();
    this.#gain = context.createGain();

    this.#oscillator.frequency.value = 0.5; // 0.5 Hz default
    this.#gain.gain.value = 0; // No modulation by default

    this.#oscillator.connect(this.#gain);
    this.#oscillator.start();
  }

  setFrequency(hz: number) {
    this.#oscillator.frequency.value = hz;
  }

  setDepth(amount: number) {
    this.#gain.gain.value = amount;
  }

  setWaveform(waveform: OscillatorType | PeriodicWave) {
    if (waveform instanceof PeriodicWave) {
      this.#oscillator.setPeriodicWave(waveform);
    } else {
      this.#oscillator.type = waveform;
    }
  }

  setPeriodicWave(wave: PeriodicWave) {
    this.#oscillator.setPeriodicWave(wave);
  }

  // Connect to target AudioParam
  connect(audioParam: AudioParam) {
    this.#gain.connect(audioParam);
    this.#targets.add(audioParam);
  }

  // Disconnect from target
  disconnect(audioParam?: AudioParam) {
    if (audioParam) {
      this.#gain.disconnect(audioParam);
      this.#targets.delete(audioParam);
    } else {
      this.#gain.disconnect();
      this.#targets.clear();
    }
  }

  // Musical pitch helpers
  setMusicalNote(midiNote: number) {
    const hz = 440 * Math.pow(2, (midiNote - 69) / 12);
    this.setFrequency(hz);
  }

  getPitchWobbleWaveform() {
    // Number of harmonics for complexity
    const harmonics = 8;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);

    // First value is always 0 (DC offset)
    real[0] = 0;
    imag[0] = 0;

    // Fill harmonics with random values for a unique wobble shape
    for (let i = 1; i < harmonics; i++) {
      real[i] = Math.random() * 0.5; // Random amplitude
      imag[i] = Math.random() * 0.5; // Random phase offset
    }

    const wave = this.#context.createPeriodicWave(real, imag, {
      disableNormalization: true,
    });

    return wave;
  }

  dispose() {
    this.#oscillator.stop();
    this.disconnect();
  }
}
