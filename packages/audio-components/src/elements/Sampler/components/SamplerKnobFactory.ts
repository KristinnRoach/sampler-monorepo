// KnobFactory.ts
import van from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';
import { createKnobForTarget } from '../../../shared/utils/component-utils';
import { KnobConfig } from '../../primitives/createKnob';

// ===== KNOB CONFIGURATIONS =====

const volumeConfig: KnobConfig = {
  label: 'Volume',
  defaultValue: 0.75,
  useLocalStorage: true,
  onConnect: (sampler, state) => {
    // console.debug('📍 onConnect: Setting sampler.volume to', state.val);
    setTimeout(() => {
      van.derive(() => {
        if (sampler?.volume !== undefined) {
          sampler.volume = state.val;
        }
      });
    }, 0);
  },
};

const dryWetConfig: KnobConfig = {
  label: 'Dry/Wet',
  useLocalStorage: true,
  defaultValue: 0.5,
  onConnect: (sampler, state) => {
    van.derive(() => {
      sampler.setDryWetMix({ dry: 1 - state.val, wet: state.val });
    });
  },
};

const feedbackConfig: KnobConfig = {
  label: 'Feedback',
  useLocalStorage: true,
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setFeedbackAmount(state.val));
  },
};

const distortionConfig: KnobConfig = {
  label: 'Distortion',
  useLocalStorage: true,
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  curve: 1.5,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.outputBus.setDistortionMacro(state.val));
  },
};

const driveConfig: KnobConfig = {
  label: 'Drive',
  useLocalStorage: true,
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.outputBus.setDrive(state.val));
  },
};

const clippingConfig: KnobConfig = {
  label: 'Clipping',
  useLocalStorage: true,
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.outputBus.setClippingMacro(state.val));
  },
};

const glideConfig: KnobConfig = {
  label: 'Glide',
  useLocalStorage: true,
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  snapIncrement: 0.001,
  curve: 1,
  valueFormatter: (v: number) => v.toFixed(3),
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setGlideTime(state.val));
  },
};

const feedbackPitchConfig: KnobConfig = {
  label: 'FB-Pitch',
  useLocalStorage: true,
  defaultValue: 1.0,
  minValue: 0.25,
  maxValue: 4,
  allowedValues: [0.25, 0.5, 1.0, 2.0, 3.0, 4.0],
  curve: 2,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setFeedbackPitchScale(state.val));
  },
};

const feedbackDecayConfig: KnobConfig = {
  label: 'FB-Decay',
  useLocalStorage: true,
  defaultValue: 0.75,
  minValue: 0.001,
  maxValue: 1,
  curve: 2,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setFeedbackDecay(state.val));
  },
};

const feedbackLpfConfig: KnobConfig = {
  label: 'FB-LPF',
  useLocalStorage: true,
  defaultValue: 10000,
  minValue: 400,
  maxValue: 16000,
  curve: 5,
  valueFormatter: (v: number) => `${v.toFixed(0)} Hz`,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setFeedbackLowpassCutoff(state.val));
  },
};

const gainLFORateConfig: KnobConfig = {
  label: 'Amp LFO Rate',
  useLocalStorage: true,
  defaultValue: 0.1,
  curve: 5,
  snapIncrement: 0,
  onConnect: (sampler, state) => {
    van.derive(() => {
      const freqHz = state.val * 100 + 0.1;
      sampler.gainLFO?.setFrequency(freqHz);
    });
  },
};

const gainLFODepthConfig: KnobConfig = {
  label: 'Amp LFO Depth',
  useLocalStorage: true,
  defaultValue: 0.0,
  curve: 1.5,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.gainLFO?.setDepth(state.val));
  },
};

const pitchLFORateConfig: KnobConfig = {
  label: 'Pitch LFO Rate',
  useLocalStorage: true,
  defaultValue: 0.01,
  curve: 5,
  snapIncrement: 0,
  onConnect: (sampler, state) => {
    van.derive(() => {
      const freqHz = state.val * 100 + 0.1;
      sampler.pitchLFO?.setFrequency(freqHz);
    });
  },
};

const pitchLFODepthConfig: KnobConfig = {
  label: 'Pitch LFO Depth',
  useLocalStorage: true,
  defaultValue: 0.0,
  curve: 1.5,
  onConnect: (sampler, state) => {
    van.derive(() => {
      const scaledDepth = state.val / 10;
      sampler.pitchLFO?.setDepth(scaledDepth);
    });
  },
};

