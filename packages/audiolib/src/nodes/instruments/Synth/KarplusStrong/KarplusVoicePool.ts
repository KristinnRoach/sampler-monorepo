// KarplusVoicePool.ts

import { KarplusVoice } from './KarplusVoice';
import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';
import { ActiveNoteId, MIDINote } from '@/nodes/instruments/types';

export class KarplusVoicePool {
  readonly nodeId: NodeID;
  readonly nodeType = 'karplus-pool';

  #allVoices: KarplusVoice[];
  #context: AudioContext;
  #activeVoices: Map<ActiveNoteId, KarplusVoice>;
  #nextNoteId: number;

  constructor(
    context: AudioContext,
    numVoices: number,
    destination: AudioNode
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;

    // Create KarplusVoice instances rather than SampleVoice instances
    this.#allVoices = Array.from({ length: numVoices }, () =>
      new KarplusVoice(context).connect(destination)
    );

    this.#activeVoices = new Map(); // noteId -> voice
    this.#nextNoteId = 0;
  }

  // Voice Allocation
  findVoice() {
    // First priority: find an inactive voice
    const freeVoice = this.#allVoices.find((v) => !v.isPlaying);
    if (freeVoice) return freeVoice;

    // If all voices are active, steal the oldest voice
    return this.#allVoices.reduce(
      (oldest, voice) =>
        !oldest || voice.startTime < oldest.startTime ? voice : oldest,
      null as KarplusVoice | null
    );
  }

  noteOn(
    midiNote: number,
    velocity: number = 100,
    when: number = this.#context.currentTime
  ): ActiveNoteId {
    const noteId = this.#nextNoteId++; // increments for next note
    const voice = this.findVoice();

    if (!voice) return noteId; // Still return a valid noteId

    // Stop the voice if it's currently playing
    if (voice.isPlaying) {
      voice.stop();
    }

    // Trigger the Karplus-Strong voice with the note parameters
    voice.trigger({
      midiNote,
      velocity,
      noteId,
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
    this.#allVoices.forEach((voice) => voice.dispose());
    this.#allVoices = [];
    this.#activeVoices.clear();
    deleteNodeId(this.nodeId);
  }

  get allVoices() {
    return [...this.#allVoices];
  }

  get activeVoicesCount() {
    return this.#activeVoices.size;
  }
}
