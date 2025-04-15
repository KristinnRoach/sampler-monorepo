import SourceProcessorRaw from '@/processors/source/source-processor?raw';
import { createNodeId } from '@/store/IdStore';

import { AudiolibProcessor, registry } from '@/processors/ProcessorRegistry';
import { ensureAudioCtx, getAudioContext } from '@/context';

function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// todo: move to utils and check for accuracy
// function frequencyToMidiNote(frequency: number): number {
//   return Math.round(69 + 12 * Math.log2(frequency / 440));
// }

class SourceWorkletNode extends AudioWorkletNode {
  static readonly defaultProcessor: AudiolibProcessor = 'source-processor';
  static readonly sourceProcessorRaw: string = SourceProcessorRaw;
  static readonly nodeType: string = 'DefaultSourceNode';

  readonly nodeId: NodeID;
  readonly processorName: AudiolibProcessor = 'source-processor';

  #context: AudioContext = getAudioContext(); // !BASE? nope
  #startCalled: boolean;
  #stopTime: number | null;

  paramMap: Map<string, AudioParam>; // Workaround for TypeScript issue with AudioParamMap

  playbackRate: AudioParam;
  loopStart: AudioParam;
  loopEnd: AudioParam;
  loop: AudioParam;

  constructor(
    context: AudioContext,
    name: string = SourceWorkletNode.defaultProcessor,
    options: {
      audioData: TODO; // Float32Array[]; // ? [][] - channels 2D ?
      sampleRate?: number;
    }
  ) {
    super(context, name, {
      processorOptions: {
        audioData: options.audioData,
        sampleRate: options.sampleRate,
      },
    });

    if (!options) console.debug('new SourceWorkletNode() -> No OPTIONS !!');
    if (!!options) console.debug('new SourceWorkletNode() -> YEES OPTIONS !!');

    const audio = options.audioData; // ? saving for later maybe
    if (!audio) console.debug('new SourceWorkletNode() -> No audioData !!');
    if (!!audio) console.debug('new SourceWorkletNode() -> YES audioData !!');

    const ctx = context || getAudioContext();
    console.debug('ctx state: ', ctx.state);

    let sr = options.sampleRate;
    let floatArray: Float32Array[] = [];

    if (audio instanceof AudioBuffer) {
      sr = sr ? sr : audio.sampleRate; // use audiobuffer samplerate
      floatArray = bufferToFloat32Arrays(audio);
    } else if (Array.isArray(audio)) {
      floatArray = audio; // should already be Float32 arrays (test: 1d, 2d)
      sr = sr ? sr : ctx.sampleRate; // use audiocontext samplerate
    }

    this.nodeId = createNodeId();
    this.#context = context;

    this.#startCalled = false;
    this.#stopTime = null;
    this.paramMap = this.parameters as Map<string, AudioParam>; //

    // Store references to AudioParams for convenient access
    this.playbackRate = this.paramMap.get('playbackRate')!;
    this.loopStart = this.paramMap.get('loopStart')!;
    this.loopEnd = this.paramMap.get('loopEnd')!;
    this.loop = this.paramMap.get('loop')!;

    // Add event handlers for incoming msg
    this.port.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'ended') {
        this.#onEnded();
      }
    };
    this.port.start(); // setActive, var það eitthvað?

    if (audio) {
      // ! first trying processor constructor, super()
      this.setBuffer(
        // ? if reliable in super henda þessu
        audio // validate
        // sampleId,
      );
    } else {
      console.warn(
        'No audio data provided in worklet constructor. Call setBuffer.'
      );
    }
  }

  get isAvailable() {
    // todo: decide multiplay or not - just temp oneshot for now
    return !this.#startCalled; // this.#buffer && !this.#startCalled; stopTime ! null
  }

  // todo: optimize and use AppSample type
  // ! first test this in processor constructor
  setBuffer(
    audioData: Float32Array[] | AudioBuffer,
    id?: string,
    sampleRate?: number // automatically uses audiobuffers rate if available
  ) {
    console.error(
      `Why you give me id? i no use it! (sourceworklet.setBuffer()), id: ${id}`
    );

    let floatArray: Float32Array[] = [];
    let sr = sampleRate ? sampleRate : this.#context.sampleRate;
    if (audioData instanceof AudioBuffer) {
      // use buffers rate if audiobuffer
      sr = sampleRate ? sampleRate : audioData.sampleRate;
      floatArray = bufferToFloat32Arrays(audioData);
    } else if (Array.isArray(audioData)) {
      floatArray = audioData;
    }

    console.warn({ floatArray });
    console.warn({ sr });

    this.port.postMessage({
      type: 'setBuffer',
      buffer: floatArray,
      sampleRate: sr ?? '48000',
    });
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

  stop(when = 0): void {
    if (!this.#startCalled || this.#stopTime) return;

    this.#stopTime = Math.max(this.#context.currentTime, when);

    this.port.postMessage({
      type: 'stop',
      time: this.#stopTime,
    });

    return;
  }

  #onEnded(): void {
    const event = new Event('ended');
    this.dispatchEvent(event);
  }

  dispose(): void {
    // todo: optimize for performance
    this.stop();
    this.disconnect();
    this.port.close();
    this.#startCalled = false;
    this.#stopTime = null;
    // (this.#context as unknown as null) = null; // Clear context reference // unecessary? (needs to be nullable i think)
    // (this.#onEnded as unknown as null) = null; // Clear event handler reference
  }
}

