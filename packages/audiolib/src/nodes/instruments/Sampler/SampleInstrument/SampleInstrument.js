import { VoicePool } from './VoicePool';

export class SampleInstrument {
  constructor(context, options = {}) {
    const { polyphony = 16, output = context.destination } = options;
    this.nodeId = 'SampleInstrument-TEST-id';
    this.context = context;
    this.output = output;
    this.buffer = null;
    this.pool = new VoicePool(context, polyphony, output);

    // Simple ID counter for note tracking
    this.nextNoteId = 0;
  }

  async loadSample(audioBuffer) {
    // const response = await fetch(url);
    // const arrayBuffer = await response.arrayBuffer();
    // this.buffer = await this.context.decodeAudioData(arrayBuffer);
    this.buffer = audioBuffer;
    this.pool.setBuffer(this.buffer);
    return this;
  }

  play(midiNote, velocity = 100, options = {}) {
    if (!this.buffer) return null;

    const when = this.context.currentTime + 0.0001;
    const noteId = this.nextNoteId++;
    console.debug(
      `s Instrument play() midiNote: ${midiNote}, when: ${when}, noteId: ${noteId}`
    );
    this.pool.noteOn(noteId, midiNote, velocity, when);
    return noteId;
  }

  release(noteId, when) {
    this.pool.noteOff(noteId, when);
    return this;
  }

  releaseAll() {
    // todo
  }

  dispose() {
    // todo
  }

  setPolyphony(numVoices) {
    // Replace voice pool with new size
    const newPool = new VoicePool(this.context, numVoices, this.output);
    if (this.buffer) newPool.setBuffer(this.buffer);
    this.pool = newPool;
    return this;
  }

  panic() {
    this.pool.allNotesOff();
    return this;
  }
}
