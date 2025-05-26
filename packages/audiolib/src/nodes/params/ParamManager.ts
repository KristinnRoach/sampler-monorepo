import { LibParam, ParamDescriptor } from './types';
import { Debouncer } from '@/utils/Debouncer';
import { createNodeId } from '@/nodes/node-store';

export class ParamManager {
  private params = new Map<string, LibParam>();
  private debouncer = new Debouncer();

  /**
   * Creates a LibParam wrapper for an AudioParam
   */
  wrapAudioParam(
    audioParam: AudioParam,
    descriptor: ParamDescriptor
  ): LibParam {
    const nodeId = createNodeId('param');

    // Add existing AudioParam properties to descriptor when possible
    const descrWithAudioParamValues = {
      ...descriptor,
      defaultValue: descriptor.defaultValue ?? audioParam.defaultValue,
      minValue: descriptor.minValue ?? audioParam.minValue,
      maxValue: descriptor.maxValue ?? audioParam.maxValue,
      automationRate: descriptor.automationRate ?? audioParam.automationRate,
    };

    const libParam: LibParam = {
      nodeId,
      nodeType: 'param',
      descriptor: descrWithAudioParamValues,
      getValue: () => audioParam.value,
      setValue: (value: number) => {
        audioParam.setValueAtTime(value, 0); // todo: check if "0" is cool
      },
      onMessage: () => () => {}, // No-op implementation
      dispose: () => {},
    };

    return libParam;
  }

  /**
   * Registers a parameter which can be either a LibParam or an AudioParam
   */
  register(param: LibParam | AudioParam, descriptor?: ParamDescriptor): void {
    if (param instanceof AudioParam) {
      if (!descriptor) {
        throw new Error('Descriptor required when registering AudioParam');
      }

      const wrappedParam = this.wrapAudioParam(param, descriptor);
      this.params.set(descriptor.id, wrappedParam);
    } else {
      // It's already a LibParam
      this.params.set(param.descriptor.id, param);
    }
  }

  getAll(): LibParam[] {
    return Array.from(this.params.values());
  }

  getByGroup(group: string): LibParam[] {
    return this.getAll().filter((p) => p.descriptor.group === group);
  }

  get(paramId: string): LibParam | undefined {
    return this.params.get(paramId);
  }

  setValue(paramId: string, value: any, debounceMs: number = 0): void {
    const param = this.params.get(paramId);
    if (!param) return;

    if (debounceMs <= 0) {
      param.setValue(value);
    } else {
      this.debouncer.debounce(
        paramId,
        (val: any) => param.setValue(val),
        debounceMs
      )(value);
    }
  }
}
