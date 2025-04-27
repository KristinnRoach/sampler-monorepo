import { LibNode } from '@/nodes/LibNode';
import { NodeID, createNodeId, deleteNodeId } from '@/store/state/IdStore';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { getAudioContext } from '@/context';
import {
  createMediaRecorder,
  startRecording,
  stopRecording,
  blobToAudioBuffer,
} from '@/utils/record';
import { getMicrophone } from '@/utils/devices';

export class RecorderNode implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: string = 'recorder';

  #context: AudioContext;
  #stream: MediaStream | null = null;
  #recorder: MediaRecorder | null = null;
  #messages;
  #isRecording: boolean = false;

  constructor(context: AudioContext = getAudioContext()) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;
    this.#messages = createMessageBus<Message>(this.nodeId);
  }

  async init(): Promise<this> {
    const micStream = await getMicrophone();
    if ('type' in micStream) {
      throw new Error(`Failed to get microphone: ${micStream.message}`);
    }

    this.#stream = micStream;
    this.#recorder = await createMediaRecorder(micStream);
    return this;
  }

  async start(): Promise<void> {
    if (!this.#recorder) throw new Error('Recorder not initialized');
    if (this.#isRecording) return;

    startRecording(this.#recorder);
    this.#isRecording = true;
    this.sendMessage('record:start', {});
  }

  async stop(): Promise<AudioBuffer> {
    if (!this.#recorder) throw new Error('Recorder not initialized');
    if (!this.#isRecording) throw new Error('Not recording');

    const blob = await stopRecording(this.#recorder);
    const buffer = await blobToAudioBuffer(blob, this.#context);

    this.#isRecording = false;
    this.sendMessage('record:stop', { duration: buffer.duration });

    return buffer;
  }

  // LibNode interface implementation
  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
  }

  connect(): this {
    return this; // No-op as this is input-only
  }

  disconnect(): void {} // No-op as this is input-only

  dispose(): void {
    this.#stream?.getTracks().forEach((track) => track.stop());
    this.#stream = null;
    this.#recorder = null;
    deleteNodeId(this.nodeId);
  }

  get now(): number {
    return this.#context.currentTime;
  }

  get isRecording(): boolean {
    return this.#isRecording;
  }
}
