import SourceProcessorRaw from './source-processor?raw';

import { createNodeId } from '@/store/IdStore';
import {
  BaseWorkletNode,
  // createAndRegisterWorklet, // Todo: afflækja!
} from '@/abstract/nodes/baseClasses/BaseWorkletNode';
import { AudiolibProcessor, registry } from '@/processors/ProcessorRegistry';
import { getAudioContext } from '@/context'; // use SourceWorkletNode.createAsync to ensure ensureAudioCtx is called if having issues

function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// todo: move to utils and check for accuracy
// function frequencyToMidiNote(frequency: number): number {
//   return Math.round(69 + 12 * Math.log2(frequency / 440));
// }

export const DEFAULT_SOURCE_PROPS = {
  nrInputs: 0,
  nrOutputs: 1,
  playbackRate: 1,
  loop: false,
  startTime: 0,
  loopStart: 0,
};

export async function createSourceNode(
  props: AudioWorkletNodeOptions | TODO = {
    audioContext: getAudioContext(),
    processorName: 'source-processor', // default
    workletOptions: {}, // audioworkletnodeoptions
    sampleId: null,
    audioData: null,
    nrInputs: 0,
    nrOutputs: 1,
    channelCount: 2,
  }
): Promise<SourceWorkletNode> {
  if (!registry.hasRegistered(props.processorName)) {
    await registry.register({
      processorName: props.processorName,
      rawSource: SourceProcessorRaw,
    });
  }
  return new SourceWorkletNode(props); // ({props}) ?? ({...props})
}

class SourceWorkletNode extends BaseWorkletNode {
  static readonly defaultProcessor: AudiolibProcessor = 'source-processor';
  static readonly sourceProcessorRaw: string = SourceProcessorRaw;
  static readonly nodeType: string = 'DefaultSourceNode';

  readonly nodeId: NodeID;
  readonly processorName: AudiolibProcessor = 'source-processor';

  #context: BaseAudioContext;
  #currentSampleId: string | null;
  #startCalled: boolean;
  #stopTime: number | null;

  playbackRate: AudioParam;
  loopStart: AudioParam;
  loopEnd: AudioParam;
  loop: AudioParam;

  constructor(
    props: AudioWorkletNodeOptions | TODO = {
      audioContext: getAudioContext(),
      processorName: 'source-processor', // default
      workletOptions: {}, // audioworkletnodeoptions
      sampleId: null,
      audioData: null,
      nrInputs: 0,
      nrOutputs: 1,
      channelCount: 2,
    }
  ) {
    super({
      audioContext: props.context,
      processorName: props.processorName || SourceWorkletNode.defaultProcessor,
      workletOptions: props.workletOptions, // todo: check the diff with processorOptions (workletOptions must be compatible with AuWkltNode constructor)
      numberOfInputs: props.nrInputs,
      numberOfOutputs: props.nrOutputs,
      outputChannelCount: [props.channelCount || 2], // check
      processorOptions: {
        buffer: props.audioData || null, // bufferToFloat32Arrays(options.buffer) || null, // remove options.buffer
        sampleRate: props.context.sampleRate,
      },
    });

    // TESTING REMOVE
    console.warn('RAW code string: ', SourceWorkletNode.sourceProcessorRaw);

    this.nodeId = createNodeId();
    this.#currentSampleId = props.id || null; // only set id if buffer is set (via onmessage?)
    console.log(this.#currentSampleId);

    this.#context = props.context;
    this.#startCalled = false;
    this.#stopTime = null;

    // Store references to AudioParams for convenient access
    this.playbackRate = this.paramMap.get('playbackRate')!;
    this.loopStart = this.paramMap.get('loopStart')!;
    this.loopEnd = this.paramMap.get('loopEnd')!;
    this.loop = this.paramMap.get('loop')!;

    // Add event handling for processor notifications
    this.port.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'ended') {
        this.#onEnded();
      }
    };
    this.port.start();
    this.port.postMessage({
      type: 'init',
      sampleRate: this.#context.sampleRate,
      id: this.nodeId,
    });

    if (props.audioData && props.id) {
      this.buffer = {
        id: props.id,
        audioData: props.audioData, // validate
      };
    } else if (!(props.audioData && props.id)) {
      console.warn(
        'Audio data and ID must be provided together. Buffer not set.'
      );
    }
  }

  get isAvailable() {
    // todo: decide multiplay or not - just temp oneshot for now
    return this.#currentSampleId && !this.#startCalled; // this.#startCalled && this.#stopTime === null;
  }

  // Buffer accessor // todo: pass in relevant sample data/options (check AppSample type)
  set buffer(options: { id: string; audioData: Float32Array[] | AudioBuffer }) {
    let data: Float32Array[] = [];
    if (options.audioData instanceof AudioBuffer) {
      data = bufferToFloat32Arrays(options.audioData);
    } else if (Array.isArray(options.audioData)) {
      data = options.audioData;
    }
    this.port.postMessage({
      type: 'setBuffer',
      buffer: data,
      sampleRate: this.#context.sampleRate,
    });

    this.#currentSampleId = options.id; // decide sample or buffer id system
  }

  get isPlaying(): boolean {
    return this.#startCalled && this.#stopTime === null;
  }

  playNote(
    midiNote: number,
    velocity: number = 1.0,
    startTime?: number
  ): SourceWorkletNode {
    const time = startTime ?? this.#context.currentTime;
    const frequency = midiNoteToFrequency(midiNote);

    const baseFrequency = 440; // A4
    const playbackRatio = frequency / baseFrequency;

    this.playbackRate.setValueAtTime(playbackRatio, time);

    this.port.postMessage({
      type: 'noteOn',
      midiNote: midiNote,
      velocity: velocity,
      time: time,
    });

    if (!this.#startCalled) {
      this.start(time);
    }

    return this;
  }

  start(when = 0, offset = 0, duration?: number): SourceWorkletNode {
    if (this.#startCalled) {
      throw new Error('Start method already called');
    }

    this.#startCalled = true;
    const startTime = Math.max(this.#context.currentTime, when);

    this.port.postMessage({
      type: 'start',
      time: startTime,
      offset: offset,
      duration: duration,
    });

    return this;
  }

  stop(when = 0): SourceWorkletNode {
    if (!this.#startCalled) {
      throw new Error('Cannot call stop without calling start first');
    }

    if (this.#stopTime !== null) {
      throw new Error('Stop method already called');
    }

    this.#stopTime = Math.max(this.#context.currentTime, when);

    this.port.postMessage({
      type: 'stop',
      time: this.#stopTime,
    });

    return this;
  }

  #onEnded(): void {
    const event = new Event('ended');
    this.dispatchEvent(event);
  }

  dispose(): void {
    console.log(`Disposing node with ID: ${this.nodeId}`);
    // todo: optimize for performance
    this.stop();
    this.port.close();
    this.disconnect();
    this.#startCalled = false;
    this.#stopTime = null;

    // this.#context = null as unknown; // Clear context reference // unecessary? (needs to be nullable i think)
    // this.#onEnded = null as any; // Clear event handler reference
  }
}

// Helper function to convert AudioBuffer to transferable arrays
function bufferToFloat32Arrays(audioBuffer: AudioBuffer): Float32Array[] {
  const arrays: Float32Array[] = [];
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    arrays.push(audioBuffer.getChannelData(i));
  }
  return arrays;
}

export { SourceWorkletNode };
