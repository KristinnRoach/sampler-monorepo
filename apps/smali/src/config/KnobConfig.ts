import {
  KnobComponent,
  type KnobChangeEventDetail,
  type KnobComponentProps,
} from '@repo/audio-components/solidjs';

// ===== KNOB CONFIGURATIONS (KnobComponent-compatible) =====

const volumeConfig: KnobComponentProps = {
  label: 'Volume',
  defaultValue: 0.75,
};

const dryWetConfig: KnobComponentProps = {
  label: 'Dry/Wet',
  defaultValue: 0.5,
};

const feedbackConfig: KnobComponentProps = {
  label: 'Feedback',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  snapIncrement: 0.001,
  curve: 2.5,
};

const distortionConfig: KnobComponentProps = {
  label: 'Distortion',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  curve: 1.5,
};

const driveConfig: KnobComponentProps = {
  label: 'Drive',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
};

const clippingConfig: KnobComponentProps = {
  label: 'Clipping',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
};

const glideConfig: KnobComponentProps = {
  label: 'Glide',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  snapIncrement: 0.001,
  curve: 1,
};

const feedbackPitchConfig: KnobComponentProps = {
  label: 'FB-Pitch',
  defaultValue: 1.0,
  minValue: 0.25,
  maxValue: 4,
  allowedValues: [0.25, 0.5, 1.0, 2.0, 3.0, 4.0],
  curve: 2,
};

const feedbackDecayConfig: KnobComponentProps = {
  label: 'FB-Decay',
  defaultValue: 0.75,
  minValue: 0.01,
  maxValue: 1,
  curve: 1.5,
};

const feedbackLpfConfig: KnobComponentProps = {
  label: 'FB-LPF',
  defaultValue: 10000,
  minValue: 400,
  maxValue: 16000,
  curve: 5,
};

const delayTimeConfig: KnobComponentProps = {
  label: 'Delay',
  defaultValue: 0.1,
  minValue: 0.005,
  maxValue: 1.5,
  curve: 2,
};

const delayFBConfig: KnobComponentProps = {
  label: 'Delay Feedback',
  defaultValue: 0.25,
  minValue: 0,
  maxValue: 1,
  curve: 1.5,
};

const delaySendConfig: KnobComponentProps = {
  label: 'Delay Send',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 2,
};

const gainLFORateConfig: KnobComponentProps = {
  label: 'Amp LFO Rate',
  defaultValue: 0.1,
  curve: 5,
  snapIncrement: 0,
};

const gainLFODepthConfig: KnobComponentProps = {
  label: 'Amp LFO Depth',
  defaultValue: 0.0,
  curve: 1.5,
};

const pitchLFORateConfig: KnobComponentProps = {
  label: 'Pitch LFO Rate',
  defaultValue: 0.01,
  curve: 5,
  snapIncrement: 0,
};

const pitchLFODepthConfig: KnobComponentProps = {
  label: 'Pitch LFO Depth',
  defaultValue: 0.0,
  curve: 1.5,
};

const reverbSendConfig: KnobComponentProps = {
  label: 'Reverb Send',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 1,
};

const reverbSizeConfig: KnobComponentProps = {
  label: 'Reverb Size',
  defaultValue: 0.7,
  curve: 1,
};

const loopDurationDriftConfig: KnobComponentProps = {
  label: 'Loop Drift',
  defaultValue: 0.3,
  minValue: 0,
  maxValue: 1,
  curve: 0.5,
  snapIncrement: 0.001,
};

const lowpassFilterConfig: KnobComponentProps = {
  label: 'LPF',
  defaultValue: 20000,
  minValue: 40,
  maxValue: 20000,
  curve: 5,
};

const highpassFilterConfig: KnobComponentProps = {
  label: 'HPF',
  defaultValue: 40,
  minValue: 20,
  maxValue: 20000,
  curve: 5,
};

const amplitudeModConfig: KnobComponentProps = {
  label: 'AM',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 1,
};

const trimStartConfig: KnobComponentProps = {
  label: 'Start',
  defaultValue: 0,
  snapIncrement: 0.001,
};

const trimEndConfig: KnobComponentProps = {
  label: 'End',
  defaultValue: 1,
  snapIncrement: 0.001,
};

const loopStartConfig: KnobComponentProps = {
  label: 'Loop Start',
  defaultValue: 0,
  minValue: 0,
  snapIncrement: 0.001,
};

const loopDurationConfig: KnobComponentProps = {
  label: 'Loop Length',
  defaultValue: 1,
  minValue: 0,
  maxValue: 1,
  curve: 4,
  snapIncrement: 0,
};

const tempoKnobComponentProps: KnobComponentProps = {
  label: 'Tempo',
  defaultValue: 120,
  minValue: 20,
  maxValue: 300,
  curve: 1,
  snapIncrement: 1,
};

// Export all configurations as an object for easy import
export const KnobConfig = {
  volumeConfig,
  dryWetConfig,
  feedbackConfig,
  distortionConfig,
  driveConfig,
  clippingConfig,
  glideConfig,
  feedbackPitchConfig,
  feedbackDecayConfig,
  feedbackLpfConfig,
  delayTimeConfig,
  delayFBConfig,
  delaySendConfig,
  gainLFORateConfig,
  gainLFODepthConfig,
  pitchLFORateConfig,
  pitchLFODepthConfig,
  reverbSendConfig,
  reverbSizeConfig,
  loopDurationDriftConfig,
  lowpassFilterConfig,
  highpassFilterConfig,
  amplitudeModConfig,
  trimStartConfig,
  trimEndConfig,
  loopStartConfig,
  loopDurationConfig,
  tempoKnobComponentProps,
};
