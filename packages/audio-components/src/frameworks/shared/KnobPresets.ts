import { SharedKnobComponentProps } from './knob-types';

// ===== KNOB CONFIGURATIONS (Framework-agnostic) =====

const volumeKnobProps: SharedKnobComponentProps = {
  label: 'Volume',
  defaultValue: 0.75,
};

const dryWetKnobProps: SharedKnobComponentProps = {
  label: 'Dry/Wet',
  defaultValue: 0.5,
};

const feedbackKnobProps: SharedKnobComponentProps = {
  label: 'Feedback',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  snapIncrement: 0.001,
  curve: 2.5,
  valueFormatter: (v: number) => v.toFixed(3),
};

const distortionKnobProps: SharedKnobComponentProps = {
  label: 'Distortion',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  curve: 1.5,
};

const driveKnobProps: SharedKnobComponentProps = {
  label: 'Drive',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
};

const clippingKnobProps: SharedKnobComponentProps = {
  label: 'Clipping',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
};

const glideKnobProps: SharedKnobComponentProps = {
  label: 'Glide',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  snapIncrement: 0.001,
  curve: 1,
  valueFormatter: (v: number) => v.toFixed(3),
};

const feedbackPitchKnobProps: SharedKnobComponentProps = {
  label: 'FB-Pitch',
  defaultValue: 1.0,
  minValue: 0.25,
  maxValue: 4,
  allowedValues: [0.25, 0.5, 1.0, 2.0, 3.0, 4.0],
  curve: 2,
};

const feedbackDecayKnobProps: SharedKnobComponentProps = {
  label: 'FB-Decay',
  defaultValue: 0.75,
  minValue: 0.01,
  maxValue: 1,
  curve: 1.5,
};

const feedbackLpfKnobProps: SharedKnobComponentProps = {
  label: 'FB-LPF',
  defaultValue: 10000,
  minValue: 400,
  maxValue: 16000,
  curve: 5,
  valueFormatter: (v: number) => `${v.toFixed(0)} Hz`,
};

const delayTimeKnobProps: SharedKnobComponentProps = {
  label: 'Delay',
  defaultValue: 0.1,
  minValue: 0.005,
  maxValue: 1.5,
  curve: 2,
  valueFormatter: (v: number) => `${v.toFixed(3)} s`,
};

const delayFBKnobProps: SharedKnobComponentProps = {
  label: 'Delay Feedback',
  defaultValue: 0.25,
  minValue: 0,
  maxValue: 1,
  curve: 1.5,
  valueFormatter: (v: number) => `${(v * 100).toFixed(0)}%`,
};

const delaySendKnobProps: SharedKnobComponentProps = {
  label: 'Delay Send',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 2,
  valueFormatter: (v: number) => `${(v * 100).toFixed(0)}%`,
};

const gainLFORateKnobProps: SharedKnobComponentProps = {
  label: 'Amp LFO Rate',
  defaultValue: 0.1,
  curve: 5,
  snapIncrement: 0,
};

const gainLFODepthKnobProps: SharedKnobComponentProps = {
  label: 'Amp LFO Depth',
  defaultValue: 0.0,
  curve: 1.5,
};

const pitchLFORateKnobProps: SharedKnobComponentProps = {
  label: 'Pitch LFO Rate',
  defaultValue: 0.01,
  curve: 5,
  snapIncrement: 0,
};

const pitchLFODepthKnobProps: SharedKnobComponentProps = {
  label: 'Pitch LFO Depth',
  defaultValue: 0.0,
  curve: 1.5,
};

const reverbSendKnobProps: SharedKnobComponentProps = {
  label: 'Reverb Send',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 1,
  valueFormatter: (v: number) => `${(v * 100).toFixed(1)}%`,
};

const reverbSizeKnobProps: SharedKnobComponentProps = {
  label: 'Reverb Size',
  defaultValue: 0.7,
  curve: 1,
};

const loopDurationDriftKnobProps: SharedKnobComponentProps = {
  label: 'Loop Drift',
  defaultValue: 0.3,
  minValue: 0,
  maxValue: 1,
  curve: 0.5,
  snapIncrement: 0.001,
  valueFormatter: (v: number) => `${(v * 100).toFixed(1)}%`,
};

const lowpassFilterKnobProps: SharedKnobComponentProps = {
  label: 'LPF',
  defaultValue: 20000,
  minValue: 40,
  maxValue: 20000,
  curve: 5,
  valueFormatter: (v: number) => `${v.toFixed(0)} Hz`,
};

const highpassFilterKnobProps: SharedKnobComponentProps = {
  label: 'HPF',
  defaultValue: 40,
  minValue: 20,
  maxValue: 20000,
  curve: 5,
};

const amplitudeModKnobProps: SharedKnobComponentProps = {
  label: 'AM',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 1,
};

const trimStartKnobProps: SharedKnobComponentProps = {
  label: 'Start',
  defaultValue: 0,
  snapIncrement: 0.001,
  valueFormatter: (v: number) => v.toFixed(3),
};

const trimEndKnobProps: SharedKnobComponentProps = {
  label: 'End',
  defaultValue: 1,
  snapIncrement: 0.001,
  valueFormatter: (v: number) => v.toFixed(3),
};

const loopStartKnobProps: SharedKnobComponentProps = {
  label: 'Loop Start',
  defaultValue: 0,
  minValue: 0,
  snapIncrement: 0.001,
  valueFormatter: (v: number) => v.toFixed(3),
};

const loopDurationKnobProps: SharedKnobComponentProps = {
  label: 'Loop Length',
  defaultValue: 1,
  minValue: 0,
  maxValue: 1,
  curve: 4,
  snapIncrement: 0,
};

const tempoKnobProps: SharedKnobComponentProps = {
  label: 'Tempo',
  defaultValue: 120,
  minValue: 20,
  maxValue: 300,
  curve: 1,
  snapIncrement: 1,
  valueFormatter: (v: number) => `${v.toFixed(0)} BPM`,
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
