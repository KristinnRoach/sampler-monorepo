import { LibNode, Destination, Connectable, NodeType } from '@/nodes/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
import { clamp, mapToRange } from '@/utils';

export class KarplusEffect implements LibNode, Connectable {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType = 'karplus-effect';
  #initialized = false;

  audioContext: AudioContext;
  delay: AudioWorkletNode;

  lpf: BiquadFilterNode;
  hpf: BiquadFilterNode;

  inputGain: GainNode;
  outputGain: GainNode;
  feedback: GainNode;

  wetGain: GainNode;
  dryGain: GainNode;
  mixerOutput: GainNode;

  MIN_FB = 0.9; // Actual feedback gain param's
  MAX_FB = 1.3; // full range is 0.5-1.5
  MAX_LPF_HZ: number;
  C6_SECONDS = 0.00095556;

  constructor(context: AudioContext = getAudioContext()) {
    this.nodeId = createNodeId(this.nodeType);
    this.audioContext = context;

    this.delay = new AudioWorkletNode(context, 'feedback-delay-processor');

    this.inputGain = new GainNode(context, { gain: 1 });
    this.outputGain = new GainNode(context, { gain: 1 });
    this.feedback = new GainNode(context, { gain: 0.85 });

    this.wetGain = new GainNode(context, { gain: 0.0 });
    this.dryGain = new GainNode(context, { gain: 1.0 });
    this.mixerOutput = new GainNode(context, { gain: 1.0 });

    this.MAX_LPF_HZ = context.sampleRate / 2 - 1000;

    const DEFAULT_HPF_HZ = 100; // testing
    const DEFAULT_LPF_HZ = 6000; // testing

    this.hpf = new BiquadFilterNode(context, {
      type: 'highpass',
      frequency: DEFAULT_HPF_HZ,
      Q: 0.5,
    });

    this.lpf = new BiquadFilterNode(context, {
      type: 'lowpass',
      frequency: DEFAULT_LPF_HZ, // this.MAX_LPF_HZ,
      Q: 0.707,
    });

    // Wet path: input -> delay -> hpf -> lpf -> wetGain -> mixer
    this.inputGain.connect(this.delay);
    this.delay.connect(this.hpf);
    this.hpf.connect(this.lpf);
    this.lpf.connect(this.wetGain);
    this.wetGain.connect(this.mixerOutput);

    // Dry path: input -> dryGain -> mixer
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.mixerOutput);

    // Output from mixer
    this.mixerOutput.connect(this.outputGain);

    this.setLimiting('soft-clipping');
    this.setAutoGain(true, 0.2);

    this.setMaxOutput(0.1);

    this.setDelay(0.05);
    this.setFeedback(this.MIN_FB);

