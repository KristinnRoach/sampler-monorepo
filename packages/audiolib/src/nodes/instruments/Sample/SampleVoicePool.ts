import { SampleVoice } from './SampleVoice';
import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';
import { MidiValue } from '../types';
import { VoiceState } from '../VoiceState';
import { Message } from '@/events';

export class SampleVoicePool {
  readonly nodeId: NodeID;
  readonly nodeType = 'pool';

  #allVoices: SampleVoice[];
  #playingMidiVoiceMap = new Map<MidiValue, SampleVoice>();

  #available = new Set<SampleVoice>();
  #playing = new Set<SampleVoice>();
  #releasing = new Set<SampleVoice>();

  #transposeSemitones = 0;

  #isReady: boolean = false;
  get isReady() {
    return this.#isReady;
  }

  constructor(
    context: AudioContext,
    numVoices: number,
    destination: AudioNode,
    enableFilters: boolean = true
  ) {
    this.nodeId = createNodeId(this.nodeType);

    this.#allVoices = Array.from({ length: numVoices }, () => {
      const voice = new SampleVoice(context, { enableFilters });
      voice.connect(destination);
      return voice;
    });

    // All voices start as available
    this.#allVoices.forEach((voice) => {
      this.#available.add(voice);

      voice.onMessage('voice:started', (msg: Message) => {
        // Ensure mutual exlusion (idempotent delete)
        this.#available.delete(msg.voice);
        this.#releasing.delete(msg.voice);

        this.#playing.add(msg.voice);
        this.#playingMidiVoiceMap.set(msg.midiNote, msg.voice);
      });

      voice.onMessage('voice:releasing', (msg: Message) => {
        // Ensure mutual exlusion
        this.#available.delete(msg.voice);
        this.#playing.delete(msg.voice);

        this.#releasing.add(msg.voice);

        // Remove from midiToVoice map, is this voice owns this midinote
        if (this.#playingMidiVoiceMap.get(msg.midiNote) === msg.voice) {
          this.#playingMidiVoiceMap.delete(msg.midiNote);
        }
      });

      voice.onMessage('voice:stopped', (msg: Message) => {
        // Ensure mutual exlusion
        this.#playing.delete(msg.voice);
        this.#releasing.delete(msg.voice);

        this.#available.add(msg.voice);

        this.debug();
      });
    });

    this.#isReady = true;
  }

  setBuffer(buffer: AudioBuffer, zeroCrossings?: number[]) {
    this.#allVoices.forEach((voice) => voice.loadBuffer(buffer, zeroCrossings));
    return this;
  }

  pop = (set: Set<any>) => {
    const v = set.values().next().value;
    set.delete(v);
    return v;
  };

  allocate(
    available = this.#available,
    releasing = this.#releasing,
    playing = this.#playing
  ): SampleVoice {
    let voice;

    if (available.size) voice = this.pop(available);
    else if (releasing.size) voice = this.pop(releasing);
    else if (playing.size) voice = this.pop(playing);
    else throw new Error(`Could not allocate voice`);

    return voice;
  }

  noteOn(
    midiNote: MidiValue,
    velocity: MidiValue = 100,
    secondsFromNow = 0,
    transposition = this.#transposeSemitones
  ): MidiValue {
    const voice = this.allocate();

    const triggerResult = voice.trigger({
      midiNote: midiNote + transposition,
      velocity,
      secondsFromNow,
    });

    if (!triggerResult) console.warn(`no trigger result, ${triggerResult}`);

    return midiNote;
  }

  noteOff(midiNote: MidiValue, release_sec = 0.2, secondsFromNow: number = 0) {
    const voice = this.#playingMidiVoiceMap.get(midiNote);

    if (voice?.state === VoiceState.PLAYING) {
      voice.release({ release: release_sec, secondsFromNow });
    }

    return this;
  }

  allNotesOff(release_sec = 0) {
    this.#playingMidiVoiceMap.forEach((voice) => {
      voice.release({ release: release_sec });
    });

    this.#playingMidiVoiceMap.clear();
    return this;
  }

  applyToAllVoices(fn: (voice: SampleVoice) => void) {
    this.#allVoices.forEach((voice) => fn(voice));
  }

  applyToActiveVoices(fn: (voice: SampleVoice) => void) {
    this.#playingMidiVoiceMap.forEach((voice) => fn(voice));
  }

  applyToInactiveVoices(fn: (voice: SampleVoice) => void) {
    this.#available.forEach((voice) => fn(voice));
  }

  applyToActiveNote(midiNote: MidiValue, fn: (voice: SampleVoice) => void) {
    const voice = this.#playingMidiVoiceMap.get(midiNote);
    if (voice) {
      fn(voice);
    } else {
      console.warn(`No active voice found for midiNote: ${midiNote}`);
    }
  }

  debug() {
    console.warn(
      `
      releasing: ${this.#releasing.size}
      playing: ${this.#playing.size}
      available: ${this.#available.size}
      Sum: ${this.#releasing.size + this.#playing.size + this.#available.size}
      Sum should be: ${this.allVoicesCount}
      `,
      { midiToVoiceMap: this.#playingMidiVoiceMap }
    );
  }

  dispose() {
    this.applyToAllVoices((voice) => voice.dispose());
    this.#allVoices = [];
    this.#playingMidiVoiceMap.clear();
    this.#available.clear();
    this.#releasing.clear();
    this.#playing.clear();
    this.#isReady = false;
    deleteNodeId(this.nodeId);
  }

  get availableVoices() {
    return this.#available;
  }

  get playingVoicesCount() {
    return this.#playing.size;
  }

  get releasingVoicesCount() {
    return this.#releasing.size;
  }

  get availableVoicesCount() {
    return this.#available.size;
  }

  get allVoices() {
    return this.#allVoices;
  }

  get allVoicesCount() {
    return this.#allVoices.length;
  }

  get assignedVoicesMidiMap() {
    return this.#playingMidiVoiceMap;
  }

  get transposeSemitones() {
    return this.#transposeSemitones;
  }
  set transposeSemitones(semitones) {
    this.#transposeSemitones = semitones;
  }
}

