import {
  CustomLibWaveform,
  createWave,
  WaveformOptions,
  isCustomLibWaveform,
} from '@/utils/audiodata/generate/generateWaveForm';

export class LFO {
  #context: AudioContext;
  #oscillator: OscillatorNode;
  #gain: GainNode;
  #targets: Set<AudioParam> = new Set();
  #initialized = false;

  #storedValues: { rate: number; depth?: number } | null = null;

  constructor(context: AudioContext) {
    this.#context = context;
    this.#oscillator = context.createOscillator();
    this.#gain = context.createGain();

    this.#oscillator.frequency.value = 1; // 1Hz
    this.#gain.gain.value = 0; // No mod

    this.#oscillator.connect(this.#gain);

    // Hook into user gesture to avoid audio context warnings
    document.addEventListener('click', this.initOnUserGesture.bind(this), {
      once: true,
    });
  }

  initOnUserGesture() {
    if (this.#initialized) return;

    if (this.#context.state === 'suspended') {
      this.#context.resume().then(() => {
        this.#oscillator.start();
      });
    } else {
      this.#oscillator.start();
    }
    this.#initialized = true;
  }

  setFrequency(hz: number) {
    this.#oscillator.frequency.value = hz;
  }

  setDepth(amount: number) {
    this.#gain.gain.value = amount;
  }

  setWaveform(
    waveform: OscillatorType | PeriodicWave | CustomLibWaveform,
    customWaveOptions?: WaveformOptions
  ) {
    if (waveform instanceof PeriodicWave) {
      this.#oscillator.setPeriodicWave(waveform);
    } else if (typeof waveform === 'string' && isCustomLibWaveform(waveform)) {
      // It's a custom library waveform string
      const periodicWave = createWave(
        this.#context,
        waveform,
        customWaveOptions
      );
      this.#oscillator.setPeriodicWave(periodicWave);
    } else {
      // It's a built-in OscillatorType
      this.#oscillator.type = waveform as OscillatorType;
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
  setMusicalNote(midiNote: number, divisor = 1) {
    const hz = 440 * Math.pow(2, (midiNote - 69) / 12);
    this.setFrequency(hz / divisor);
  }

  storeCurrentValues = () => {
    this.#storedValues = {
      rate: this.#oscillator.frequency.value,
      depth: this.#gain.gain.value,
    };
  };

  getStoredValues = () => this.#storedValues;

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
    this.#initialized = false;
    this.#targets.clear();
    this.#storedValues = null;
    this.#oscillator.stop();
    this.disconnect();
  }
}
