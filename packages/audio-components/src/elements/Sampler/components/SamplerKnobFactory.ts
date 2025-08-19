// KnobFactory.ts
import van from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';
import { createLabeledKnob } from '../../primitives/createKnob';
import { createKnob, KnobConfig } from '../../../shared/utils/component-utils';
import { INLINE_COMPONENT_STYLE } from '../../../shared/styles/component-styles';

// ===== KNOB CONFIGURATIONS =====

const dryWetConfig: KnobConfig = {
  label: 'Dry/Wet',
  defaultValue: 0.5,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      sampler.setDryWetMix({ dry: 1 - state.val, wet: state.val });
    });
  },
};

const feedbackConfig: KnobConfig = {
  label: 'Feedback',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setFeedbackAmount(state.val));
  },
};

const driveConfig: KnobConfig = {
  label: 'Drive',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.outputBus.setDrive(state.val));
  },
};

const clippingConfig: KnobConfig = {
  label: 'Clipping',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.outputBus.setClippingMacro(state.val));
  },
};

const glideConfig: KnobConfig = {
  label: 'Glide',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  snapIncrement: 0.001,
  curve: 1,
  valueFormatter: (v: number) => v.toFixed(3),
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setGlideTime(state.val));
  },
};

const feedbackPitchConfig: KnobConfig = {
  label: 'FB-Pitch',
  defaultValue: 1.0,
  minValue: 0.25,
  maxValue: 4,
  allowedValues: [0.25, 0.5, 1.0, 2.0, 3.0, 4.0],
  curve: 2,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setFeedbackPitchScale(state.val));
  },
};

const feedbackDecayConfig: KnobConfig = {
  label: 'FB-Decay',
  defaultValue: 1.0,
  minValue: 0.001,
  maxValue: 1,
  curve: 1,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setFeedbackDecay(state.val));
  },
};

const gainLFORateConfig: KnobConfig = {
  label: 'Amp LFO Rate',
  defaultValue: 0.1,
  curve: 5,
  snapIncrement: 0,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      const freqHz = state.val * 100 + 0.1;
      sampler.gainLFO?.setFrequency(freqHz);
    });
  },
};

const gainLFODepthConfig: KnobConfig = {
  label: 'Amp LFO Depth',
  defaultValue: 0.0,
  curve: 1.5,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.gainLFO?.setDepth(state.val));
  },
};

const pitchLFORateConfig: KnobConfig = {
  label: 'Pitch LFO Rate',
  defaultValue: 0.01,
  curve: 5,
  snapIncrement: 0,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      const freqHz = state.val * 100 + 0.1;
      sampler.pitchLFO?.setFrequency(freqHz);
    });
  },
};

const pitchLFODepthConfig: KnobConfig = {
  label: 'Pitch LFO Depth',
  defaultValue: 0.0,
  curve: 1.5,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      const scaledDepth = state.val / 10;
      sampler.pitchLFO?.setDepth(scaledDepth);
    });
  },
};

const volumeConfig: KnobConfig = {
  label: 'Volume',
  defaultValue: 0.75,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      if (sampler?.volume !== undefined) {
        sampler.volume = state.val;
      }
    });
  },
};

const reverbSendConfig: KnobConfig = {
  label: 'Reverb Send',
  defaultValue: 0,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      sampler.sendToFx('reverb', state.val);
    });
  },
};

const reverbSizeConfig: KnobConfig = {
  label: 'Reverb Size',
  defaultValue: 0.5,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      sampler.setReverbAmount(state.val);
    });
  },
};

const loopDurationDriftConfig: KnobConfig = {
  label: 'Loop Drift',
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  curve: 1.5,
  snapIncrement: 0.001,
  valueFormatter: (v: number) => `${(v * 100).toFixed(1)}%`,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setLoopDurationDriftAmount(state.val));
  },
};

const lowpassFilterConfig: KnobConfig = {
  label: 'LPF',
  defaultValue: 18000,
  minValue: 20,
  maxValue: 20000,
  curve: 5,
  valueFormatter: (v: number) => `${v.toFixed(0)} Hz`,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setLpfCutoff(state.val));
  },
};

const highpassFilterConfig: KnobConfig = {
  label: 'HPF',
  defaultValue: 40,
  minValue: 20,
  maxValue: 20000,
  curve: 5,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setHpfCutoff(state.val));
  },
};

const amplitudeModConfig: KnobConfig = {
  label: 'AM',
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 1,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setModulationAmount('AM', state.val));
  },
};

