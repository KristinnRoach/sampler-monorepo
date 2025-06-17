import { SampleVoice } from './SampleVoice';
import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';
import { ActiveNoteId } from '../types';

export class SampleVoicePool {
  readonly nodeId: NodeID;
  readonly nodeType = 'pool';

  #allVoices: SampleVoice[];
  #context: AudioContext;
  #activeVoices: Map<ActiveNoteId, SampleVoice>;
  #nextNoteId: number;

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
    this.#context = context;

    this.#allVoices = Array.from({ length: numVoices }, () => {
      const voice = new SampleVoice(context, { enableFilters });
      voice.connect(destination);
      return voice;
    });

    this.#activeVoices = new Map(); // noteId -> voice
    this.#nextNoteId = 0;

    this.#isReady = true;
  }

  setBuffer(buffer: AudioBuffer, zeroCrossings?: number[]) {
    this.#allVoices.forEach((voice) => voice.loadBuffer(buffer, zeroCrossings));
    return this;
  }

  // Voice Allocation
  findVoice() {
    // First priority: find an inactive voice
    const freeVoice = this.#allVoices.find(
      (v) => v.state !== 'PLAYING' && v.state !== 'RELEASING'
    );

    if (freeVoice) return freeVoice;

    // Second priority: find a releasing voice
    const releasingVoice = this.#allVoices.find((v) => v.state === 'RELEASING');
    if (releasingVoice) {
      releasingVoice.stop();
      return releasingVoice;
    }

    // Third priority: find the oldest playing voice
    return this.#allVoices.reduce(
      (oldest, voice) =>
        !oldest || voice.startTime < oldest.startTime ? voice : oldest,
      null as SampleVoice | null
    );
  }

  noteOn(
    midiNote: number,
    velocity = 100,
    secondsFromNow = 0,
    // attack_sec = 0.01,
    transposition = this.#transposeSemitones
  ): ActiveNoteId {
    const noteId = this.#nextNoteId++; // increments for next note

    const voice = this.findVoice();
    if (!voice) return noteId; // Still return a valid noteId

    // TODO: get envelope info and schedule trigger envelope at same time

    voice.trigger({
      // voice.trigger also returns noteId (redundant?)
      midiNote: midiNote + transposition,
      velocity,
      noteId,
      secondsFromNow,
      // attack_sec, // todo - make param in Voice
    });
    this.#activeVoices.set(noteId, voice);

    return noteId;
  }

  noteOff(noteId: ActiveNoteId, release_sec = 0.2, secondsFromNow: number = 0) {
    const voice = this.#activeVoices.get(noteId);

    if (voice) {
      voice.release({ release: release_sec, secondsFromNow });
      this.#activeVoices.delete(noteId);
    }
    return this;
  }

  allNotesOff(release_sec = 0) {
    if (release_sec <= 0) {
      this.#allVoices.forEach((voice) => voice.stop());
    } else {
      this.#allVoices.forEach((voice) => {
        if (voice.state === 'PLAYING') voice.release({ release: release_sec });
      });
    }
    this.#activeVoices.clear();

    return this;
  }

  applyToAllVoices(fn: (voice: SampleVoice) => void) {
    this.#allVoices.forEach((voice) => fn(voice));
  }

  applyToActiveVoices(fn: (voice: SampleVoice) => void) {
    this.#activeVoices.forEach((voice) => fn(voice));
  }

  applyToVoice(noteId: ActiveNoteId, fn: (voice: SampleVoice) => void) {
    const voice = this.#activeVoices.get(noteId);
    if (voice) {
      fn(voice);
    } else {
      console.warn(`No active voice found for noteId: ${noteId}`);
    }
  }

  dispose() {
    this.applyToAllVoices((voice) => voice.dispose());
    this.#allVoices = [];
    this.#activeVoices.clear();
    this.#context = null as any;
    this.#isReady = false;
    deleteNodeId(this.nodeId);
  }

  // todo: get filtersEnabled() & setFiltersEnabled

  get allVoices() {
    return this.#allVoices;
  }

  get activeVoicesCount() {
    return this.#activeVoices.size;
  }

  get transposeSemitones() {
    return this.#transposeSemitones;
  }
  set transposeSemitones(semitones) {
    this.#transposeSemitones = semitones;
  }
}

/* Igonre below
 *  todo: consider this for voice allocation - LATER (once everything else is working) */
// #available = new Set();
// #playing = new Set(); // maybe Map
// #releasing = new Set();

// #pop = (set: Set<any>) => {
//   const v = set.values().next().value;
//   set.delete(v);
//   return v;
// };
