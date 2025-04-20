import { assert } from '@/utils';

export class MacroParam {
  private node: GainNode;

  constructor(context: BaseAudioContext, initialValue: number = 0) {
    this.node = new GainNode(context, { gain: initialValue });
  }

  get param(): AudioParam {
    return this.node.gain;
  }

  // add target audioparam to be controlled by the macro
  addTarget(target: AudioParam, scaleFactor: number = 1): void {
    assert(target !== undefined, 'target should be AudioParam!', this);
    if (scaleFactor === 1) {
      this.node.connect(target);
    } else {
      const scaler = new GainNode(this.node.context, { gain: scaleFactor });
      this.node.connect(scaler).connect(target);
    }
  }

  dispose(): void {
    this.node.disconnect();
  }
}

// Usage example
// const loopStartMacro = new MacroParam(context, 0);
// loopStartMacro.addTarget(sourceNode1.loopStart);
// loopStartMacro.addTarget(sourceNode2.loopStart);

// Control all connected params at once
// loopStartMacro.param.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
