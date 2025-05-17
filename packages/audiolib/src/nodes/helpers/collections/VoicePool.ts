import { SampleVoice } from '../../instruments/Sample/SampleVoice';
import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';
import { ActiveNoteId, MIDINote } from '../../instruments/types';

export class VoicePool {
  readonly nodeId: NodeID;
  readonly nodeType = 'pool';

  #allVoices: SampleVoice[];
  #context: AudioContext;
  #activeVoices: Map<ActiveNoteId, SampleVoice>;
  #nextNoteId: number;

  constructor(
    context: AudioContext,
    numVoices: number,
    destination: AudioNode
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;

    this.#allVoices = Array.from({ length: numVoices }, () =>
      new SampleVoice(context).connect(destination)
    );

    this.#activeVoices = new Map(); // noteId -> voice
    this.#nextNoteId = 0;
  }

  setBuffer(buffer: AudioBuffer) {
    this.#allVoices.forEach((voice) => voice.loadBuffer(buffer));
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
    velocity: number = 100,
    when: number = this.#context.currentTime,
    attack_sec?: number
  ): ActiveNoteId {
    const noteId = this.#nextNoteId++; // increments for next note

    const voice = this.findVoice();
    if (!voice) return noteId; // Still return a valid noteId

    voice.trigger({
      // voice.trigger also returns noteId, why should it?
      midiNote,
      velocity,
      noteId,
      secondsFromNow: when,
      attack_sec,
    });
    this.#activeVoices.set(noteId, voice);

    return noteId;
  }

  noteOff(noteId: ActiveNoteId, release_sec = 0.2, secondsFromNow: number = 0) {
    const voice = this.#activeVoices.get(noteId);

    if (voice) {
      voice.release({ release_sec, secondsFromNow });
      this.#activeVoices.delete(noteId);
    }
    return this;
  }

  allNotesOff() {
    this.#allVoices.forEach((voice) => voice.stop());
    this.#activeVoices.clear();
    return this;
  }

  dispose() {
    deleteNodeId(this.nodeId);
  }

  get allVoices() {
    return this.#allVoices;
  }

  get activeVoicesCount() {
    return this.#activeVoices.size;
  }
}

/* Todo: consider this for voice allocation - LATER (once everything else is working) */
// #available = new Set();
// #playing = new Set(); // maybe Map
// #releasing = new Set();

// #pop = (set: Set<any>) => {
//   const v = set.values().next().value;
//   set.delete(v);
//   return v;
// };
