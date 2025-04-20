import { assert } from '../utils/assert';

export class MacroParam {
  #context: BaseAudioContext;
  #controlNode: GainNode;
  #constantSignal: ConstantSourceNode;
  // #constantOffset: number = 0; // what is dis?

  #allowedValues: number[] = [];

  static MIN_EXPONENTIAL_VALUE = 1e-6; // maybe check official docs but this works well so far

  constructor(context: BaseAudioContext, initialValue: number = 0) {
    this.#context = context;
    assert(context instanceof AudioContext, '', this);

    this.#constantSignal = context.createConstantSource();
    this.#constantSignal.start();

    this.#controlNode = new GainNode(context, { gain: initialValue });
    this.#constantSignal.connect(this.#controlNode);
  }

  // add target audioparam to be controlled by the macro
  addTarget(target: AudioParam, scaleFactor: number = 1): void {
    assert(target !== undefined, 'target should be AudioParam!', this);
    if (scaleFactor === 1) {
      this.#controlNode.connect(target);
    } else {
      const scaler = new GainNode(this.#controlNode.context, {
        gain: scaleFactor,
      });
      this.#controlNode.connect(scaler).connect(target);
    }
  }

  ramp(
    targetValue: number,
    rampTime: number,
    type: 'linear' | 'exponential' | 'setTargetAtTime' = 'exponential'
  ): void {
    const now = this.now;
    const param = this.param;

    let finalValue = this.processTargetValue(targetValue);

    switch (type) {
      case 'linear':
        param.linearRampToValueAtTime(finalValue, now + rampTime);
        break;
      case 'exponential':
        param.exponentialRampToValueAtTime(finalValue, now + rampTime);
        break;
      case 'setTargetAtTime':
        param.setTargetAtTime(finalValue, now, rampTime);
        break;
    }
  }

  processTargetValue(value: number) {
    return this.clampToMin(this.snap(value));
  }

  snap(inputValue: number) {
    if (!this.snapEnabled) return inputValue;
    const values = this.#allowedValues;

    return values.reduce((prev, curr) =>
      Math.abs(curr - inputValue) < Math.abs(prev - inputValue) ? curr : prev
    );
  }

  clampToMin = (value: number) => {
    return Math.max(value, MacroParam.MIN_EXPONENTIAL_VALUE);
  };

  dispose(): void {
    this.#controlNode.disconnect();
  }
  /** SETTERS */

  setAllowedParamValues(values: number[]) {
    assert(values.length < 1, 'allowed values must not be empty!', this);
    this.#allowedValues = values;
  }

  set param(value: number) {
    this.param.setValueAtTime(value, this.now + 0.001);
  }
  /** GETTERS */

  get param(): AudioParam {
    return this.#controlNode.gain;
  }

  get node() {
    return this.#controlNode;
  }

  get now() {
    return this.#context.currentTime;
  }

  get value(): number {
    return this.#controlNode.gain.value;
  }

  get snapEnabled() {
    return this.#allowedValues.length > 0;
  }

  get numAllowedValues() {
    return this.#allowedValues.length;
  }
}

// Usage example
// const loopStartMacro = new MacroParam(context, 0);
// loopStartMacro.addTarget(sourceNode1.loopStart);
// loopStartMacro.addTarget(sourceNode2.loopStart);

// Control all connected params at once
// loopStartMacro.param.linearRampToValueAtTime(0.5, context.currentTime + 0.1);

/** Snap tolerance / threshold if needed (made the code ugly) */
// #snapTolerance: number = 0.01;
// if (this.#snapTolerance > 0) {
//   allowedValues = this.#snapValues.filter(
//     (value) => Math.abs(value - inputValue) <= this.#snapTolerance
//   );
// } else {
//   allowedValues = this.#snapValues;
// }
