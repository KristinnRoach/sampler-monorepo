// https://github.com/microsoft/TypeScript/issues/28308#issuecomment-650802278

/**  testing usage in worklet files via:
 *    // @ts-check
 *   /// <reference types="../../types/worklet" />// only relative path works
 *   if doesnt work, try:
 *   //// <reference types="npm:@types/audioworklet" />
 **/

declare class AudioWorkletProcessor {
  constructor(options?: AudioWorkletNodeOptions);
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: typeof AudioWorkletProcessor
): void;

interface AudioWorkletNodeOptions {
  processorOptions?: any;
}

// declare let currentTime: number;

interface ProcessorDefinition {
  processFunction: Function;
  processorParams?: AudioParamDescriptor[];
  processorOptions?: Record<string, unknown>;
}

// interface AudioWorkletProcessor {
//   readonly port: MessagePort;
//   process(
//     inputs: Float32Array[][],
//     outputs: Float32Array[][],
//     parameters: Record<string, Float32Array>
//   ): boolean;
// }

// declare var AudioWorkletProcessor: {
//   prototype: AudioWorkletProcessor;
//   new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
// };

interface AudioWorkletProcessorConstructor {
  new (options?: AudioWorkletNodeOptions): AudioWorkletProcessorImpl;
  parameterDescriptors?: AudioParamDescriptor[];
}

declare function registerProcessor(
  name: string,
  processorCtor: AudioWorkletProcessorConstructor
): void;

interface AudioParamDescriptor {
  name: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  automationRate: 'a-rate' | 'k-rate';
}

/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioWorkletGlobalScope/currentFrame) */
declare var currentFrame: number;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioWorkletGlobalScope/currentTime) */
declare var currentTime: number;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioWorkletGlobalScope/sampleRate) */
declare var sampleRate: number;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioWorkletGlobalScope/registerProcessor) */
