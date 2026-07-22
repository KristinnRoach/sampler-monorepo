// envelopeTimeScaleKnob.ts
import { EnvelopeType } from '@repo/audiolib';
import { createKnob, type KnobConfig } from '../../primitives/createKnob';

export interface TimeScaleKnobConfig extends KnobConfig {
  onChange: (data: { envelopeType: EnvelopeType; timeScale: number }) => void;
  envelopeType: EnvelopeType;
}

/**
 * Creates a time scale knob for envelope duration scaling
 */
export const TimeScaleKnob = (
  config: TimeScaleKnobConfig & { label?: string }
): HTMLElement => {
  const {
    onChange: onTimeScaleChange,
    envelopeType,
    label = 'Time Scale',
    ...knobConfig
  } = config;

  const knobDefaults: Partial<KnobConfig> = {
    minValue: 1, // todo: fix so halftime (0.5) works
    maxValue: 100,
    defaultValue: 1,
    snapIncrement: 1,
    width: 25,
    height: 25,
    curve: 2.5,
    className: 'envelope-time-scale-knob',
  };

  const knob = createKnob({
    ...knobDefaults,
    ...knobDefaults,
    ...knobConfig,
    title: 'Envelope speed',
    onChange: (timeScale) => onTimeScaleChange({ envelopeType, timeScale }),
  });

  // Ensure knob displays inline with other controls
  knob.style.display = 'inline-block';

  return knob;
};