const trimStartConfig: KnobConfig = {
  label: 'Start',
  defaultValue: 0,
  snapIncrement: 0.001,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      sampler.setSampleStartPoint(state.val);
    });
  },
  onKnobElementReady: (knobElement, state, sampler) => {
    if (!sampler) return;

    const initDuration = sampler.sampleDuration;
    if (initDuration >= 0) {
      knobElement.setAttribute('max-value', initDuration.toString());
    }

    sampler.onMessage('sample:loaded', (msg: any) => {
      try {
        knobElement.setAttribute('max-value', msg.durationSeconds.toString());

        if (state.val > msg.durationSeconds) {
          state.val = msg.durationSeconds;
          knobElement.setValue(msg.durationSeconds, true);
        }
      } catch (error) {
        console.error('Failed to update loop duration knob:', error);
      }
    });
  },
};

const trimEndConfig: KnobConfig = {
  label: 'End',
  defaultValue: 1,
  snapIncrement: 0.001,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      sampler.setSampleEndPoint(state.val);
    });
  },
  onKnobElementReady: (knobElement, state, sampler) => {
    if (!sampler) return;

    const initDuration = sampler.sampleDuration;
    if (initDuration >= 0) {
      knobElement.setAttribute('max-value', initDuration.toString());
      knobElement.setAttribute('default-value', initDuration.toString());
    }

    sampler.onMessage('sample:loaded', (msg: any) => {
      try {
        knobElement.setAttribute('max-value', msg.durationSeconds.toString());

        if (state.val > msg.durationSeconds) {
          state.val = msg.durationSeconds;
          knobElement.setValue(msg.durationSeconds, true);
        }
      } catch (error) {
        console.error('Failed to update loop duration knob:', error);
      }
    });
  },
};

const loopStartConfig: KnobConfig = {
  label: 'Loop Start',
  defaultValue: 0,
  snapIncrement: 0.001,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      sampler.setLoopStart(state.val);
    });
  },
};

const loopDurationConfig: KnobConfig = {
  label: 'Loop Length',
  defaultValue: 1,
  minValue: 0,
  maxValue: 1,
  curve: 4,
  snapIncrement: 0,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => {
      sampler.setLoopDuration(state.val);
    });
  },
  onKnobElementReady: (knobElement, state, sampler) => {
    if (!sampler) return;

    sampler.onMessage('sample:loaded', (msg: any) => {
      try {
        knobElement.setAttribute('max-value', msg.durationSeconds.toString());

        if (state.val > msg.durationSeconds) {
          state.val = msg.durationSeconds;
          knobElement.setValue(msg.durationSeconds, true);
        }
      } catch (error) {
        console.error('Failed to update loop duration knob:', error);
      }
    });
  },
};

// ===== EXPORTED KNOB COMPONENTS =====

export const DryWetKnob = createKnob(
  dryWetConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const FeedbackKnob = createKnob(
  feedbackConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const DriveKnob = createKnob(
  driveConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const ClippingKnob = createKnob(
  clippingConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const GlideKnob = createKnob(
  glideConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const FeedbackPitchKnob = createKnob(
  feedbackPitchConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const FeedbackDecayKnob = createKnob(
  feedbackDecayConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const GainLFORateKnob = createKnob(
  gainLFORateConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const GainLFODepthKnob = createKnob(
  gainLFODepthConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const PitchLFORateKnob = createKnob(
  pitchLFORateConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const PitchLFODepthKnob = createKnob(
  pitchLFODepthConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const VolumeKnob = createKnob(
  volumeConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const ReverbSendKnob = createKnob(
  reverbSendConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const ReverbSizeKnob = createKnob(
  reverbSizeConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const LoopDurationDriftKnob = createKnob(
  loopDurationDriftConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const LowpassFilterKnob = createKnob(
  lowpassFilterConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const HighpassFilterKnob = createKnob(
  highpassFilterConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const AMModKnob = createKnob(
  amplitudeModConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const LoopStartKnob = createKnob(
  loopStartConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const LoopDurationKnob = createKnob(
  loopDurationConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const TrimStartKnob = createKnob(
  trimStartConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

export const TrimEndKnob = createKnob(
  trimEndConfig,
  getSampler,
  createLabeledKnob,
  van,
  INLINE_COMPONENT_STYLE
);

// // ===== SHARED KNOB STATE REGISTRY =====
// const knobStates = new Map<string, any>();
// const getKnobState = (key: string) => knobStates.get(key);
// const setKnobState = (key: string, state: any) => knobStates.set(key, state);
