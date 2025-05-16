import { SamplePlayer } from './SamplePlayer';
import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';

export class VoicePool {
  readonly nodeId: NodeID;
  readonly nodeType = 'pool';

  #voices: SamplePlayer[];
  #context: AudioContext;
  #activeNotes: Map<number | string, SamplePlayer>;

  #available = new Set();
  #playing = new Set(); // check if Map with Midi notes is needed
  #releasing = new Set();

  constructor(
    context: AudioContext,
    numVoices: number,
    destination: AudioNode
  ) {
    this.nodeId = createNodeId(this.nodeType);

    this.#voices = Array.from({ length: numVoices }, () =>
      new SamplePlayer(context).connect(destination)
    );

    this.#context = context;

    this.#activeNotes = new Map(); // noteId -> voice
  }

  setBuffer(buffer: AudioBuffer) {
    this.#voices.forEach((voice) => voice.setBuffer(buffer));
    return this;
  }

  // Find the best voice to use
  findVoice() {
    // First priority: find an inactive voice
    const freeVoice = this.#voices.find((v) => !v.isPlaying);
    if (freeVoice) return freeVoice;

    // Second priority: find the oldest playing voice
    return this.#voices.reduce(
      (oldest, voice) =>
        !oldest || voice.startTime < oldest.startTime ? voice : oldest,
      null as SamplePlayer | null
    );
  }

  noteOn(
    noteId: number | string,
    pitch: number,
    velocity: number,
    when: number = this.#context.currentTime
  ) {
    // Release any existing note with same ID
    this.noteOff(noteId, when);

    // Find and use a voice
    const voice = this.findVoice();
    if (!voice) return null;

    voice.play(noteId, pitch, velocity, when);
    this.#activeNotes.set(noteId, voice);

    return voice;
  }

  noteOff(noteId: number | string, when: number = this.#context.currentTime) {
    const voice = this.#activeNotes.get(noteId);
    if (voice) {
      voice.release(when);
      this.#activeNotes.delete(noteId);
    }
    return this;
  }

  // Emergency stop all voices
  allNotesOff() {
    this.#voices.forEach((voice) => voice.stop());
    this.#activeNotes.clear();
    return this;
  }

  dispose() {
    deleteNodeId(this.nodeId);
  }
}
