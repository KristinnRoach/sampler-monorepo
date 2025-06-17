import { LibNode, SampleLoader } from '@/nodes/LibNode';
import { NodeID, createNodeId, deleteNodeId } from '@/nodes/node-store';
import { tryCatch, assert } from '@/utils';

import {
  Message,
  MessageBus,
  MessageHandler,
  createMessageBus,
} from '@/events';
import { getMicrophone } from '@/io/devices/devices';

export const AudioRecorderState = {
  IDLE: 'IDLE',
  ARMED: 'ARMED',
  RECORDING: 'RECORDING',
  STOPPED: 'STOPPED',
} as const;

export type AudioRecorderState =
  (typeof AudioRecorderState)[keyof typeof AudioRecorderState];

export const DEFAULT_MEDIA_REC_OPTIONS: MediaRecorderOptions = {
  mimeType: 'audio/webm',
};

export const DEFAULT_RECORDER_OPTIONS = {
  mediaRecorderOptions: DEFAULT_MEDIA_REC_OPTIONS,
  useThreshold: true,
  startThreshold: -30,
  autoStop: false,
  stopThreshold: -40, // todo: guard ensuring stopTreshold < startTreshold
  silenceTimeoutMs: 1000,
};

export type RecorderOptions = typeof DEFAULT_RECORDER_OPTIONS;

