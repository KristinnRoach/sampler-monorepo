import {
  LibNode,
  Messenger,
  Destination,
  Connectable,
  NodeType,
} from '@/nodes/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';

export class KarplusEffect implements Connectable {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType = 'karplus-effect';

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

  playbackRateDivisor = 1; // enforce 1 | 2 | 4 | 8  ?

  attack = 0.1;
  hold = 0.2;
  glide = 0;

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

    this.lpf = new BiquadFilterNode(context, {
      type: 'lowpass',
      frequency: context.sampleRate / 2 - 1000,
      Q: 1,
    });

    this.hpf = new BiquadFilterNode(context, {
      type: 'highpass',
      frequency: 100,
      Q: 1,
    });

    // Wet path: input -> delay -> wetGain -> mixer
    this.inputGain.connect(this.delay);
    this.delay.connect(this.wetGain);
    this.wetGain.connect(this.mixerOutput);

    // Dry path: input -> dryGain -> mixer
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.mixerOutput);

    // Output from mixer
    this.mixerOutput.connect(this.outputGain);

    this.setDelay(0.1);
    this.setFeedback(0.8);
    // this.debugSetPitch()
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
    const safeAmount = Math.max(0, Math.min(1, amount));
    return this.setMix({
      dry: 1 - safeAmount,
      wet: safeAmount,
    });
  }

  setPlaybackRateDivisor(value: number) {
    this.playbackRateDivisor = value;
  }

  setPitch(midiNote: number, cents: number = 0, timestamp = this.now) {
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    const tunedFrequency =
      cents !== 0 ? frequency * Math.pow(2, cents / 1200) : frequency;
    const totalDelay = 1 / tunedFrequency;

    if (this.glide === 0) {
      this.setDelay(totalDelay, timestamp);
    } else {
      this.delay.parameters
        .get('delayTime')!
        .exponentialRampToValueAtTime(totalDelay, timestamp + this.glide);
    }
    return totalDelay;
  }

  setFeedback(gain: number, timestamp = this.now) {
    const clampedGain = Math.max(0, Math.min(0.95, gain));
    this.delay.parameters.get('gain')!.setValueAtTime(clampedGain, timestamp);
    return this;
  }

  setDelay(seconds: number, timestamp = this.now) {
    const delayMs = seconds * 1000;
    this.delay.parameters.get('delayTime')!.setValueAtTime(delayMs, timestamp);
    return this;
  }

  setGlide(seconds: number) {
    this.glide = seconds;
    return this;
  }

  setLimiting(mode: 'soft-clipping' | 'hard-clipping' | 'none'): this {
    this.delay.port.postMessage({
      type: 'setLimiting',
      mode: mode,
    });
    return this;
  }

  setAutoGain(enabled: boolean): this {
    this.delay.port.postMessage({
      type: 'setAutoGain',
      enabled: enabled,
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

  // === DEBUG ===

  debugSetPitch() {
    const totalDelay_69 = this.setPitch(69); // A4 = 440Hz should give ~2.27ms delay
    console.debug('setPitch(69): ', totalDelay_69);
    const totalDelay_57 = this.setPitch(57); // A3 = 220Hz should give ~4.54ms delay
    console.debug('setPitch(57): ', totalDelay_57);
    const totalDelay_81 = this.setPitch(81); // A5 = 880Hz should give ~1.14ms delay
    console.debug('setPitch(81): ', totalDelay_81);
  }

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