// Old version below:
// const freeVoice = this.#allVoices.find(
//   (v) => v.state === VoiceState.STOPPED || v.state === VoiceState.IDLE
// );
// if (freeVoice) return { voice: freeVoice, forceStopped: false };

// console.info(`
//   Active: ${this.activeVoicesCount}
//   Available: ${this.availableVoicesCount}
//   `);

// const noteId = this.#nextNoteId++; // increments for next note

// const voiceResult = this.findVoice();
// if (!voiceResult?.voice) return midiNote;

// const { voice, forceStopped } = voiceResult;

// if (forceStopped) {
//   console.info(`pool.noteOn(): Force Stopped a voice: ${voice}`);
//   // 8ms when voice was stopped to avoid scheduling conflict
//   secondsFromNow = Math.max(secondsFromNow, 0.008);
// }
// // ! Fade out existing.. temp solution
// if (this.#activeVoices.has(midiNote)) {
//   // this.noteOff(midiNote);
// }
// this.#activeVoices.set(midiNote, voice);

// findVoice() {
//   // First priority: find an inactive voice
//   if (this.#available.size > 0) {
//     const availableVoice = pop(this.#available);
//     return { voice: availableVoice, forceStopped: false };
//   }

//   // Second priority: find a releasing voice
//   const releasingVoice = this.#allVoices.find(
//     (v) => v.state === VoiceState.RELEASING
//   );

//   if (releasingVoice) {
//     releasingVoice.stop();
//     this.#available.delete(releasingVoice);
//     console.info('Had to resort to stopping a releasing voice: ', {
//       releasingVoice,
//     });
//     return { voice: releasingVoice, forceStopped: true };
//   }

//   // Third priority: find the oldest playing voice
//   const oldestVoice = this.#allVoices.reduce(
//     (oldest, voice) =>
//       !oldest || voice.startTime < oldest.startTime ? voice : oldest,
//     null as SampleVoice | null
//   );

//   if (oldestVoice) {
//     oldestVoice.stop();
//     this.#available.delete(oldestVoice);
//     console.info('Had to resort to stopping the oldest playing voice: ', {
//       oldestVoice,
//     });
//     return { voice: oldestVoice, forceStopped: true };
//   }

//   return null;
// }
