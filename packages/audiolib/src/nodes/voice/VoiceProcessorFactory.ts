import { createWorkletNode, WorkletNode } from '../worklet/workletFactory';
import { AudioParamDescriptor } from '../types';

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

export async function createVoiceProcessor(
  context: BaseAudioContext,
  processorName: string,
  params: AudioParamDescriptor[] = [],
  nodeOptions: AudioWorkletNodeOptions = {}
): Promise<WorkletNode> {
  return createWorkletNode(
    context,
    processorName,
    voiceProcessFunction,
    params,
    nodeOptions
  );
}
