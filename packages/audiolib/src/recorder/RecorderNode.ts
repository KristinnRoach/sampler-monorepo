import { LibNode } from '@/nodes/LibNode';
import { NodeID, createNodeId, deleteNodeId } from '@/store/state/IdStore';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { getAudioContext } from '@/context';
import {
  createMediaRecorder,
  startRecording,
  stopRecording,
  blobToAudioBuffer,
} from './record-utils';
import { getMicrophone } from '@/utils/devices/devices';

interface LoadSampleCapable {
  loadSample(buffer: AudioBuffer): Promise<boolean> | Promise<void>;
}

interface MicrophoneError {
  type: 'error';
  message: string;
}

type MicrophoneResult = MediaStream | MicrophoneError;

export class RecorderNode implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: string = 'recorder';

  #context: AudioContext;
  #stream: MediaStream | null = null;
  #recorder: MediaRecorder | null = null;
  #messages;
  #isRecording: boolean = false;
  #destination: (LibNode & LoadSampleCapable) | null = null;

  constructor(context: AudioContext = getAudioContext()) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;
    this.#messages = createMessageBus<Message>(this.nodeId);
  }

  async init(): Promise<RecorderNode> {
    try {
      this.#stream = await getMicrophone();
      this.#recorder = await createMediaRecorder(this.#stream);
      return this;
    } catch (error) {
      throw new Error(`Failed to get microphone: ${error}`);
    }
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

    // Type checking no longer needed since destination is guaranteed to have loadSample
    if (this.#destination) {
      await this.#destination.loadSample(buffer);
    }

    return buffer;
  }

  // LibNode interface implementation
  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
  }

  connect(destination: LibNode & LoadSampleCapable): this {
    if (destination) {
      this.#destination = destination;
    }
    return this;
  }

  disconnect(): void {
    this.#destination = null;
  }

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