    this.#initialized = true;
  }

  connect(destination: Destination) {
    return this.outputGain.connect(destination as any);
  }

  disconnect() {
    this.outputGain.disconnect();
    return this;
  }

  trigger(midiNote: number, velocity = 100, secondsFromNow = 0, cents = 0) {
    const timestamp = this.now + secondsFromNow + 0.0001;
    // use velocity to adjust gain input to processor ?
    this.setPitch(midiNote, cents, timestamp);

    return this;
  }

  // === SETTERS ===

  setMix(mix: { dry?: number; wet?: number }): this {
    const timestamp = this.now;

    if (mix.dry !== undefined) {
      const safeDry = Math.max(0, Math.min(1, mix.dry));
      this.dryGain.gain.setValueAtTime(safeDry, timestamp);
    }

    if (mix.wet !== undefined) {
      const safeWet = Math.max(0, Math.min(1, mix.wet));
      this.wetGain.gain.setValueAtTime(safeWet, timestamp);
    }

    return this;
  }

  setAmountMacro(amount: number): this {
    const safeAmount = clamp(amount, 0, 1);

    this.setMix({
      dry: 1 - safeAmount,
      wet: safeAmount,
    });

    this.setFeedback(safeAmount);

    return this;
  }

  setPitch(midiNote: number, cents: number = 0, timestamp = this.now) {
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    const tunedFrequency =
      cents !== 0 ? frequency * Math.pow(2, cents / 1200) : frequency;

    const delaySec = 1 / tunedFrequency;

    const minDelay = this.C6_SECONDS;
    const safeDelay = Math.max(minDelay, delaySec);

    this.setDelay(safeDelay, timestamp);

    return delaySec;
  }

  setFeedback(gain: number, timestamp = this.now) {
    const mappedGain = mapToRange(gain, 0, 1, this.MIN_FB, this.MAX_FB);
    this.delay.parameters.get('gain')!.setValueAtTime(mappedGain, timestamp);
    return this;
  }

  setDelay(seconds: number, timestamp = this.now) {
    const clamped = clamp(seconds, 0.001, 4);
    this.delay.parameters.get('delayTime')!.setValueAtTime(clamped, timestamp);
    return this;
  }

  setLimiting(mode: 'soft-clipping' | 'hard-clipping' | 'none'): this {
    this.delay.port.postMessage({
      type: 'setLimiting',
      mode: mode,
    });
    return this;
  }

  setAutoGain(enabled: boolean, amount = 0.3): this {
    this.delay.port.postMessage({
      type: 'setAutoGain',
      enabled: enabled,
      amount,
    });
    return this;
  }

  setMaxOutput(level: number): this {
    this.delay.port.postMessage({
      type: 'setMaxOutput',
      level: level,
    });
    return this;
  }

  // === GETTERS ===

  get in() {
    return this.inputGain;
  }
  get out() {
    return this.outputGain;
  }

  get now() {
    return this.audioContext.currentTime;
  }

  get mix(): { dry: number; wet: number } {
    return {
      dry: this.dryGain.gain.value,
      wet: this.wetGain.gain.value,
    };
  }

  get initialized() {
    return this.#initialized;
  }

  // === CLEANUP ===

  dispose() {
    this.disconnect();
    deleteNodeId(this.nodeId);
  }
}

// IF modulating input gain:
//   trigger(midiNote: number, velocity = 100, secondsFromNow = 0, cents = 0) {
//     const timestamp = this.now + secondsFromNow;

//     this.setPitch(midiNote, cents, timestamp);
//     this.setFeedback(0.9);

//     // const normalizedVelocity = Math.max(0, Math.min(1, velocity / 127));
//     // this.inputGain.gain
//     //   .cancelScheduledValues(timestamp)
//     //   .setValueAtTime(0, timestamp)
//     //   .exponentialRampToValueAtTime(normalizedVelocity, timestamp + this.attack)
//     //    .setTargetAtTime(0, timestamp + this.attack + this.hold, 0.1);
//   }

// Code using feedback-delay-processor below:

//   /**
//    * Set delay time based on MIDI note for pitched Karplus-Strong effect
//    * @param midiNote - MIDI note number (0-127)
//    * @param cents - Fine tuning in cents (optional, default 0)
//    */
//   setPitch(midiNote: number, cents: number = 0): this {
//     const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

//     const tunedFrequency =
//       cents !== 0 ? frequency * Math.pow(2, cents / 1200) : frequency;

//     this.setFrequency(tunedFrequency);

//     return this;
//   }

//   setDelay(ms: number) {
//     this.delay.parameters
//       .get('delayTime')!
//       .setValueAtTime(ms, this.audioContext.currentTime);
//   }

//   setFeedback(gain: number) {
//     this.delay.parameters
//       .get('gain')!
//       .setValueAtTime(gain, this.audioContext.currentTime);
//   }

//   /**
//    * Convenience method to set delay from frequency directly
//    * @param frequency - Frequency in Hz
//    */
//   setFrequency(frequency: number): this {
//     const delayMs = 1000 / frequency;
//     this.delay.parameters
//       .get('delayTime')!
//       .setValueAtTime(delayMs, this.audioContext.currentTime);
//     return this;
//   }
