import { LibInstrument, KarplusNode, Instrument } from '@/nodes';
import { Pool } from '@/nodes/collections/Pool';
import { createNodeId } from '@/store/state/IdStore';
import { getAudioContext } from '@/context';
import { Message, MessageHandler, createMessageBus } from '@/events';
// import { isModifierStateSupported } from '@/utils';

export class KarplusStrongSynth implements LibInstrument {
  readonly nodeId: NodeID;
  readonly nodeType: Instrument = 'synth';

  #context: AudioContext;
  #output: GainNode;
  #voicePool: Pool<KarplusNode>;
  #messages;

  #activeNotes = new Map<number, Set<KarplusNode>>();
  #attackTime: number = 0;
  #releaseTime: number = 0.3;

  constructor(polyphony: number = 8) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = getAudioContext();
    this.#output = new GainNode(this.#context);
    this.#output.gain.value = 0.9;
    this.#voicePool = new Pool<KarplusNode>();
    this.#messages = createMessageBus<Message>(this.nodeId);

    this.#preCreateVoices(polyphony);
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any): void {
    this.#messages.sendMessage(type, data);
  }

  #preCreateVoices(polyphony: number): void {
    for (let i = 0; i < polyphony; i++) {
      const voice = new KarplusNode();
      voice.connect(this.#output);
      this.#voicePool.add(voice);
    }
  }

  play(midiNote: number, modifers: TODO, velocity: number = 1): this {
    const voice = this.#voicePool.allocateNode();
    if (!voice) return this;

    // Trigger note first
    voice.trigger({ midiNote, velocity });

    this.sendMessage('note:on', { midiNote, velocity });

    // Bookkeeping
    if (!this.#activeNotes.has(midiNote)) {
      this.#activeNotes.set(midiNote, new Set());
    }
    this.#activeNotes.get(midiNote)!.add(voice);

    voice.onMessage('voice:ended', () => {
      const noteSet = this.#activeNotes.get(midiNote);
      if (noteSet) {
        noteSet.delete(voice);
        if (noteSet.size === 0) {
          this.#activeNotes.delete(midiNote);
        }
      }
      this.sendMessage('voice:ended', { midiNote });
    });

    // if (modifers.caps && isModifierStateSupported()) {
    //   // Temp hax
    //   setInterval(() => {
    //     this.play(midiNote, modifers, velocity);
    //   }, this.#releaseTime * 1000);
    // }

    return this;
  }

  release(midiNote: number, modifers?: TODO): this {
    const voices = this.#activeNotes.get(midiNote);
    if (!voices || voices.size === 0) {
      console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    voices.forEach((voice) => {
      voice.release(this.#releaseTime);
    });

    this.sendMessage('note:off', { midiNote });
    return this;
  }

  stopAll(): this {
    this.#activeNotes.forEach((voices, midiNote) => {
      voices.forEach((voice) => {
        voice.release(this.#releaseTime);
      });
    });
    this.#activeNotes.clear();
    return this;
  }

  releaseAll(): this {
    return this.stopAll();
  }

  setParamValue(name: string, value: number): this {
    this.#voicePool.nodes.forEach((voice) => {
      const param = voice.getParam(name);
      if (param) {
        param.setValueAtTime(value, this.#context.currentTime);
      }
    });
    return this;
  }

  getParamValue(name: string): number | null {
    const firstVoice = this.#voicePool.nodes[0];
    if (firstVoice) {
      const param = firstVoice.getParam(name);
      return param ? param.value : null;
    }
    return null;
  }

  onGlobalLoopToggle(): this {
    // TODO: loop not implemented yet
    // this.setLoopEnabled(!this.loopEnabled);
    return this;
  }

  connect(destination: AudioNode): this {
    this.#output.connect(destination);
    return this;
  }

  disconnect(): void {
    this.#output.disconnect();
  }

  dispose(): void {
    this.stopAll();
    this.disconnect();

    this.#voicePool.dispose();
    this.#activeNotes.clear();

    this.#output = null as unknown as GainNode;
    this.#context = null as unknown as AudioContext;
  }

  /** SETTERS */
  set volume(value: number) {
    const scaleFactor = 0.9;
    this.#output.gain.setValueAtTime(
      value * scaleFactor,
      this.#context.currentTime + 0.0001
    );
  }

  set attackTime(timeMs: number) {
    this.#attackTime = timeMs * 1000;
  }

  set releaseTime(timeMs: number) {
    this.#releaseTime = timeMs * 1000;
  }

  /** GETTERS */
  get now() {
    return getAudioContext().currentTime;
  }

  get volume(): number {
    return this.#output.gain.value;
  }

  get isPlaying(): boolean {
    return this.#activeNotes.size > 0;
  }

  get activeVoices(): number {
    return Array.from(this.#activeNotes.values()).reduce(
      (sum, voices) => sum + voices.size,
      0
    );
  }

  get maxVoices(): number {
    return this.#voicePool.nodes.length;
  }
}
