// import { getBlobURL } from '@/processors/registry-utils';
import { registry, VerifiedProcessor } from '@/processors/ProcessorRegistry';

// TODO: This could be the generic AudioWorkletNode factory
async function createLoopControllerNode(
  audioContext: BaseAudioContext, // | AudioContext | OfflineAudioContext,
  processorName: VerifiedProcessor = 'loop-control-processor'
) {
  // await audioContext.audioWorklet.addModule(objectUrl);
  // Check if the processor is already registered
  if (!registry.hasRegistered(processorName)) {
    await registry.register(processorName);
  }
  return new AudioWorkletNode(audioContext, processorName);
}

export { createLoopControllerNode };
