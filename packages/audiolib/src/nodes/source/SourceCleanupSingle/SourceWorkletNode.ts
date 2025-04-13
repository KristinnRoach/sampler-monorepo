import SourceProcessorRaw from './source-processor?raw';

import { NodeID } from '@/types/global';
import { createNodeId } from '@/store/IdStore';
// import { BaseWorkletNode } from '@/abstract/nodes/baseClasses/BaseWorkletNode';
import { AudiolibProcessor } from '@/processors/ProcessorRegistry';
import { ensureAudioCtx } from '@/context';

function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

class SourceWorkletNode extends AudioWorkletNode {
  // extends BaseWorkletNode {

  readonly nodeId: NodeID;
  readonly processorName: AudiolibProcessor = 'source-processor';

  #startCalled: boolean;
  #stopTime: number | null;
  #context: BaseAudioContext;

  playbackRate: AudioParam;
  loopStart: AudioParam;
  loopEnd: AudioParam;
  loop: AudioParam;

  constructor(context: BaseAudioContext, options: any = {}) {
    super(context, 'source-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [options.channelCount || 2],
      processorOptions: {
        buffer: options.buffer ? bufferToFloat32Arrays(options.buffer) : null,
        sampleRate: context.sampleRate,
      },
    });

    this.nodeId = createNodeId();
    this.#context = context;
    this.#startCalled = false;
    this.#stopTime = null;

    // Store references to AudioParams for convenient access
    this.playbackRate = (this.parameters as any).get('playbackRate')!;
    this.loopStart = (this.parameters as any).get('loopStart')!;
    this.loopEnd = (this.parameters as any).get('loopEnd')!;
    this.loop = (this.parameters as any).get('loop')!;

    if (options.buffer) {
      this.buffer = options.buffer;
    }

    // Add event handling for processor notifications
    this.port.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'ended') {
        this.#onEnded();
      }
    };
  }

  // Buffer accessor
  set buffer(newBuffer: AudioBuffer) {
    if (newBuffer) {
      const bufferData = bufferToFloat32Arrays(newBuffer);
      this.port.postMessage({
        type: 'setBuffer',
        buffer: bufferData,
        sampleRate: this.#context.sampleRate,
      });
    }
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
    this.#context = null as any; // Clear context reference
    this.#startCalled = false;
    this.#stopTime = null;
    this.buffer = null as any; // Clear buffer reference
    this.playbackRate = null as any; // Clear playbackRate reference
    this.loopStart = null as any; // Clear loopStart reference
    this.loopEnd = null as any; // Clear loopEnd reference
    this.loop = null as any; // Clear loop reference
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
