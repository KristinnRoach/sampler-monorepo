import { AudioParamDescriptor } from '../types';
import { WorkletNode } from './WorkletNode';
import { registry } from './worklet-registry';
import { getStandardizedAWPNames } from './worklet-utils';

export async function createWorkletNode(
  context: BaseAudioContext,
  processorName: string,
  processFunction?: Function,
  params: AudioParamDescriptor[] = [],
  nodeOptions = {}
) {
  // Register or get existing processor
  if (processFunction) {
    // registry.register is a no-op if already registered
    await registry.register(context, processorName, {
      processFunction,
      params,
    });
  } else {
    // todo: check if this works (should still register without processFunction, otherwise remove the else)
    await registry.register(context, processorName);
  }

  // Create and return node
  const { registryName, className } = getStandardizedAWPNames(processorName);
  return new WorkletNode(context, { className, registryName }, nodeOptions);
}

// For convenience when importing (only from one file)
// todo: make WorkletNode private to this package to avoid duplicate exports?
export { WorkletNode } from './WorkletNode';
