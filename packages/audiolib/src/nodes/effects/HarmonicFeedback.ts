import { ILibAudioNode } from '../LibAudioNode';
import { NodeType } from '@/nodes/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
import { clamp, mapToRange } from '@/utils';
import { createFeedbackDelay } from '@/worklets/worklet-factory';
import { FbDelayWorklet } from '@/worklets/worklet-types';

export class HarmonicFeedback implements ILibAudioNode {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType = 'harmonic-feedback';
  #initialized = false;
  #context: AudioContext;

  #delay: FbDelayWorklet;

  #inputGain: GainNode;
  #outputGain: GainNode;
  #wetGain: GainNode;
  #dryGain: GainNode;

  #connections = new Set<ILibAudioNode | AudioNode | AudioWorkletNode>();
  #incoming = new Set<ILibAudioNode>();

  #baseDelayTime: number;
  #pitchMultiplier = 1;
  #decayActive = false;

  #MIN_FB = 0.92; // ? make user friendly range in processor ?
  #MAX_FB = 0.999;
  #C6_SECONDS = 0.00095556;
  #C7_SECONDS = 0.0004774632;

  constructor(context: AudioContext = getAudioContext()) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;

    this.#delay = createFeedbackDelay(context);

    this.#inputGain = new GainNode(context, { gain: 1 });
    this.#outputGain = new GainNode(context, { gain: 1 });

    this.#wetGain = new GainNode(context, { gain: 0.0 });
    this.#dryGain = new GainNode(context, { gain: 1.0 });

    // Wet path: input -> wetGain ->  delay -> output
    this.#inputGain.connect(this.#wetGain);
    this.#wetGain.connect(this.#delay);
    this.#delay.connect(this.#outputGain);

    // Dry path: input -> dryGain -> output
    this.#inputGain.connect(this.#dryGain);
    this.#dryGain.connect(this.#outputGain);

    const initDelayTime = this.setPitch(60);
    this.#baseDelayTime = initDelayTime;

    // Initialize decay amount to 0 (no decay effect)
    this.setDecay(0);

