import { LibParam } from './types';
import { Debouncer } from '@/utils/Debouncer';

export class ParamManager {
  private params = new Map<string, LibParam>();
  private debouncer = new Debouncer();

  register(param: LibParam): void {
    this.params.set(param.descriptor.id, param);
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
      // todo: prettify
      this.debouncer.debounce(
        paramId,
        (val: any) => param.setValue(val),
        debounceMs
      )(value);
    }
  }
}
