import { createNodeId, deleteNodeId } from '@/nodes/node-store';

import { cancelScheduledParamValues } from '@/utils';

export class AudioParamController {
  readonly nodeId: NodeID;
  #context: BaseAudioContext;
  #controlNode: GainNode;
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

    this.#controlNode = new GainNode(context, { gain: initialValue });
    this.#constantSignal.connect(this.#controlNode);

    this.#isReady = true;
  }

  addTarget(targetParam: AudioParam, scaleFactor: number = 1): this {
    if (scaleFactor === 1) {
      this.#controlNode.connect(targetParam);
      this.#targets.push({ param: targetParam });
    } else {
      const scaler = new GainNode(this.#context, { gain: scaleFactor });
      this.#controlNode.connect(scaler);
      scaler.connect(targetParam);
      this.#targets.push({ param: targetParam, scaler });
    }
    return this;
  }

  ramp(
    targetValue: number,
    duration: number,
    method: 'exponential' | 'linear' = 'exponential'
  ): this {
    const now = this.#context.currentTime;
    const safeValue = Math.max(
      targetValue,
      AudioParamController.MIN_EXPONENTIAL_RAMP_VALUE
    );

    cancelScheduledParamValues(this.param, now);

    if (method === 'exponential') {
      this.param.exponentialRampToValueAtTime(safeValue, now + duration);
    } else {
      this.param.linearRampToValueAtTime(safeValue, now + duration);
    }

    return this;
  }

  setValue(value: number): this {
    this.param.setValueAtTime(value, this.#context.currentTime + 0.0001);
    return this;
  }

  get param(): AudioParam {
    return this.#controlNode.gain;
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
    this.#controlNode.disconnect();
    deleteNodeId(this.nodeId);
  }
}
