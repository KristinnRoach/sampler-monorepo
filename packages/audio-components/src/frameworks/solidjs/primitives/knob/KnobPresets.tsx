import { KnobComponentProps } from './KnobComponent';
// import { KnobChangeEventDetail } from '../../types';

// ===== KNOB CONFIGURATIONS (KnobComponent-compatible) =====

const volumeKnobProps: KnobComponentProps = {
  label: 'Volume',
  defaultValue: 0.75,
};

const dryWetKnobProps: KnobComponentProps = {
  label: 'Dry/Wet',
  defaultValue: 0.5,
};

const feedbackKnobProps: KnobComponentProps = {
  label: 'Feedback',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  snapIncrement: 0.001,
  curve: 2.5,
};

const distortionKnobProps: KnobComponentProps = {
  label: 'Distortion',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  curve: 1.5,
};

const driveKnobProps: KnobComponentProps = {
  label: 'Drive',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
};

const clippingKnobProps: KnobComponentProps = {
  label: 'Clipping',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
};

const glideKnobProps: KnobComponentProps = {
  label: 'Glide',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  snapIncrement: 0.001,
  curve: 1,
};

const feedbackPitchKnobProps: KnobComponentProps = {
  label: 'FB-Pitch',
  defaultValue: 1.0,
  minValue: 0.25,
  maxValue: 4,
  allowedValues: [0.25, 0.5, 1.0, 2.0, 3.0, 4.0],
  curve: 2,
};

const feedbackDecayKnobProps: KnobComponentProps = {
  label: 'FB-Decay',
  defaultValue: 0.75,
  minValue: 0.01,
  maxValue: 1,
  curve: 1.5,
};

const feedbackLpfKnobProps: KnobComponentProps = {
  label: 'FB-LPF',
  defaultValue: 10000,
  minValue: 400,
  maxValue: 16000,
  curve: 5,
};

const delayTimeKnobProps: KnobComponentProps = {
  label: 'Delay',
  defaultValue: 0.1,
  minValue: 0.005,
  maxValue: 1.5,
  curve: 2,
};

const delayFBKnobProps: KnobComponentProps = {
  label: 'Delay Feedback',
  defaultValue: 0.25,
  minValue: 0,
  maxValue: 1,
  curve: 1.5,
};

const delaySendKnobProps: KnobComponentProps = {
  label: 'Delay Send',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 2,
};

const gainLFORateKnobProps: KnobComponentProps = {
  label: 'Amp LFO Rate',
  defaultValue: 0.1,
  curve: 5,
  snapIncrement: 0,
};

const gainLFODepthKnobProps: KnobComponentProps = {
  label: 'Amp LFO Depth',
  defaultValue: 0.0,
  curve: 1.5,
};

const pitchLFORateKnobProps: KnobComponentProps = {
  label: 'Pitch LFO Rate',
  defaultValue: 0.01,
  curve: 5,
  snapIncrement: 0,
};

const pitchLFODepthKnobProps: KnobComponentProps = {
  label: 'Pitch LFO Depth',
  defaultValue: 0.0,
  curve: 1.5,
};

const reverbSendKnobProps: KnobComponentProps = {
  label: 'Reverb Send',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 1,
};

const reverbSizeKnobProps: KnobComponentProps = {
  label: 'Reverb Size',
  defaultValue: 0.7,
  curve: 1,
};

const loopDurationDriftKnobProps: KnobComponentProps = {
  label: 'Loop Drift',
  defaultValue: 0.3,
  minValue: 0,
  maxValue: 1,
  curve: 0.5,
  snapIncrement: 0.001,
};

const lowpassFilterKnobProps: KnobComponentProps = {
  label: 'LPF',
  defaultValue: 20000,
  minValue: 40,
  maxValue: 20000,
  curve: 5,
};

const highpassFilterKnobProps: KnobComponentProps = {
  label: 'HPF',
  defaultValue: 40,
  minValue: 20,
  maxValue: 20000,
  curve: 5,
};

const amplitudeModKnobProps: KnobComponentProps = {
  label: 'AM',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 1,
};

const trimStartKnobProps: KnobComponentProps = {
  label: 'Start',
  defaultValue: 0,
  snapIncrement: 0.001,
};

const trimEndKnobProps: KnobComponentProps = {
  label: 'End',
  defaultValue: 1,
  snapIncrement: 0.001,
};

const loopStartKnobProps: KnobComponentProps = {
  label: 'Loop Start',
  defaultValue: 0,
  minValue: 0,
  snapIncrement: 0.001,
};

const loopDurationKnobProps: KnobComponentProps = {
  label: 'Loop Length',
  defaultValue: 1,
  minValue: 0,
  maxValue: 1,
  curve: 4,
  snapIncrement: 0,
};

const tempoKnobProps: KnobComponentProps = {
  label: 'Tempo',
  defaultValue: 120,
  minValue: 20,
  maxValue: 300,
  curve: 1,
  snapIncrement: 1,
};

// Export all KnobPresetProps as an object for easy import
export const KnobPresetProps = {
  volume: volumeKnobProps,
  dryWet: dryWetKnobProps,
  feedback: feedbackKnobProps,
  distortion: distortionKnobProps,
  drive: driveKnobProps,
  clipping: clippingKnobProps,
  glide: glideKnobProps,
  feedbackPitch: feedbackPitchKnobProps,
  feedbackDecay: feedbackDecayKnobProps,
  feedbackLpf: feedbackLpfKnobProps,
  delayTime: delayTimeKnobProps,
  delayFeedback: delayFBKnobProps,
  delaySend: delaySendKnobProps,
  gainLFORate: gainLFORateKnobProps,
  gainLFODepth: gainLFODepthKnobProps,
  pitchLFORate: pitchLFORateKnobProps,
  pitchLFODepth: pitchLFODepthKnobProps,
  reverbSend: reverbSendKnobProps,
  reverbSize: reverbSizeKnobProps,
  loopDurationDrift: loopDurationDriftKnobProps,
  lowpassFilter: lowpassFilterKnobProps,
  highpassFilter: highpassFilterKnobProps,
  amplitudeMod: amplitudeModKnobProps,
  trimStart: trimStartKnobProps,
  trimEnd: trimEndKnobProps,
  loopStart: loopStartKnobProps,
  loopDuration: loopDurationKnobProps,
  tempo: tempoKnobProps,
};

// Export the type for preset keys
export type KnobPresetKey = keyof typeof KnobPresetProps;
