export class LFO {
  #context: AudioContext;
  #oscillator: OscillatorNode;
  #gain: GainNode;
  #targets: Set<AudioParam> = new Set();

  constructor(context: AudioContext) {
    this.#context = context;
    this.#oscillator = context.createOscillator();
    this.#gain = context.createGain();

    this.#oscillator.connect(this.#gain);
    this.#oscillator.start();
  }

  // Set frequency (can be audio rate for pitch effects)
  setFrequency(hz: number) {
    this.#oscillator.frequency.value = hz;
  }

  // Set modulation depth
  setDepth(amount: number) {
    this.#gain.gain.value = amount;
  }

  // Set waveform
  setWaveform(type: OscillatorType) {
    this.#oscillator.type = type;
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

  dispose() {
    this.#oscillator.stop();
    this.disconnect();
  }
}

// // Usage:
// const lfo = new LFO(audioContext);
// lfo.setWaveform('sine');
// lfo.setFrequency(440); // A4 pitch
// lfo.setDepth(0.5);
// lfo.connect(gainNode.gain); // Modulate amplitude
