// voiceWorkletFactory.ts

import {
  generateWorkletNode,
  BaseWorkletNode,
} from '@/base/classes/BaseWorkletNode';
import { AudioParamDescriptor } from '@/types/types';

/* basic template for a bypass processor. */

// Process function that will be converted to string and run in audio thread
function voiceProcessFunction(
  inputs: Float32Array[][],
  outputs: Float32Array[][],
  _parameters: Record<string, Float32Array>
): boolean {
  const input = inputs[0];
  const output = outputs[0];

  // If we have input data, copy it to output
  if (input && input.length > 0) {
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      // Copy samples directly (pass-through)
      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = inputChannel[i];
      }
    }
  }

  // Return true to keep the processor alive
  return true;
}

export async function createVoiceWorklet(
  context: BaseAudioContext,
  processorName: string,
  params: AudioParamDescriptor[] = [],
  nodeOptions: AudioWorkletNodeOptions = {}
): Promise<BaseWorkletNode> {
  return generateWorkletNode(
    context,
    processorName,
    voiceProcessFunction,
    params,
    nodeOptions
  );
}

// usage: const processorName = 'voice-processor';
// const processorOptions = {
//   // Instead of passing the buffer, pass its properties
//   sampleRate: this.#buffer.sampleRate,
//   length: this.#buffer.length,
//   duration: this.#buffer.duration,
//   numberOfChannels: this.#buffer.numberOfChannels,
//   rootNote: this.#rootNote,
// };

// const voiceWorkletNode = await createVoiceWorklet(
//   this.#context,
//   processorName,
//   [],
//   {
//     processorOptions,
//   }
// );
