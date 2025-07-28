// envelopeTimeScaleKnob.ts
import { EnvelopeType } from '@repo/audiolib';
import {
  createLabeledKnob,
  type KnobConfig,
  type LabeledKnobConfig,
} from '../../primitives/createKnob';

export interface TimeScaleKnobConfig extends KnobConfig {
  onChange: (data: { envelopeType: EnvelopeType; timeScale: number }) => void;
  envelopeType: EnvelopeType;
}

const knobDefaults: Partial<TimeScaleKnobConfig> = {
  minValue: 0.5, // todo: Test min/max value constraints (in CustomEnvelope)
  maxValue: 100,
  defaultValue: 1,
  snapIncrement: 1,
  curve: 3.5,
  snapThresholds: [{ maxValue: 1.0, increment: 0.1 }],
  className: 'envelope-time-scale-knob',
  title: `Time scale`,
};

/**
 * Creates a time scale knob for envelope duration scaling
 */
export const LabeledTimeScaleKnob = (
  config: TimeScaleKnobConfig & { label?: string }
): HTMLElement => {
  const {
    onChange: onTimeScaleChange,
    envelopeType,
    label = 'Time Scale',
    ...knobConfig
  } = config;

  const labeledKnobDefaults: Partial<LabeledKnobConfig> = {
    minValue: 0.5,
    maxValue: 120,
    defaultValue: 1,
    snapIncrement: 1,
    curve: 4,
    snapThresholds: [
      { maxValue: 0.5, increment: 0.5 },
      { maxValue: 1.0, increment: 0.1 },
      { maxValue: 10, increment: 0.5 },
      { maxValue: 100, increment: 1 },
    ],
    className: 'envelope-time-scale-knob',
    title: `Time scale (${config.minValue || 0.1}x - ${config.maxValue || 180}x)`,
    valueFormatter: (v) => `${v.toFixed(1)}x`,
  };

  return createLabeledKnob({
    ...knobDefaults,
    ...labeledKnobDefaults,
    ...knobConfig,
    label,
    onChange: (timeScale) => onTimeScaleChange({ envelopeType, timeScale }),
  });
};

// export const TimeScaleKnob = (config: TimeScaleKnobConfig): HTMLElement => {
//   const { onTimeScaleChange, envelopeType, ...knobConfig } = config;

//   const knobDefaults: Partial<KnobConfig> = {
//     minValue: 0.5, // todo: Test min/max value constraints (in CustomEnvelope)
//     maxValue: 100,
//     defaultValue: 1,
//     snapIncrement: 1,
//     curve: 3.5,
//     snapThresholds: [{ maxValue: 1.0, increment: 0.1 }],
//     className: 'envelope-time-scale-knob',
//     title: `Time scale (${config.minValue || 0.1}x - ${config.maxValue || 180}x)`,
//   };

//   return createKnob({
//     ...knobDefaults,
//     ...knobConfig,
//     onChange: (value: number) => onTimeScaleChange(envelopeType, value),
//   });
// };
