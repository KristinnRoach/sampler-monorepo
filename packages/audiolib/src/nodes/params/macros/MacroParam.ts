import { LibParamDescriptor } from '@/nodes/params';
import {
  Message,
  MessageBus,
  MessageHandler,
  createMessageBus,
} from '@/events';
import { SCALE_PATTERNS } from '@/utils/musical/constants';
import { Debouncer } from '@/utils/Debouncer';
import { AudioParamController, ValueSnapper } from '@/nodes/params';
import { assert } from '@/utils';
import { NodeType } from '@/nodes/LibNode';

export class MacroParam {
  // implements LibParam {
  readonly nodeType: string = 'macro'; // Temporarily removed dependency on LibParam and ParamType
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
      debounceMs = 30,
      onComplete,
      onCompleteDelayMs = 30,
    } = options;

    const executeRamp = () => {
      let processedValue = this.#processValue(targetValue, constant);
      this.#controller.ramp(processedValue, duration, method);

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

  #processValue(value: number, constant: number): number {
    const targetPeriod = Math.abs(value - constant);

    if (
      this.#snapper.hasPeriodSnapping &&
      targetPeriod < this.#snapper.longestPeriod
    ) {
      return this.#snapper.snapToPeriod(value, constant);
    } else if (this.#snapper.hasValueSnapping) {
      return this.#snapper.snapToValue(value);
    }

    return value;
  }

  // Delegate configuration methods
  setAllowedParamValues(values: number[]): this {
    this.#snapper.setAllowedValues(values);
    return this;
  }

  setAllowedPeriods(periods: number[]): this {
    this.#snapper.setAllowedPeriods(periods);
    return this;
  }

  setScale(
    rootNote: string,
    scale: keyof typeof SCALE_PATTERNS | number[],
    options: {
      lowestOctave?: number;
      highestOctave?: number;
    } = {}
  ): this {
    const { lowestOctave = 0, highestOctave = 8 } = options;

    const scalePattern = Array.isArray(scale) ? scale : SCALE_PATTERNS[scale];

    this.#snapper.setScale(rootNote, scalePattern, lowestOctave, highestOctave);
    return this;
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

  get isReady() {
    return this.#isReady;
  }

  get now(): number {
    throw new Error('Not implemented');
  }

  get macro(): AudioParam {
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

  // Stub methods for interface compliance
  connect(target: AudioParam, nodeType: NodeType, scaleFactor?: number): this {
    this.addTarget(target, nodeType, scaleFactor);
    return this;
  }

  disconnect(target?: AudioParam | TODO): void {
    throw new Error('Not implemented');
  }
}