    this.#initialized = true;
  }

  trigger(
    midiNote: number,
    options: {
      glideTime?: number;
      velocity?: number;
      secondsFromNow?: number;
      cents?: number;
      triggerDecay?: boolean;
    } = {}
  ) {
    const {
      secondsFromNow = 0,
      cents = 0,
      velocity = 100,
      glideTime = 0,
      triggerDecay = true,
    } = options;
    const timestamp = this.now + secondsFromNow;

    this.setPitch(midiNote, cents, timestamp, glideTime);

    if (triggerDecay) {
      // Trigger decay slightly after the pitch change to ensure feedback is established
      setTimeout(() => this.triggerDecay(), (secondsFromNow + 0.01) * 1000);
    }

    return this;
  }

  // === SETTERS ===

  setMix(mix: { dry?: number; wet?: number }): this {
    const timestamp = this.now;

    if (mix.dry !== undefined) {
      const safeDry = Math.max(0, Math.min(1, mix.dry));
      this.#dryGain.gain.setValueAtTime(safeDry, timestamp);
    }

    if (mix.wet !== undefined) {
      const safeWet = Math.max(0, Math.min(1, mix.wet));
      this.#wetGain.gain.setValueAtTime(safeWet, timestamp);
    }

    return this;
  }

  currAmount = 0;

  setAmountMacro(amount: number): this {
    const safeAmount = clamp(amount, 0, 1);

    this.#wetGain.gain.setValueAtTime(amount, this.now);

    // this.setMix({
    //   dry: 1 - safeAmount,
    //   wet: safeAmount,
    // });

    this.setFeedback(safeAmount);

    this.currAmount = safeAmount;
    return this;
  }

  setPitch(
    midiNote: number,
    cents: number = 0,
    timestamp = this.now,
    glideTime = 0
  ) {
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    const tunedFrequency =
      cents !== 0 ? frequency * Math.pow(2, cents / 1200) : frequency;

    const delaySec = 1 / tunedFrequency;

    const minDelay = this.#C6_SECONDS;
    const safeDelay = Math.max(minDelay, delaySec);

    this.setDelay(safeDelay, timestamp, glideTime);

    return safeDelay;
  }

  setDelay(seconds: number, timestamp = this.now, glideTime = 0) {
    this.#baseDelayTime = seconds;

    const scaled = seconds * this.#pitchMultiplier;
    const clamped = clamp(scaled, this.#C7_SECONDS, 4);

    if (glideTime === 0 || !isFinite(glideTime)) {
      this.getParam('delayTime')!.setValueAtTime(clamped, timestamp);
      return this;
    } else {
      this.getParam('delayTime')!.linearRampToValueAtTime(
        clamped,
        timestamp + glideTime
      );
    }
    return this;
  }

  setDelayMultiplier(value: number, timestamp = this.now, glideTime = 0.75) {
    if (!(typeof value === 'number') || !isFinite(value)) {
      console.warn('setDelayMultiplier:Invalid multiplier:', value);
      return;
    }

    // convert from UI range 1 - 5
    const mappedMultiplier = value; // ??? mapToRange(value, 1, 4, 0.5, 4);
    const delayParam = this.getParam('delayTime')!;

    this.#pitchMultiplier = mappedMultiplier;

    const newVal = clamp(
      mappedMultiplier * this.#baseDelayTime,
      this.#C7_SECONDS,
      4
    );

    if (glideTime === 0 || !isFinite(glideTime)) {
      delayParam.setValueAtTime(newVal, timestamp);
      return this;
    } else {
      delayParam.setTargetAtTime(newVal, timestamp, glideTime / 3);
      // divide seconds by 3 for timeConstant
    }

    return this;
  }

  setFeedback(gain: number, timestamp = this.now) {
    const mappedGain = mapToRange(gain, 0, 1, this.#MIN_FB, this.#MAX_FB, {
      warn: true,
    });

    this.#delay.parameters
      .get('feedbackAmount')!
      .setValueAtTime(mappedGain, timestamp);
    return this;
  }

  setAutoGain(enabled: boolean, amount = 0.965): this {
    this.#delay.port.postMessage({
      type: 'setAutoGain',
      enabled: enabled,
      amount,
    });
    return this;
  }

  setDecay(amount: number, timestamp = this.now): this {
    const clampedAmount = clamp(amount, 0, 1);
    this.getParam('decay')!.setValueAtTime(clampedAmount, timestamp);
    return this;
  }

  triggerDecay(): this {
    if (this.#decayActive) {
      // If decay is already active, restart it
      this.stopDecay();
    }

    this.#decayActive = true;
    const currentFeedbackAmount = this.getParam('feedbackAmount')!.value;

    this.#delay.port.postMessage({
      type: 'triggerDecay',
      baseFeedbackAmount: currentFeedbackAmount,
    });

    return this;
  }

  stopDecay(): this {
    this.#decayActive = false;
    this.#delay.port.postMessage({
      type: 'stopDecay',
    });
    return this;
  }

  // === CONNECTIONS ===

  connect(destination: ILibAudioNode | AudioNode): void {
    const target = 'input' in destination ? destination.input : destination;
    this.#outputGain.connect(target as AudioNode);

    this.#connections.add(destination);

    if ('nodeId' in destination) {
      (destination as any).addIncoming?.(this);
    }
  }

  disconnect(destination?: ILibAudioNode | AudioNode): void {
    if (destination) {
      const target = 'input' in destination ? destination.input : destination;
      this.#outputGain.disconnect(target as AudioNode);
      this.#connections.delete(destination);

      if ('nodeId' in destination) {
        (destination as any).removeIncoming?.(this);
      }
    } else {
      this.#outputGain.disconnect();
      this.#connections.clear();
    }
  }

  addIncoming(source: ILibAudioNode): void {
    this.#incoming.add(source);
  }

  removeIncoming(source: ILibAudioNode): void {
    this.#incoming.delete(source);
  }

  // === ILibAudioNode interface ===

  setParam(name: string, value: number, time = this.now): void {
    switch (name) {
      case 'feedback':
        this.setFeedback(value, time);
        break;
      case 'delayTime':
        this.setDelay(value, time);
        break;
      case 'wetAmount':
        this.#wetGain.gain.setValueAtTime(clamp(value, 0, 1), time);
        break;
      case 'dryAmount':
        this.#dryGain.gain.setValueAtTime(clamp(value, 0, 1), time);
        break;
      case 'amount':
        this.setAmountMacro(value);
        break;
      case 'decay':
        this.setDecay(value, time);
        break;
      default:
        // Try setting on delay worklet
        this.#delay.parameters.get(name)?.setValueAtTime(value, time);
        break;
    }
  }

  getParam(name: string): AudioParam | null {
    switch (name) {
      case 'wetAmount':
        return this.#wetGain.gain;
      case 'dryAmount':
        return this.#dryGain.gain;
      default:
        return this.#delay.parameters.get(name) || null;
    }
  }

  // === GETTERS ===

  get audioNode() {
    return this.#delay;
  }

  get context() {
    return this.#context;
  }

  get now() {
    return this.#context.currentTime;
  }

  get input() {
    return this.#inputGain;
  }
  get output() {
    return this.#outputGain;
  }

  get connections() {
    return {
      outgoing: Array.from(this.#connections),
      incoming: Array.from(this.#incoming),
    };
  }

  get mix(): { dry: number; wet: number } {
    return {
      dry: this.#dryGain.gain.value,
      wet: this.#wetGain.gain.value,
    };
  }

  get initialized() {
    return this.#initialized;
  }

  get decayActive() {
    return this.#decayActive;
  }

  get numberOfInputs() {
    return this.input.numberOfInputs;
  }

  get numberOfOutputs() {
    return this.output.numberOfOutputs;
  }

  get workletInfo() {
    return {
      numberOfInputs: this.#delay.numberOfInputs,
      numberOfOutputs: this.#delay.numberOfOutputs,
      channelCount: this.#delay.channelCount,
      channelCountMode: this.#delay.channelCountMode,
    };
  }

  // === CLEANUP ===

  dispose() {
    this.disconnect();
    deleteNodeId(this.nodeId);
  }
}
