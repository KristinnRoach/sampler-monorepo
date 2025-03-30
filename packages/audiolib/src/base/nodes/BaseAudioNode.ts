import BaseNode from '../interfaces/BaseNode';
import { DEFAULTS } from './SharedByBaseNodes';

// Base class that all nodes will extend from
// for convenience to avoid future code duplication
// currently only implements setParam

class BaseAudioNode extends GainNode implements BaseNode {
  constructor(context: BaseAudioContext, options?: AudioNodeOptions) {
    super(context, options);
  }

  setParam(name: string, value: number, time = 0): boolean {
    return DEFAULTS.METHODS.setParam(this, name, value, time);
  }
}

export { BaseAudioNode };
