import type {
  EnvelopeType,
  KnobChangeEventDetail,
  KnobElement,
} from '@repo/audiolib';

export interface TimeScaleKnobConfig {
  onChange: (data: { envelopeType: EnvelopeType; timeScale: number }) => void;
  envelopeType: EnvelopeType;
  width?: number;
  height?: number;
}

/**
 * Creates a time scale knob for envelope duration scaling
 */
export const TimeScaleKnob = ({
  onChange,
  envelopeType,
  width = 25,
  height = 25,
}: TimeScaleKnobConfig): HTMLElement => {
  const container = document.createElement('div');
  container.classList.add('envelope-time-scale-knob');
  container.style = 'display: inline-block; place-content: center;';

  const knobElement = document.createElement('knob-element') as KnobElement;
  knobElement.title = 'Envelope speed';
  Object.entries({
    'min-value': 1, // todo: fix so halftime (0.5) works
    'max-value': 100,
    'default-value': 1,
    'snap-increment': 1,
    width,
    height,
    curve: 2.5,
    color: 'rgb(234, 234, 234)',
  }).forEach(([key, value]) => knobElement.setAttribute(key, value.toString()));
  container.appendChild(knobElement);

  const valueDisplay = document.createElement('div');
  valueDisplay.textContent = `Speed: ${knobElement.getValue().toFixed(0)}`;
  valueDisplay.style.cssText =
    'font-size: 10px; color: #aaa; margin-top: 4px; width: 10ch;';
  container.appendChild(valueDisplay);

  knobElement.addEventListener('knob-change', (event) => {
    const timeScale = (event as CustomEvent<KnobChangeEventDetail>).detail
      .value;
    valueDisplay.textContent = `Speed: ${timeScale.toFixed(0)}`;
    onChange({ envelopeType, timeScale });
  });
  knobElement.setValue(1);

  return container;
};
