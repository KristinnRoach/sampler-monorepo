import { AudioParamDescriptor } from '../types';
import { WorkletManager } from './WorkletManager';
import { WorkletNode } from './WorkletNode';

export async function createWorkletNode(
  context: BaseAudioContext,
  manager: WorkletManager,
  processorName: string,
  processFunction: Function,
  params: AudioParamDescriptor[] = [],
  nodeOptions = {}
) {
  return WorkletNode.create(context, manager, {
    processorName,
    processFunction,
    params,
    nodeOptions,
  });
}
