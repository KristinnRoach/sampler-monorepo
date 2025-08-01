import { LibNode } from '@/nodes/LibNode';
import { unregisterNode, registerNode } from '@/nodes/node-store';
import { cancelScheduledParamValues } from '@/utils';

export class AudioParamController implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType = 'audio-param-controller';
  #context: BaseAudioContext;
  #constantSignal: ConstantSourceNode;
  #targets: Array<{ param: AudioParam; scaler?: GainNode }> = [];
  #initialized: boolean = false;

  static MIN_EXPONENTIAL_RAMP_VALUE = 1e-6;

  constructor(
    context: BaseAudioContext,
    initialValue: number = AudioParamController.MIN_EXPONENTIAL_RAMP_VALUE
  ) {
    this.#context = context;
    this.nodeId = registerNode(this.nodeType, this);

    this.#constantSignal = context.createConstantSource();
    this.#constantSignal.start();

    // Use the ConstantSourceNode's offset directly instead of a GainNode
    this.#constantSignal.offset.setValueAtTime(
      initialValue,
      context.currentTime
    );

    this.#initialized = true;
  }

  addTarget(targetParam: AudioParam, scaleFactor: number = 1): this {
    if (scaleFactor === 1) {
      this.#constantSignal.connect(targetParam);
      this.#targets.push({ param: targetParam });
    } else {
      const scaler = new GainNode(this.#context, { gain: scaleFactor });
      this.#constantSignal.connect(scaler);
      scaler.connect(targetParam);
      this.#targets.push({ param: targetParam, scaler });
    }
    return this;
  }

  ramp(
    targetValue: number,
    duration: number,
    method: 'exponential' | 'linear' = 'exponential',
    cancelScheduled = true
  ): this {
    const now = this.#context.currentTime;

    cancelScheduled && this.param.cancelScheduledValues(now); // cancelScheduledParamValues(this.param, now);

    // TESTING: Preventing unexpected jumps by explicitly setting the current value at the current time
    const currentValue = this.param.value;
    this.param.setValueAtTime(currentValue, now);

    if (method === 'exponential') {
      const safeValue = Math.max(
        targetValue,
        AudioParamController.MIN_EXPONENTIAL_RAMP_VALUE
      );
      this.param.exponentialRampToValueAtTime(safeValue, now + duration);
    } else {
      this.param.linearRampToValueAtTime(targetValue, now + duration);
    }

    return this;
  }

  setValue(value: number, timestamp = this.now, cancelScheduled = true): this {
    cancelScheduled && this.param.cancelScheduledValues(timestamp); // cancelScheduledParamValues(this.param, timestamp);

    this.param.setValueAtTime(value, timestamp); // + 0.00001 ?
    return this;
  }

  get targets() {
    return this.#targets;
  }

  get context() {
    return this.#context;
  }

  get now() {
    return this.#context.currentTime;
  }

  get param(): AudioParam {
    return this.#constantSignal.offset;
  }

  get value(): number {
    return this.param.value;
  }

  get initialized() {
    return this.#initialized;
  }

  dispose(): void {
    this.#constantSignal.stop();
    this.#constantSignal.disconnect();
    unregisterNode(this.nodeId);
  }
}

// OLD controlNode code:
// #controlNode: GainNode;

// this.#controlNode = new GainNode(context, { gain: initialValue });
// this.#constantSignal.connect(this.#controlNode);

// addTarget(targetParam: AudioParam, scaleFactor: number = 1): this {
//   if (scaleFactor === 1) {
//     this.#controlNode.connect(targetParam);
//     this.#targets.push({ param: targetParam });
//   } else {
//     const scaler = new GainNode(this.#context, { gain: scaleFactor });
//     this.#controlNode.connect(scaler);
//     scaler.connect(targetParam);
//     this.#targets.push({ param: targetParam, scaler });
//   }
//   return this;
// }

// get param(): AudioParam {
//   return this.#controlNode.gain;
// }
// this.#controlNode.disconnect();
