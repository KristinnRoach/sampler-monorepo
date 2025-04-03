// VoiceNode.ts

import { midiToPlaybackRate } from '@/utils/midiUtils';
import { IEventBus } from '@/events'; // DefaultEventBus, EventBusOption
import { FlexEventDriven } from '@/abstract/nodes/baseClasses/FlexEventDriven';

export class VoiceNode extends FlexEventDriven {
  #context: BaseAudioContext;
  #voiceId: number;
  #buffer: AudioBuffer;
  // #eventBus: IEventBus;
  // #isSharedEventBus: boolean;

  #basePlaybackRate: number;
  #rootNote: number; // MIDI note number of the original sample

  #activeSource: AudioBufferSourceNode | null;
  #nextSource: AudioBufferSourceNode;
  #outputNode: GainNode;

  constructor(
    voiceId: number,
    context: BaseAudioContext,
    buffer: AudioBuffer,
    rootNote: number = 60,
    EventBusOption?: IEventBus
  ) {
    super(EventBusOption);
    this.#context = context;
    this.#buffer = buffer;
    this.#voiceId = voiceId;

    // this.#eventBus = sharedEventBus || new DefaultEventBus();
    // this.#isSharedEventBus = !!sharedEventBus; // (skoða (!!) operator)

    // set tuning
    this.#basePlaybackRate = midiToPlaybackRate(rootNote);
    this.#rootNote = rootNote;

    this.#outputNode = context.createGain();
    this.#outputNode.gain.setValueAtTime(0, this.now());

    this.#nextSource = this.#prepNextSource(buffer);

    this.#activeSource = null;
  }

  getId() {
    return this.#voiceId;
  }

  // getEventBus(): IEventBus {
  //   if (!this.#eventBus) {
  //     throw new Error('Event bus not initialized');
  //   }
  //   return this.#eventBus;
  // }

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

    // Handle source ending
    source.onended = () => {
      if (source === this.#activeSource) {
        this.#activeSource.stop();
        this.#outputNode!.gain.cancelScheduledValues(0);
        // this.#outputNode!.gain.setValueAtTime(0, 0);

        this.#activeSource.disconnect();
        this.#activeSource = null;

        // Notify voice ended
        this.notify('voice:ended', {
          publisherId: this.#voiceId,
          currentTime: this.now(),
        });
      }
    };
    return source;
  }

  /**
   * Play an audio buffer
   */
  play(
    midiNote: number = this.#rootNote,
    voiceGain: number = 1,
    when: number = this.now()
  ): boolean {
    if (!this.isAvailable()) {
      this.notify('error', {
        publisherId: this.#voiceId,
        note: midiNote,
        currentTime: when,
        message: 'Voice not available for playback',
      });
      return false;
    }

    const playbackRate = Math.pow(2, (midiNote - this.#rootNote) / 12);

    this.#outputNode!.gain.cancelScheduledValues(when);
    this.#outputNode!.gain.setValueAtTime(voiceGain, when);
    // console.log('Set gain to:', voiceGain, 'at time:', when);

    // Swap sources, tune and play
    this.#activeSource = this.#nextSource;
    this.#activeSource!.playbackRate.setValueAtTime(playbackRate, when);
    this.#activeSource!.detune.setValueAtTime(0, when); // Reset detune

    this.#activeSource!.start(when);

    // todo: notify listeners started

    // prep next source
    this.#nextSource = this.#prepNextSource(this.#buffer);
    // todo: notify listeners isAvailable

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

  forceMakeAvailable(): void {
    // Stop any active source if it's playing
    if (this.#activeSource) {
      try {
        this.#activeSource.stop();
      } catch (e) {
        // Handle the case where it might have already stopped
      }
      this.#activeSource = null;
    }

    // Prepare a fresh source for the next play
    this.#nextSource = this.#prepNextSource(this.#buffer);
  }

  triggerRelease(releaseTime: number = 0.1, when: number = this.now()): void {
    if (!this.#activeSource) {
      console.warn('Voice not playing when triggerRelease() called');
      // todo: notify listeners

      return;
    }

    this.#activeSource!.stop(when + releaseTime);

    // Notify voice release scheduled
    this.notify('voice:released', {
      publisherId: this.#voiceId,
      endTime: when + releaseTime,
      currentTime: when,
    });
  }

  /**
   * Connect the voice node's output to a destination
   */
  connect(destination: AudioNode | AudioParam): VoiceNode {
    if (!this.#outputNode) throw new Error('Gain node not initialized');
    this.#outputNode.connect(destination as any);
    return this;
  }

  /**
   * Disconnect the voice node from all destinations
   */
  dispose(): void {
    this.#outputNode?.disconnect();
    this.#activeSource?.disconnect();
    this.#nextSource?.disconnect();
    this.#activeSource = null;

    // If we created our own event bus, clean it up completely
    // if (this.hasEventBus()) {
    //   this.removeAllListeners('error');
    //   this.removeAllListeners('voice:started');
    //   this.removeAllListeners('voice:ended');
    //   this.removeAllListeners('voice:released');
    // }
    // Otherwise we don't remove anything, as listeners might be shared
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

  /**
   * Get the current gain value
   */
  getGain(): number {
    if (!this.#outputNode) throw new Error('Gain node not initialized');
    return this.#outputNode.gain.value;
  }

  isPlaying(): boolean {
    return this.#activeSource !== null;
  }

  isAvailable(): boolean {
    return this.#activeSource === null && this.#nextSource !== null;
  }

  now(): number {
    return this.#context.currentTime;
  }

  setRootNote(midiNote: number): void {
    this.#rootNote = midiNote;
  }

  getRootNote(): number {
    return this.#rootNote;
  }
}

//  // Todo: replace this with proper LFO impelemnation and ensure cleanup
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
