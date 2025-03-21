import { AudioParamDescriptor } from '../types';
import { WorkletNode } from './WorkletNode';

export async function createWorkletNode(
  context: BaseAudioContext,
  processorName: string,
  processFunction: Function,
  params: AudioParamDescriptor[] = [],
  nodeOptions = {}
) {
  return WorkletNode.create(context, {
    processorName,
    processFunction,
    params,
    nodeOptions,
  });
}

// For convenience when importing (only from one file)
// todo: make WorkletNode private to this package to avoid duplicate exports?
export { WorkletNode } from './WorkletNode';
