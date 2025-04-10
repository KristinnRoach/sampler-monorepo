import { SourceNode } from './SourceWorkletProTs';

export class VoiceCustomSource {
  #context: BaseAudioContext;
  #sourceNode: SourceNode;
  #outputNode: GainNode;

  constructor(context: BaseAudioContext, buffer: AudioBuffer) {
    this.#context = context;
    this.#sourceNode = new SourceNode(context, buffer);
    this.#outputNode = context.createGain();
    this.#outputNode.gain.setValueAtTime(0, this.now());
  }

  get output(): GainNode {
    return this.#outputNode;
  }

  get source(): SourceNode {
    return this.#sourceNode;
  }

  now(): number {
    return this.#context.currentTime;
  }
}
