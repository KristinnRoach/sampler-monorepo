// VoiceNode.ts
import { midiToPlaybackRate } from '@/utils/midiUtils';
import { EventBusOption } from '@/events'; // DefaultEventBus, EventBusOption
import { FlexEventDriven } from '@/abstract/nodes/baseClasses/FlexEventDriven';
// import { MultiLoopController } from '@/processors/loop/MultiLoopController';
// import { createLWN } from './fact';

export class VoiceNode extends FlexEventDriven {
  readonly eventBusOption: EventBusOption;

  #context: BaseAudioContext;
  #buffer: AudioBuffer;
  #basePlaybackRate: number;
  #rootNote: number; // MIDI note number of the original sample

  #activeSrc: AudioBufferSourceNode | null;
  #nextSrc: AudioBufferSourceNode;
  #outputNode: GainNode;

  #loopEnabled: boolean = false;
  // #loopController: MultiLoopController | null = null;
  // #looper: OptimizedLoopWorkletNode;

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

    this.#basePlaybackRate = midiToPlaybackRate(rootNote);
    this.#rootNote = rootNote;

    this.#outputNode = context.createGain();
    this.#outputNode.gain.setValueAtTime(0, this.now());

    // this.#loopController = new MultiLoopController(this.#context, {
    //   loopStart: 0,
    //   loopEnd: buffer.duration,
    //   processorOptions: {
    //     significantChange: 0.001,
    //     loopEnabled: this.#loopEnabled,
    //   },
    // });

    this.#nextSrc = this.#prepNextSource(buffer);

    this.#activeSrc = null;
  }

  // setLoopController(loopController: MultiLoopController): void {
  //   if (this.#loopController) return;

  //   this.#loopController = loopController;
  //   if (this.#activeSrc) this.#loopController.addSourceNode(this.#activeSrc);

  //   if (this.#nextSrc) this.#loopController.addSourceNode(this.#nextSrc);
  // }

  setLoopStartDirectly(loopStart: number): void {
    if (this.#activeSrc) this.#activeSrc.loopStart = loopStart;
    this.#nextSrc.loopStart = loopStart;
  }

  setLoopEndDirectly(loopEnd: number): void {
    if (this.#activeSrc) this.#activeSrc.loopEnd = loopEnd;
    this.#nextSrc.loopEnd = loopEnd;
  }

  /* CHECKERS */

  isPlaying(): boolean {
    return this.#activeSrc !== null;
  }

  isAvailable(): boolean {
    return this.#activeSrc === null && this.#nextSrc !== null;
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

    // this.#loopController?.addSourceNode(source);

    source.connect(this.#outputNode);

    source.playbackRate.value = this.#basePlaybackRate;
    source.loop = this.#loopEnabled;

    source.onended = () => {
      if (source === this.#activeSrc) {
        this.#activeSrc.stop();
        this.#outputNode!.gain.cancelScheduledValues(0);
        this.#activeSrc.disconnect();
        this.#activeSrc = null;

        this.notify('note:ended', {
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
      // todo: force make available if volume low
      this.notify('error', {
        publisherId: this.nodeId,
        note: midiNote,
        currentTime: when,
      });
      return false;
    }

    const playbackRate = Math.pow(2, (midiNote - this.#rootNote) / 12);

    this.#outputNode!.gain.cancelScheduledValues(when);
    this.#outputNode!.gain.setValueAtTime(voiceGain, when);

    // Swap sources, tune and play
    this.#activeSrc = this.#nextSrc;
    this.#activeSrc!.playbackRate.setValueAtTime(playbackRate, when);
    this.#activeSrc!.detune.setValueAtTime(0, when); // Reset detune

    this.#activeSrc!.start(when);

    this.notify('note:started', {
      publisherId: this.nodeId,
      note: midiNote,
      gain: voiceGain,
      currentTime: when,
    });

    this.#nextSrc = this.#prepNextSource(this.#buffer);

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
    this.#activeSrc!.playbackRate.linearRampToValueAtTime(
      targetRate,
      when + glideTime
    );
  }

  forceMakeAvailable(fadeOutSec: number = 0.05): void {
    if (this.#activeSrc !== null) {
      this.#outputNode!.gain.cancelScheduledValues(0);
      this.#outputNode!.gain.setValueAtTime(0, fadeOutSec);
      this.#activeSrc.stop(this.now() + fadeOutSec);
      this.#activeSrc.disconnect();
      this.#activeSrc = null;
    }

    this.#nextSrc = this.#prepNextSource(this.#buffer);
  }

  triggerRelease(releaseTime: number = 0.1, when: number = this.now()): void {
    if (!this.#activeSrc) {
      // notify
      return;
    }

    // TODO: amp env
    this.#outputNode.gain.cancelScheduledValues(when);
    this.#outputNode.gain.setValueAtTime(this.#outputNode!.gain.value, when);
    this.#outputNode.gain.linearRampToValueAtTime(0, when + releaseTime);
    // todo: notify voice available when the volume is 0 or close to it

    this.#activeSrc!.stop(when + releaseTime);

    // Notify voice release
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
    this.#activeSrc?.disconnect();
    this.#nextSrc.disconnect();
    this.#activeSrc = null;
  }

  /*  GETTERS & SETTERS  */

  setLoopEnabled(enabled: boolean, rampDuration: number = 0.1): void {
    this.#loopEnabled = enabled;
    if (enabled && this.#activeSrc) {
      this.#activeSrc.loop = enabled;
    }
    this.#nextSrc.loop = enabled;
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

// LoopPoints currently handled by the LoopController
// setLoopPoint(
//   loopPoint: 'loopStart' | 'loopEnd',
//   targetValue: number,
//   rampDuration: number = 0
// ): void {
//   if (this.#activeSource) {
//     this.#activeSource[loopPoint] = targetValue;
//   }
//   if (this.#nextSource) {
//     this.#nextSource[loopPoint] = targetValue;
//   }
// }