export { SourceWorkletNode };

// ! Move to utils
//function validateAudioBuffer(buffer: AudioBuffer){}

// Helper function to convert AudioBuffer to transferable arrays
function bufferToFloat32Arrays(audioBuffer: AudioBuffer): Float32Array[] {
  // Validate the buffer
  if (!audioBuffer || audioBuffer.length === 0) {
    console.error('Invalid or empty AudioBuffer');
    return [];
  }

  // Check if buffer has any non-zero content
  const firstChannel = audioBuffer.getChannelData(0);
  const hasSound = firstChannel.some((sample) => sample !== 0);
  if (!hasSound) {
    console.warn('AudioBuffer appears to be silent - all samples are zero');
  }

  const arrays: Float32Array[] = [];
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    const channelData = audioBuffer.getChannelData(i);
    arrays.push(channelData);
  }
  console.warn(`COMMONNN - audio to float arr: ${arrays}`); // !!! ATH !!! why iz all zeroes! ? ! ? ! ? ! ? // todo: fix :)

  console.warn('Audio Buffer stats:', {
    numberOfChannels: audioBuffer.numberOfChannels,
    length: audioBuffer.length,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
  });

  // Check actual content of first few samples
  const channel0 = audioBuffer.getChannelData(0);
  console.warn(
    'First 10 samples:',
    Array.from(channel0.slice(0, 10)),
    'Max value:',
    Math.max(...Array.from(channel0)),
    'Non-zero:',
    channel0.some((val) => val !== 0)
  );
  return arrays;
}

// export async function createSourceNode(
//   props: TODO = {
//     context: getAudioContext(),
//     processorName: 'source-processor',
//     workletOptions: {}, // AudioWorkletNodeOptions
//     sampleId: null,
//     audioData: null,
//     nrInputs: 0,
//     nrOutputs: 1,
//     channelCount: 2,
//   }
// ): Promise<SourceWorkletNode> {
//   const ctx = await ensureAudioCtx(); // debugging
//   props.context = ctx;
//   if (!registry.hasRegistered(props.processorName)) {
//     console.warn(
//       `Processor ${props.processorName} not registered, registering now...`
//     );
//     await registry.register({
//       processorName: props.processorName,
//       rawSource: SourceProcessorRaw,
//     });

//     console.warn(
//       `context ${ctx} - processor ${props.processorName} registered`
//     );
//   }
//   return new SourceWorkletNode({ ...props }); // ({props}) ?? ({...props})
// }