export class Recorder implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType = 'recorder';

  #context: AudioContext;
  #stream: MediaStream | null = null;
  #recorder: MediaRecorder | null = null;
  #messages: MessageBus<Message>;
  #destination: (LibNode & SampleLoader) | null = null;
  #state: AudioRecorderState = AudioRecorderState.IDLE;

  // Single audio monitoring setup
  #audioSource: MediaStreamAudioSourceNode | null = null;
  #analyser: AnalyserNode | null = null;
  #animationFrame: number | null = null;
  #silenceStartTime: number | null = null;
  #config: RecorderOptions | null = null;

  constructor(context: AudioContext) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;
    this.#messages = createMessageBus<Message>(this.nodeId);
  }

  async init(): Promise<Recorder> {
    try {
      console.warn(
        'Recorder: init() method is unnecessary and has been removed.'
      );

      return this;
    } catch (error) {
      throw new Error(`Failed to get microphone: ${error}`);
    }
  }

  async start(options?: Partial<RecorderOptions>): Promise<this> {
    const result = await tryCatch(() => getMicrophone());
    assert(!result.error, `Failed to get microphone: ${result.error}`, result);

    this.#stream = result.data;

    this.#config = { ...DEFAULT_RECORDER_OPTIONS, ...options };

    this.#recorder = new MediaRecorder(
      this.#stream,
      this.#config.mediaRecorderOptions
    );

    if (!this.#recorder) throw new Error('Recorder not initialized');
    if (this.#state === AudioRecorderState.RECORDING) return this;

    try {
      if (!this.#config.useThreshold) {
        this.#startRecordingImmediate();
      } else {
        this.#startArmedRecording();
      }
      return this;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  #startArmedRecording(): void {
    if (!this.#isValidThreshold(this.#config!.startThreshold)) {
      console.warn(
        `Threshold ${this.#config!.startThreshold}dB out of range (-60 to 0)`
      );
      return;
    }

    this.#state = AudioRecorderState.ARMED;
    console.info('Recorder state: ARMED');

    // ! record:armed doesnt seem to send a reliable message
    this.sendMessage('record:armed', {
      threshold: this.#config!.startThreshold,
      destination: this.#destination,
    });

    this.#setupAudioMonitoring();
  }

  #startRecordingImmediate(): void {
    this.#recorder!.start();
    this.#state = AudioRecorderState.RECORDING;
    console.info(`Recorder state: ${this.#state}`);

    this.sendMessage('record:start', { destination: this.#destination });

    if (this.#config!.autoStop) {
      this.#setupAudioMonitoring();
    }
  }

  // Single, unified audio monitoring method
  #setupAudioMonitoring(): void {
    this.#audioSource = this.#context.createMediaStreamSource(this.#stream!);
    this.#analyser = this.#context.createAnalyser();
    this.#analyser.fftSize = 1024;
    this.#audioSource.connect(this.#analyser);

    const dataArray = new Float32Array(this.#analyser.fftSize);

    const monitorAudio = () => {
      if (!this.#analyser) return; // Cleaned up

      this.#analyser.getFloatTimeDomainData(dataArray);
      const peak = Math.max(...dataArray.map(Math.abs));
      const peakDB = peak > 0.0000001 ? 20 * Math.log10(peak) : -100;

      if (this.#state === AudioRecorderState.ARMED) {
        this.#handleArmedState(peakDB);
      } else if (this.#state === AudioRecorderState.RECORDING) {
        this.#handleRecordingState(peakDB);
      } else {
        this.#cleanupMonitoring();
        return;
      }

      this.#animationFrame = requestAnimationFrame(monitorAudio);
    };

    this.#animationFrame = requestAnimationFrame(monitorAudio);
  }

  #handleArmedState(peakDB: number): void {
    if (peakDB >= this.#config!.startThreshold) {
      // Threshold reached - start recording
      this.#startRecordingImmediate();
    }
  }

  #handleRecordingState(peakDB: number): void {
    if (!this.#config!.autoStop) return;

    const now = performance.now();

    if (peakDB < this.#config!.stopThreshold) {
      // Below threshold - track silence
      if (this.#silenceStartTime === null) {
        this.#silenceStartTime = now;
      } else if (
        now - this.#silenceStartTime >=
        this.#config!.silenceTimeoutMs
      ) {
        // Silence timeout reached
        this.sendMessage('record:stopping', {});
        this.stop().catch((err) => console.error('Error auto-stopping:', err));
      }
    } else {
      // Above threshold - reset silence timer
      this.#silenceStartTime = null;
    }
  }

  #cleanupMonitoring(): void {
    if (this.#animationFrame !== null) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }

    if (this.#audioSource) {
      this.#audioSource.disconnect();
      this.#audioSource = null;
    }

    if (this.#analyser) {
      this.#analyser.disconnect();
      this.#analyser = null;
    }

    this.#silenceStartTime = null;
  }

  async stop(): Promise<AudioBuffer> {
    if (!this.#recorder) throw new Error('Recorder not initialized');

    // Handle armed state cancellation
    if (this.#state === AudioRecorderState.ARMED) {
      this.#cleanupMonitoring();

      this.#state = AudioRecorderState.STOPPED;
      console.info(`Recorder state: ${this.#state}`);

      this.sendMessage('record:cancelled', {});
      throw new Error('Recording was armed but never triggered');
    }

    if (this.#state !== AudioRecorderState.RECORDING) {
      throw new Error('Not recording');
    }

    this.#cleanupMonitoring();

    const blob = await this.#stopRecording();
    const buffer = await this.#blobToAudioBuffer(blob);

    if (this.#destination) {
      // Auto load sample
      await this.#destination.loadSample(buffer);
    }

    this.#state = AudioRecorderState.STOPPED;
    console.info(`Recorder state: ${this.#state}`);

    this.sendMessage('record:stop', { duration: buffer.duration });

    // Clean up - a new stream and recorder is created for each recording
    this.#stream?.getTracks().forEach((track) => track.stop());
    this.#stream = null;
    this.#recorder = null;

    return buffer;
  }

  #stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.#recorder?.state !== 'inactive') {
        this.#recorder?.addEventListener(
          'dataavailable',
          (e) => resolve(e.data),
          { once: true }
        );
        this.#recorder?.stop();
      }
    });
  }

  async #blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    return await this.#context.decodeAudioData(arrayBuffer);
  }

  #isValidThreshold(threshold: number): boolean {
    return threshold > -60 && threshold < 0;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
  }

  connect(destination: LibNode & SampleLoader): this {
    this.#destination = destination;
    return this;
  }

  disconnect(): void {
    this.#destination = null;
  }

  dispose(): void {
    this.#cleanupMonitoring();
    this.#stream?.getTracks().forEach((track) => track.stop());
    this.#stream = null;
    this.#recorder = null;
    this.#state = AudioRecorderState.IDLE;
    this.#config = null;
    deleteNodeId(this.nodeId);
  }

  // Getters
  get isArmed(): boolean {
    return this.#state === AudioRecorderState.ARMED;
  }

  get isRecording(): boolean {
    return this.#state === AudioRecorderState.RECORDING;
  }

  get state(): AudioRecorderState {
    return this.#state;
  }

  get isReady(): boolean {
    return this.#recorder !== null && this.#stream !== null;
  }

  get now(): number {
    return this.#context.currentTime;
  }

  get destination() {
    return this.#destination;
  }
}
