import { LibInstrument, KarplusNode } from '@/nodes';
import { Pool } from '@/nodes/helpers/Pool';
import { createNodeId } from '@/store/state/IdStore';
import { getAudioContext } from '@/context';
import { Message, MessageHandler, createMessageBus } from '@/events';

export class KarplusStrongSynth implements LibInstrument {
  readonly nodeId: string;
  readonly nodeType: string = 'karplus-strong-synth';

  #context: AudioContext;
  #output: GainNode;
  #voicePool: Pool<KarplusNode>;
  #activeNotes: Map<number, string[]> = new Map(); // <midiNote, nodeId[]>
  #messages;

  #attackTime: number = 0;
  #releaseTime: number = 0.3;

  constructor(polyphony: number = 8) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = getAudioContext();
    this.#output = new GainNode(this.#context);
    this.#output.gain.value = 0.9;
    this.#voicePool = new Pool(polyphony, 'karplus-strong');
    this.#messages = createMessageBus<Message>(this.nodeId);

    // Pre-create voices
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
      this.#voicePool.addNode(voice);
    }
  }

  play(midiNote: number, velocity: number = 1): this {
    let voice = this.#voicePool.allocateNode(midiNote);
    if (!voice) return this;

    voice.trigger({ midiNote, velocity });

    //  release the voice after decay time
    // todo: use actual release time
    const releaseTime = 2; // 2 seconds decay time, adjust as needed

    return this;
  }

  release(midiNote: number): this {
    const nodeIds = this.#activeNotes.get(midiNote)?.slice() || [];

    nodeIds.forEach((nodeId) => {
      const voice = this.#voicePool.getNodeById(nodeId);
      if (voice) {
        voice.release(this.#releaseTime);
      }
    });

    // todo: make onended callback!
    setTimeout(() => {
      this.#activeNotes.delete(midiNote);
    }, this.#releaseTime * 1000);

    return this;
  }

  #addToActiveNotes(midiNote: number, nodeId: string): this {
    if (this.#activeNotes.has(midiNote)) {
      this.#activeNotes.get(midiNote)?.push(nodeId);
    } else {
      this.#activeNotes.set(midiNote, [nodeId]);
    }
    return this;
  }

  #removeFromActiveNotes(midiNote: number, nodeId: string): this {
    const nodeIds = this.#activeNotes.get(midiNote);
    if (nodeIds) {
      const remaining = nodeIds.filter((id) => id !== nodeId);
      if (remaining.length > 0) {
        this.#activeNotes.set(midiNote, remaining);
      } else {
        this.#activeNotes.delete(midiNote);
      }
    }
    return this;
  }

  stopAll(): this {
    Array.from(this.#activeNotes.keys()).forEach((midiNote) => {
      this.release(midiNote);
    });
    this.#activeNotes.clear();
    return this;
  }

  // triggerAttack(midiNote: number, velocity: number = 1): this {
  //   return this.play(midiNote, velocity);
  // }

  // triggerRelease(midiNote: number): this {
  //   return this.release(midiNote);
  // }

  // triggerAttackRelease(
  //   midiNote: number,
  //   duration: number,
  //   velocity: number = 1
  // ): this {
  //   this.play(midiNote, velocity);
  //   setTimeout(() => this.release(midiNote), duration * 1000);
  //   return this;
  // }

  releaseAll(): this {
    return this.stopAll();
  }

  setParamValue(name: string, value: number): this {
    // Apply parameter to all active voices
    this.#voicePool.nodes.forEach((voice) => {
      const param = voice.getParam(name);
      if (param) {
        param.setValueAtTime(value, this.#context.currentTime);
      }
    });
    return this;
  }

  getParamValue(name: string): number | null {
    // Get parameter from first voice (all voices should have same values)
    const firstVoice = this.#voicePool.nodes[0];
    if (firstVoice) {
      const param = firstVoice.getParam(name);
      return param ? param.value : null;
    }
    return null;
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

    // Dispose all voices
    this.#voicePool.nodes.forEach((voice) => voice.dispose());
    this.#voicePool.dispose();

    // Clear maps and references
    this.#activeNotes.clear();
    this.#output = null as unknown as GainNode;
    this.#context = null as unknown as AudioContext;
  }

  addListener(event: string, listener: Function): this {
    // Implement event handling if needed
    return this;
  }

  removeListener(event: string, listener: Function): this {
    // Implement event handling if needed
    return this;
  }

  /** SETTERS */

  set volume(value: number) {
    // range 0 - 1
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

  get volume(): number {
    return this.#output.gain.value;
  }

  get isPlaying(): boolean {
    return this.#activeNotes.size > 0;
  }

  get activeVoices(): number {
    return Array.from(this.#activeNotes.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
  }

  get maxVoices(): number {
    return this.#voicePool.nodes.length;
  }
}
