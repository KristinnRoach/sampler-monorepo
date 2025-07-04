import { createNodeId, deleteNodeId } from '@/nodes/node-store';
import { cancelScheduledParamValues } from '@/utils';

export class AudioParamController {
  readonly nodeId: NodeID;
  #context: BaseAudioContext;
  #constantSignal: ConstantSourceNode;
  #targets: Array<{ param: AudioParam; scaler?: GainNode }> = [];
  #isReady: boolean = false;

  static MIN_EXPONENTIAL_RAMP_VALUE = 1e-6;

  constructor(
    context: BaseAudioContext,
    initialValue: number = AudioParamController.MIN_EXPONENTIAL_RAMP_VALUE
  ) {
    this.#context = context;
    this.nodeId = createNodeId('audio-param-controller');

    this.#constantSignal = context.createConstantSource();
    this.#constantSignal.start();

    // Use the ConstantSourceNode's offset directly instead of a GainNode
    this.#constantSignal.offset.setValueAtTime(
      initialValue,
      context.currentTime
    );

    this.#isReady = true;
  }

  addTarget(targetParam: AudioParam, scaleFactor: number = 1): this {
    if (scaleFactor === 1) {
      // Connect ConstantSource directly to the AudioParam
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

  setValue(value: number, cancelScheduled = true): this {
    cancelScheduled &&
      cancelScheduledParamValues(this.param, this.#context.currentTime);

    this.param.setValueAtTime(value, this.#context.currentTime + 0.001);
    return this;
  }

  get targets() {
    return this.#targets;
  }

  get context() {
    return this.#context;
  }

  get param(): AudioParam {
    return this.#constantSignal.offset; // Use offset instead of gain
  }

  get value(): number {
    return this.param.value;
  }

  get isReady() {
    return this.#isReady;
  }

  dispose(): void {
    this.#constantSignal.stop();
    this.#constantSignal.disconnect();
    deleteNodeId(this.nodeId);
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
