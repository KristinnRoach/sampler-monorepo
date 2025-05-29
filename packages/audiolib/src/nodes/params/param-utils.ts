import { ParamDescriptor } from './types';

/**
 * Converts a ParamDescriptor to a standard AudioParamDescriptor
 * for use with AudioWorkletProcessor parameter definitions
 */
export function toAudioParamDescriptor(
  param: ParamDescriptor
): AudioParamDescriptor {
  return {
    name: param.name,
    defaultValue:
      typeof param.defaultValue === 'number' ? param.defaultValue : 0,
    minValue: param.minValue,
    maxValue: param.maxValue,
    automationRate: param.automationRate || 'k-rate',
  };
}

/**
 * Creates a ParamDescriptor from an AudioParamDescriptor with additional metadata
 */
export function fromAudioParamDescriptor(
  audioParam: AudioParamDescriptor,
  options: {
    id: string;
    type?: 'number' | 'boolean' | 'enum';
    group?: string;
    step?: number;
  }
): ParamDescriptor {
  return {
    nodeId: options.id,
    name: audioParam.name,
    type: options.type || 'number',
    defaultValue: audioParam.defaultValue ?? 0,
    minValue: audioParam.minValue,
    maxValue: audioParam.maxValue,
    automationRate: audioParam.automationRate,
    group: options.group,
    step: options.step,
  };
}

// TODO: check whether the example below should be applied to worklet nodes
// // Example usage in an AudioWorkletNode wrapper
// import { toAudioParamDescriptor } from '@/nodes/params/param-utils';
// import { ParamDescriptor } from '@/nodes/params/types';

// // In your code that registers worklet parameters
// const myParams: ParamDescriptor[] = [
//   {
//     id: 'gain',
//     name: 'gain',
//     type: 'number',
//     defaultValue: 1.0,
//     minValue: 0,
//     maxValue: 2,
//     automationRate: 'a-rate'
//   },
//   // ...more params
// ];

// // Convert to AudioParamDescriptor for worklet registration
// const workletParams = myParams.map(toAudioParamDescriptor);
