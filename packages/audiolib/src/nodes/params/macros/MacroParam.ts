import { LibParamDescriptor } from '@/nodes/params';
import {
  Message,
  MessageBus,
  MessageHandler,
  createMessageBus,
} from '@/events';
import { SCALE_PATTERNS } from '@/utils/music-theory/constants';
import { Debouncer } from '@/utils/Debouncer';
import { AudioParamController, ValueSnapper } from '@/nodes/params';
import { assert } from '@/utils';
import { NodeType } from '@/nodes/LibNode';
import type { NormalizeOptions } from '@/nodes/params/param-types';

export class MacroParam {
  readonly nodeType: string = 'macro';
  readonly nodeId: NodeID;

  #controller: AudioParamController;
  #snapper: ValueSnapper;
  #debouncer: Debouncer;
  #messages: MessageBus<Message>;
  #paramType: string = '';
  #isReady: boolean = false;

  descriptor: LibParamDescriptor;

  constructor(context: BaseAudioContext, descriptor: LibParamDescriptor) {
    this.descriptor = descriptor;
    this.#controller = new AudioParamController(
      context,
      descriptor.defaultValue
    );
    this.#snapper = new ValueSnapper();
    this.#debouncer = new Debouncer();

    this.#messages = createMessageBus(this.#controller.nodeId);
    this.nodeId = this.#controller.nodeId;

    this.#isReady = true;
  }

  addTarget(
    targetParam: AudioParam,
    paramType: string,
    scaleFactor: number = 1
  ): this {
    if (!this.#paramType) this.#paramType = paramType;
    assert(
      // todo: allow multiple types
      paramType === this.#paramType,
      'Macros only support a single ParamType'
    );

    this.#controller.addTarget(targetParam, scaleFactor);
    return this;
  }

  ramp(
    targetValue: number,
    duration: number,
    constant: number,
    options: {
      method?: 'exponential' | 'linear';
      debounceMs?: number;
      onComplete?: () => void;
      onCompleteDelayMs?: number;
    } = {}
  ): this {
    const {
      method = 'exponential',
      debounceMs = 20,
      onComplete,
      onCompleteDelayMs = 30,
    } = options;

    const executeRamp = () => {
      let processedValue = this.#processValue(targetValue, constant);

      this.#controller.ramp(processedValue, duration, method, true);

      if (onComplete) {
        setTimeout(onComplete, duration * 1000 + onCompleteDelayMs);
      }
    };

    if (debounceMs === 0) {
      executeRamp();
    } else {
      const debounced = this.#debouncer.debounce(
        this.nodeId,
        executeRamp,
        debounceMs
      );
      debounced();
    }

    return this;
  }

  debugProcessVal(value: number, constant: number, targetPeriod: number) {
    console.log('MacroParam.#processValue input:', {
      value,
      constant,
      targetPeriod,
      hasValueSnapping: this.#snapper.hasValueSnapping,
      hasPeriodSnapping: this.#snapper.hasPeriodSnapping,
      longestPeriod: this.#snapper.longestPeriod,
    });
  }

  #processValue(targetValue: number, constant: number): number {
    if (!Number.isFinite(targetValue) || !Number.isFinite(constant)) {
      return targetValue;
    }

    const targetPeriod = Math.abs(targetValue - constant);

    if (
      this.#snapper.hasPeriodSnapping &&
      targetPeriod < this.#snapper.longestPeriod
    ) {
      const quantizedPeriod = this.#snapper.snapToMusicalPeriod(targetPeriod);

      // this.#debugProcessedValue(targetPeriod, constant, targetPeriod, quantizedPeriod);

      let result;

      if (this.#paramType === 'loopEnd') {
        result = constant + quantizedPeriod;
      }

      if (this.#paramType === 'loopStart') {
        result = constant - quantizedPeriod;
      }

      if (result) return result;
    } else if (this.#snapper.hasValueSnapping) {
      const snapped = this.#snapper.snapToValue(targetValue);
      return snapped;
    }

    return targetValue;
  }

  // Delegate configuration methods
  setAllowedParamValues(
    values: number[],
    normalize: NormalizeOptions | false
  ): number[] {
    return this.#snapper.setAllowedValues(values, normalize);
  }

  setAllowedPeriods(
    periods: number[],
    normalize: NormalizeOptions | false,
    snapToZeroCrossings: number[] | false = false
  ): number[] {
    return this.#snapper.setAllowedPeriods(
      periods,
      normalize,
      snapToZeroCrossings
    );
  }

  setScale(
    rootNote: string,
    scale: keyof typeof SCALE_PATTERNS | number[],
    options: {
      normalize: NormalizeOptions | false;
      lowestOctave?: number;
      highestOctave?: number;
      snapToZeroCrossings: number[] | false;
    }
  ): number[] {
    const { lowestOctave = 0, highestOctave = 8 } = options;

    const scalePattern = Array.isArray(scale) ? scale : SCALE_PATTERNS[scale];

    return this.#snapper.setScale(
      rootNote,
      scalePattern,
      lowestOctave,
      highestOctave,
      options.normalize,
      options.snapToZeroCrossings
    );
  }

  // Delegate basic operations
  setValue(value: number): this {
    this.#controller.setValue(value);
    this.#sendValueChangedMessage(value);
    return this;
  }

  getValue(): number {
    return this.#controller.value;
  }

  get targets() {
    return this.#controller.targets;
  }

  get snapper(): ValueSnapper {
    return this.#snapper;
  }

  get isReady() {
    return this.#isReady;
  }

  get now(): number {
    throw new Error('Not implemented');
  }

  get audioParam(): AudioParam {
    return this.#controller.param;
  }

  get value(): number {
    return this.#controller.value;
  }

  get type(): string {
    return this.#paramType;
  }

  get longestPeriod(): number {
    return this.#snapper.longestPeriod;
  }

  onChange(callback: MessageHandler<Message>): () => void {
    return this.onMessage('value:changed', callback);
  }

  #sendValueChangedMessage(value: number): void {
    this.#messages.sendMessage('value:changed', { value });
  }

  // Message bus methods
  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any): void {
    this.#messages.sendMessage(type, data);
  }

  dispose(): void {
    this.#controller.dispose();
    // Clean up other resources
  }

  #debugProcessedValue = (
    targetValue: number,
    constant: number,
    targetPeriod: number,
    quantizedPeriod: number
  ) => {
    console.debug(
      'adjusting param: ',
      this.#paramType,
      'targetValue',
      targetValue,
      'constant',
      constant,
      'targetPeriod',
      targetPeriod,
      'quantizedPeriod',
      quantizedPeriod
    );
  };

  // Stub methods for interface compliance
  connect(target: AudioParam, nodeType: NodeType, scaleFactor?: number): this {
    this.addTarget(target, nodeType, scaleFactor);
    return this;
  }

  disconnect(target?: AudioParam | TODO): void {
    throw new Error('Not implemented');
  }
}

// old code, delete:
// #processValue(value: number, constant: number): number {
//   const targetPeriod = Math.abs(value - constant);
//   // this.debugProcessVal(value, constant, targetPeriod)
//   if (
//     this.#snapper.hasPeriodSnapping &&
//     targetPeriod < this.#snapper.longestPeriod
//   ) {
//     const snapped = this.#snapper.snapToPeriod(value, constant);
//     console.log('MacroParam.#processValue period snapped:', {
//       value,
//       snapped,
//     });
//     return snapped;
//   } else if (this.#snapper.hasValueSnapping) {
//     const snapped = this.#snapper.snapToValue(value);
//     return snapped;
//   }

//   return value;
// }
