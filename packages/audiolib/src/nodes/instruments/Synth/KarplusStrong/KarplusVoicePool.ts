// KarplusVoicePool.ts

import { KarplusVoice } from './KarplusVoice';
import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';
import { ActiveNoteId, MidiValue } from '@/nodes/instruments/types';
import { Connectable, Destination } from '@/nodes/LibNode';

export class KarplusVoicePool {
  readonly nodeId: NodeID;
  readonly nodeType = 'karplus-pool';

  #allVoices: KarplusVoice[];
  #context: AudioContext;
  #activeVoices: Map<ActiveNoteId, KarplusVoice>;
  #nextNoteId: number;

  #isReady: boolean = false;

  get isReady() {
    return this.#isReady;
  }

  constructor(
    context: AudioContext,
    numVoices: number,
    destination: AudioNode
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;

    this.#allVoices = Array.from({ length: numVoices }, () => {
      const voice = new KarplusVoice(context);
      voice.connect(destination);
      return voice;
    });

    this.#activeVoices = new Map(); // noteId -> voice
    this.#nextNoteId = 0;

    this.#isReady = true;
  }

  connect = (destination: AudioNode) => {
    // Destination
    this.#allVoices.forEach((v) => v.connect(destination));
  };

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
    velocity = 100,
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

  applyToAllVoices(fn: (voice: KarplusVoice) => void) {
    this.#allVoices.forEach((voice) => fn(voice));
  }

  applyToActiveVoices(fn: (voice: KarplusVoice) => void) {
    this.#activeVoices.forEach((voice) => fn(voice));
  }

  applyToVoice(noteId: ActiveNoteId, fn: (voice: KarplusVoice) => void) {
    const voice = this.#activeVoices.get(noteId);
    if (voice) {
      fn(voice);
    } else {
      console.warn(`No active voice found for noteId: ${noteId}`);
    }
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

  // get auxIn() {
  //   this.in.forEach((input) => stream.connect(input));
  // }

  set auxIn(stream: Connectable | AudioNode) {
    this.ins.forEach((input) => {
      if ('connect' in stream) {
        if (stream instanceof AudioNode) {
          stream.connect(input as unknown as AudioNode);
        } else if ('connect' in stream) {
          (stream as Connectable).connect(input);
        }
      }
    });
  }

  get ins(): AudioNode[] {
    const inputs: AudioNode[] = [];
    this.#allVoices.forEach((v) => inputs.push(v.in));
    return inputs;
  }
}
