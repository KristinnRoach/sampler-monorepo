// VoiceNode.ts

import { midiToPlaybackRate } from '@/utils/midiUtils';
import { EventBusOption } from '@/events'; // DefaultEventBus, EventBusOption
import { FlexEventDriven } from '@/abstract/nodes/baseClasses/FlexEventDriven';
// // TEMP HACK
// import { PseudoAudioParam } from '@/abstract/params/PseudoAudioParam';

export class VoiceNode extends FlexEventDriven {
  readonly eventBusOption: EventBusOption;

  #context: BaseAudioContext;
  #buffer: AudioBuffer;
  #basePlaybackRate: number;
  #rootNote: number; // MIDI note number of the original sample

  #activeSource: AudioBufferSourceNode | null;
  #nextSource: AudioBufferSourceNode;
  #outputNode: GainNode;

  // // TEMP HACK
  // #loopStart: PseudoAudioParam;
  // #loopEnd: PseudoAudioParam;

  #loopEnabled: boolean = false;

  constructor(
    context: BaseAudioContext,
    buffer: AudioBuffer,
    rootNote: number = 60,
    eventBusOption: EventBusOption = 'audio' // 'ui' | 'unique' | 'none'
  ) {
    super(eventBusOption); // sets the event bus used for this instance (notify, addListener, etc.)

    this.#context = context;
    this.#buffer = buffer;
    this.eventBusOption = eventBusOption;

    // set tuning
    this.#basePlaybackRate = midiToPlaybackRate(rootNote);
    this.#rootNote = rootNote;

    this.#outputNode = context.createGain();
    this.#outputNode.gain.setValueAtTime(0, this.now());

    this.#nextSource = this.#prepNextSource(buffer);

    // this.#loopStart = new PseudoAudioParam(this.#nextSource, 'loopStart');
    // this.#loopEnd = new PseudoAudioParam(this.#nextSource, 'loopEnd');

    this.#activeSource = null;
  }

  /* CHECKERS */

  isPlaying(): boolean {
    return this.#activeSource !== null;
  }

  isAvailable(): boolean {
    return this.#activeSource === null && this.#nextSource !== null;
  }

  now(): number {
    return this.#context.currentTime;
  }

