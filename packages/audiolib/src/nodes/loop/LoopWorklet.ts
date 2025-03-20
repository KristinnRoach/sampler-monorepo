import { WorkletNode } from '@/nodes/worklet/WorkletNode';
import { AudioParamDescriptor } from '@/nodes/worklet/types';
import LoopProcessorRaw from './loop-processor?raw';

export class LoopWorklet extends WorkletNode {
  static params: AudioParamDescriptor[] = [
    {
      name: 'loopStart',
      defaultValue: 0,
      minValue: 0,
      maxValue: 1000,
      automationRate: 'a-rate', // TODO: testing a-rate vs k-rate
    },
    {
      name: 'loopEnd',
      defaultValue: 1,
      minValue: 0,
      maxValue: 1000,
      automationRate: 'a-rate',
    },
    {
      name: 'interpolationSpeed',
      defaultValue: 0.05,
      minValue: 0.001,
      maxValue: 1.0,
      automationRate: 'k-rate',
    },
  ];

  #sourceNode: AudioBufferSourceNode | null = null;

  constructor(context: BaseAudioContext) {
    super(context, 1, 1); // Todo: make nr of inputs and outputs dynamic (at least support stereo)
  }

  public async initialise(): Promise<void> {
    return super.initialise();
  }

  static _getWorkletProcessor(): string {
    return LoopProcessorRaw;
  }

  /**
   * Connect the loop processor to a source node and set up message handling
   * @param sourceNode The AudioBufferSourceNode to control loop points for
   */
  connectToSource(sourceNode: AudioBufferSourceNode): boolean {
    if (!this._initialised) {
      throw new Error(
        'LoopProcessorWorklet must be initialized before connecting to a source'
      );
    }

    this.#sourceNode = sourceNode;
    sourceNode.connect(this.workletNode);
    this.workletNode.connect(this.context.destination);

    // Set up message handling to update the source node's loop points
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'update' && this.#sourceNode) {
        this.#sourceNode.loopStart = event.data.loopStart;
        this.#sourceNode.loopEnd = event.data.loopEnd;
      }
    };

    // Initialize the processor with current loop points
    this.workletNode.port.postMessage({
      type: 'init',
      loopStart: sourceNode.loopStart,
      loopEnd: sourceNode.loopEnd,
    });

    return true;
  }

  /**
   * Set loop start point with optional scheduling
   * @param value Loop start position in seconds
   * @param time When to schedule the change (defaults to now)
   */
  setLoopStart(value: number, time?: number): void {
    this.setParam('loopStart', value, time);
  }

  /**
   * Set loop end point with optional scheduling
   * @param value Loop end position in seconds
   * @param time When to schedule the change (defaults to now)
   */
  setLoopEnd(value: number, time?: number): void {
    this.setParam('loopEnd', value, time);
  }

  /**
   * Set interpolation speed for smooth transitions
   * @param value Interpolation speed (0.001 to 1.0)
   * @param time When to schedule the change (defaults to now)
   */
  setInterpolationSpeed(value: number, time?: number): void {
    this.setParam('interpolationSpeed', value, time);
  }
}