const reverbSendConfig: KnobConfig = {
  label: 'Reverb Send',
  useLocalStorage: true,
  defaultValue: 0,
  onConnect: (sampler, state) => {
    van.derive(() => {
      sampler.sendToFx('reverb', state.val);
    });
  },
};

const reverbSizeConfig: KnobConfig = {
  label: 'Reverb Size',
  useLocalStorage: true,
  defaultValue: 0.5,
  curve: 1,
  onConnect: (sampler, state) => {
    van.derive(() => {
      sampler.setReverbAmount(state.val);
    });
  },
};

const loopDurationDriftConfig: KnobConfig = {
  label: 'Loop Drift',
  useLocalStorage: true,
  defaultValue: 0.0,
  minValue: 0,
  maxValue: 1,
  curve: 0.5,
  snapIncrement: 0.001,
  valueFormatter: (v: number) => `${(v * 100).toFixed(1)}%`,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setLoopDurationDriftAmount(state.val));
  },
};

const lowpassFilterConfig: KnobConfig = {
  label: 'LPF',
  useLocalStorage: true,
  defaultValue: 18000,
  minValue: 20,
  maxValue: 20000,
  curve: 5,
  valueFormatter: (v: number) => `${v.toFixed(0)} Hz`,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setLpfCutoff(state.val));
  },
};

const highpassFilterConfig: KnobConfig = {
  label: 'HPF',
  useLocalStorage: true,
  defaultValue: 40,
  minValue: 20,
  maxValue: 20000,
  curve: 5,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setHpfCutoff(state.val));
  },
};

const amplitudeModConfig: KnobConfig = {
  label: 'AM',
  useLocalStorage: true,
  defaultValue: 0,
  minValue: 0,
  maxValue: 1,
  curve: 1,
  onConnect: (sampler, state) => {
    van.derive(() => sampler.setModulationAmount('AM', state.val));
  },
};

const trimStartConfig: KnobConfig = {
  label: 'Start',
  useLocalStorage: true,
  defaultValue: 0,
  snapIncrement: 0.001,
  onConnect: (sampler, state, knobElement) => {
    if (knobElement) {
      const currentDuration = sampler.sampleDuration;
      if (currentDuration > 0) {
        knobElement.setAttribute('max-value', currentDuration.toString());
      }

      sampler.onMessage('sample:loaded', (msg: any) => {
        knobElement.setAttribute('max-value', msg.durationSeconds.toString());
        if (state.val > msg.durationSeconds) {
          state.val = 0;
          knobElement.setValue(0, true);
        }
      });
    }

    van.derive(() => {
      sampler.setSampleStartPoint(state.val);
    });
  },
};

const trimEndConfig: KnobConfig = {
  label: 'End',
  useLocalStorage: true,
  defaultValue: 1,
  snapIncrement: 0.001,
  onConnect: (sampler, state, knobElement) => {
    if (knobElement) {
      const currentDuration = sampler.sampleDuration;
      if (currentDuration > 0) {
        knobElement.setAttribute('max-value', currentDuration.toString());
        knobElement.setAttribute('default-value', currentDuration.toString());
      }

      sampler.onMessage('sample:loaded', (msg: any) => {
        knobElement.setAttribute('max-value', msg.durationSeconds.toString());
        knobElement.setAttribute(
          'default-value',
          msg.durationSeconds.toString()
        );
        if (state.val > msg.durationSeconds) {
          state.val = msg.durationSeconds;
          knobElement.setValue(msg.durationSeconds, true);
        }
      });
    }

    van.derive(() => {
      sampler.setSampleEndPoint(state.val);
    });
  },
};

const loopStartConfig: KnobConfig = {
  label: 'Loop Start',
  useLocalStorage: true,
  defaultValue: 0,
  minValue: 0,
  snapIncrement: 0.001,
  onConnect: (sampler, state, knobElement) => {
    if (knobElement) {
      const currentDuration = sampler.sampleDuration;
      if (currentDuration > 0) {
        knobElement.setAttribute('max-value', currentDuration.toString());
      }

      sampler.onMessage('sample:loaded', (msg: any) => {
        knobElement.setAttribute('max-value', msg.durationSeconds.toString());

        if (state.val > msg.durationSeconds) {
          state.val = 0;
          knobElement.setValue(0, true);
        }
      });
    }

    van.derive(() => {
      sampler.setLoopStart(state.val);
    });
  },
};

