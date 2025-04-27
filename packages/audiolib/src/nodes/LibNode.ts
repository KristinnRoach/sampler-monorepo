import { NodeID } from '@/store/state/IdStore';
import { Message, MessageHandler } from '@/events';

type BaseNodeType = 'player' | 'source' | 'container' | 'param' | 'fx';

export interface LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: string;
  readonly now: number;

  onMessage(type: string, handler: MessageHandler<Message>): () => void;

  connect(
    destination: AudioNode | null,
    outputIndex?: number,
    inputIndex?: number
  ): this | AudioNode | AudioParam;
  disconnect(destination?: AudioNode | null): void;
  dispose(): void;
}

export interface LibSourceNode extends LibNode {
  readonly processorNames: string[];
  readonly paramMap: Map<string, AudioParam>;

  getParam(name: string): AudioParam | null;
  setParam(name: string, value: number, options: any): this;

  trigger(options: any): this;
  release(options?: any): this;
  stop(): this;
  sendToProcessor(data: any): void;
}

export interface LibInstrument extends LibNode {
  play(midiNote: number, modifiers: TODO, velocity?: number): this;
  release(midiNote?: number, modifiers?: TODO): this;
  releaseAll(): this;

  setParamValue(name: string, value: number): this;
  getParamValue(name: string): number | null;

  onGlobalLoopToggle(modifers?: TODO): this;
}