  /**
   * Create and configure a buffer source
   * @param buffer Audio buffer to use
   */
  #prepNextSource(buffer: AudioBuffer = this.#buffer): AudioBufferSourceNode {
    const source = new AudioBufferSourceNode(this.#context, {
      buffer: buffer,
    });

    source.connect(this.#outputNode);

    // Set the playback rate
    source.playbackRate.value = this.#basePlaybackRate;
    source.loop = this.#loopEnabled;

    // source.loopStart = this.#loopStart?.currentValue ?? 0;
    // source.loopEnd = this.#loopEnd?.currentValue ?? buffer.duration;

    // Handle source ending
    source.onended = () => {
      if (source === this.#activeSource) {
        this.#activeSource.stop();
        this.#outputNode!.gain.cancelScheduledValues(0);
        // this.#outputNode!.gain.setValueAtTime(0, 0);

        this.#activeSource.disconnect();
        this.#activeSource = null;

        // Notify voice ended
        this.notify('note:off', {
          publisherId: this.nodeId,
          currentTime: this.now(),
          isAvailable: this.isAvailable(),
        });
      }
    };
    return source;
  }

  play(
    midiNote: number = this.#rootNote,
    voiceGain: number = 1,
    when: number = this.now()
  ): boolean {
    if (!this.isAvailable()) {
      this.notify('error', {
        publisherId: this.nodeId,
        note: midiNote,
        currentTime: when,
        message: 'Voice not available for playback',
      });
      return false;
    }

    const playbackRate = Math.pow(2, (midiNote - this.#rootNote) / 12);

    this.#outputNode!.gain.cancelScheduledValues(when);
    this.#outputNode!.gain.setValueAtTime(voiceGain, when);

    // Swap sources, tune and play
    this.#activeSource = this.#nextSource;
    this.#activeSource!.playbackRate.setValueAtTime(playbackRate, when);
    this.#activeSource!.detune.setValueAtTime(0, when); // Reset detune

    this.#activeSource!.start(when);

    this.notify('note:on', {
      publisherId: this.nodeId,
      note: midiNote,
      gain: voiceGain,
      currentTime: when,
    });

    this.#nextSource = this.#prepNextSource(this.#buffer);

    return true;
  }

  glideToNote(
    targetMidiNote: number,
    glideTime: number,
    when: number = this.now()
  ): void {
    if (!this.isPlaying()) return;

    // Calculate target playback rate
    const targetRate = Math.pow(2, (targetMidiNote - this.#rootNote) / 12);

    // Gradually change the playback rate
    this.#activeSource!.playbackRate.linearRampToValueAtTime(
      targetRate,
      when + glideTime
    );
  }

  setLoopPoint(
    loopPoint: 'loopStart' | 'loopEnd',
    targetValue: number,
    rampDuration: number = 0 // todo: Interpolate!
  ): void {
    if (this.#activeSource) {
      this.#activeSource[loopPoint] = targetValue;
    }
    if (this.#nextSource) {
      this.#nextSource[loopPoint] = targetValue;
    }
  }

  forceMakeAvailable(fadeOutSec: number = 0.05): void {
    if (this.#activeSource !== null) {
      this.#outputNode!.gain.cancelScheduledValues(0);
      this.#outputNode!.gain.setValueAtTime(0, fadeOutSec);
      this.#activeSource.stop(this.now() + fadeOutSec);
      this.#activeSource.disconnect();
      this.#activeSource = null;
    }

    this.#nextSource = this.#prepNextSource(this.#buffer);
  }

  triggerRelease(releaseTime: number = 0.1, when: number = this.now()): void {
    if (!this.#activeSource) {
      console.warn('Voice not playing when triggerRelease() called');
      // notify
      return;
    }

    // TODO: amp env
    this.#outputNode!.gain.cancelScheduledValues(when);
    this.#outputNode!.gain.setValueAtTime(this.#outputNode!.gain.value, when);
    this.#outputNode!.gain.linearRampToValueAtTime(0, when + releaseTime);
    // todo: notity voice available when the volume is 0 or close to it

    this.#activeSource!.stop(when + releaseTime);

    // Notify voice release scheduled
    this.notify('note:released', {
      publisherId: this.nodeId,
      endTime: when + releaseTime,
      currentTime: when,
    });
  }

  connect(destination: AudioNode | AudioParam): VoiceNode {
    if (!this.#outputNode) throw new Error('Gain node not initialized');
    this.#outputNode.connect(destination as any);
    return this;
  }

  dispose(): void {
    super.dispose();
    this.#outputNode?.disconnect();
    this.#activeSource?.disconnect();
    this.#nextSource.disconnect();
    this.#activeSource = null;
  }

  /*  GETTERS & SETTERS  */

  setLoopEnabled(enabled: boolean, rampDuration: number = 0.1): void {
    this.#loopEnabled = enabled;
    if (enabled && this.#activeSource) {
      // todo: interpolate - temp immediate
      this.#activeSource.loop = enabled;
    }
    this.#nextSource.loop = enabled;
  }

  /**
   * Set gain value (0-1)
   */
  setGain(value: number, timeOffset: number = 0): void {
    if (!this.#outputNode) throw new Error('Gain node not initialized');
    if (value < 0 || value > 1)
      throw new Error('Gain value out of range (0-1)');
    const time = this.#context.currentTime + timeOffset;
    this.#outputNode.gain.setValueAtTime(value, time);
  }

  getGain(): number {
    if (!this.#outputNode) throw new Error('Gain node not initialized');
    return this.#outputNode.gain.value;
  }

  setRootNote(midiNote: number): void {
    this.#rootNote = midiNote;
  }

  getRootNote(): number {
    return this.#rootNote;
  }
}

//  Saving for later use, ingnore for now.
//  Replace  with proper LFO impelemnation and ensure cleanup
//  applyVibrato(
//   depth: number,
//   rate: number,
//   duration: number = 1,
//   when: number = this.now()
// ): void {
//   if (!this.isPlaying()) return;

//   const vibratoOsc = this.#context.createOscillator();
//   const vibratoGain = this.#context.createGain();

//   vibratoOsc.frequency.value = rate; // Hz
//   vibratoGain.gain.value = depth; // Cents

//   vibratoOsc.connect(vibratoGain);
//   vibratoGain.connect(this.#activeSource!.detune);

//   vibratoOsc.start(when);
//   vibratoOsc.stop(when + duration);
// }
