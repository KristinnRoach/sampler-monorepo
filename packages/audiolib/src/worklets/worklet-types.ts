import { WorkletNode } from './WorkletNode';

export type { WorkletNode };

export type WorkletMessage = Record<string, any>;

// === BASE CONFIG ===

export interface WorkletParameters {
  [key: string]: number;
}

export interface WorkletConfig {
  params: WorkletParameters;
  message: WorkletMessage;
}

export interface DefaultWorkletConfig extends WorkletConfig {
  params: WorkletParameters;
  message: WorkletMessage;
}

// === DISTORTION ===

export type DistortionParams = {
  clippingThreshold: number;
  clippingAmount: number;
  distortionDrive: number;
};

export type DistortionMsg = {
  type: 'setLimitingMode';
  mode: 'soft-clipping' | 'hard-clipping';
};

export type DistortionConfig = {
  params: DistortionParams;
  message: DistortionMsg;
};

export type DistortionWorklet = WorkletNode<DistortionConfig>;

// === FB DELAY ===

export type FbDelayParams = {
  delayTime: number;
  feedbackAmount: number;
};

export type FbDelayMsg = {
  type: 'setAutoGain';
  amount: number;
};

export type FbDelayConfig = {
  params: FbDelayParams;
  message: FbDelayMsg;
};

export type FbDelayWorklet = WorkletNode<FbDelayConfig>;

// === DATTORRO REVERB ===

export type DattorroReverbParams = {
  preDelay: number;
  bandwidth: number;
  inputDiffusion1: number;
  inputDiffusion2: number;
  decay: number;
  decayDiffusion1: number;
  decayDiffusion2: number;
  damping: number;
  excursionRate: number;
  excursionDepth: number;
  wet: number;
  dry: number;
  [key: string]: number; // For compatibility
};

export type DattorroReverbMsg =
  | {
      type: 'setPreset';
      preset: 'room' | 'church' | 'freeze' | 'ether' | 'default';
      rampTime?: number;
    }
  | { type: 'setDiffusionMacro'; value: number }
  | { type: 'setAmountMacro'; amount: number };

export type DattorroReverbConfig = {
  params: DattorroReverbParams;
  message: DattorroReverbMsg;
};

export type DattorroReverbWorklet = WorkletNode<DattorroReverbConfig>;

/* Example for multi msg support: 
export type DistortionMsg = 
  | { type: 'setAutoGain'; enabled: boolean; amount: number; }
  | { type: 'setSomethingElse'; something: number; };
*/