const loopDurationConfig: KnobConfig = {
  label: 'Loop Length',
  useLocalStorage: true,
  defaultValue: 1,
  minValue: 0,
  maxValue: 1,
  curve: 4,
  snapIncrement: 0,
  onConnect: (sampler, state, knobElement) => {
    if (knobElement) {
      const currentDuration = sampler.sampleDuration;

      if (currentDuration > 0) {
        knobElement.setAttribute('max-value', currentDuration.toString());
        knobElement.setAttribute('default-value', currentDuration.toString());
      }

      const storedLoopEnd = Number(localStorage.getItem('loopEnd'));
      const storedLoopStart = Number(localStorage.getItem('loopStart'));
      const storedLoopDuration = storedLoopEnd - storedLoopStart;
      if (
        storedLoopDuration > 0 &&
        storedLoopDuration <= currentDuration - storedLoopStart
      ) {
        knobElement.setValue(storedLoopDuration);
      }

      sampler.onMessage('sample:loaded', (msg: any) => {
        knobElement.setAttribute('max-value', msg.durationSeconds.toString());
        knobElement.setAttribute(
          'default-value',
          msg.durationSeconds.toString()
        );
        if (state.val > msg.durationSeconds) {
          state.val = msg.durationSeconds;
          knobElement.setValue(msg.durationSeconds, true);
        }
      });
    }

    van.derive(() => {
      sampler.setLoopDuration(state.val);
    });
  },
};

// ===== EXPORTED KNOB COMPONENTS =====

export const VolumeKnob = createKnobForTarget(volumeConfig, getSampler);

export const DryWetKnob = createKnobForTarget(dryWetConfig, getSampler);

export const FeedbackKnob = createKnobForTarget(feedbackConfig, getSampler);

export const DistortionKnob = createKnobForTarget(distortionConfig, getSampler);

export const DriveKnob = createKnobForTarget(driveConfig, getSampler);

export const ClippingKnob = createKnobForTarget(clippingConfig, getSampler);

export const GlideKnob = createKnobForTarget(glideConfig, getSampler);

export const FeedbackPitchKnob = createKnobForTarget(
  feedbackPitchConfig,
  getSampler
);

export const FeedbackDecayKnob = createKnobForTarget(
  feedbackDecayConfig,
  getSampler
);

export const FeedbackLpfKnob = createKnobForTarget(
  feedbackLpfConfig,
  getSampler
);

export const GainLFORateKnob = createKnobForTarget(
  gainLFORateConfig,
  getSampler
);

export const GainLFODepthKnob = createKnobForTarget(
  gainLFODepthConfig,
  getSampler
);

export const PitchLFORateKnob = createKnobForTarget(
  pitchLFORateConfig,
  getSampler
);

export const PitchLFODepthKnob = createKnobForTarget(
  pitchLFODepthConfig,
  getSampler
);

export const ReverbSendKnob = createKnobForTarget(reverbSendConfig, getSampler);

export const ReverbSizeKnob = createKnobForTarget(reverbSizeConfig, getSampler);

export const LoopDurationDriftKnob = createKnobForTarget(
  loopDurationDriftConfig,
  getSampler
);

export const LowpassFilterKnob = createKnobForTarget(
  lowpassFilterConfig,
  getSampler
);

export const HighpassFilterKnob = createKnobForTarget(
  highpassFilterConfig,
  getSampler
);

export const AMModKnob = createKnobForTarget(amplitudeModConfig, getSampler);

export const LoopStartKnob = createKnobForTarget(loopStartConfig, getSampler);

export const LoopDurationKnob = createKnobForTarget(
  loopDurationConfig,
  getSampler
);

export const TrimStartKnob = createKnobForTarget(trimStartConfig, getSampler);

export const TrimEndKnob = createKnobForTarget(trimEndConfig, getSampler);

// // ===== SHARED KNOB STATE REGISTRY =====
// const knobStates = new Map<string, any>();
// const getKnobState = (key: string) => knobStates.get(key);
// const setKnobState = (key: string, state: any) => knobStates.set(key, state);
