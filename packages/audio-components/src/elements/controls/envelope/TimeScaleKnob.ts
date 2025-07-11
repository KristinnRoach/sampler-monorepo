// envelopeTimeScaleKnob.ts
import { defineElement } from '../../elementRegistry.ts';
import {
  KnobElement,
  type KnobChangeEventDetail,
} from '../../primitives/KnobElement.ts';
import type { EnvelopeType } from '@repo/audiolib';

export interface TimeScaleKnobConfig {
  envelopeType: EnvelopeType;
  onTimeScaleChange: (envType: EnvelopeType, timeScale: number) => void;
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
  snapIncrement?: number;
  width?: number;
  height?: number;
}

/**
 * Creates a time scale knob for envelope duration scaling
 */
export const TimeScaleKnob = (config: TimeScaleKnobConfig): HTMLElement => {
  const {
    envelopeType,
    onTimeScaleChange,
    minValue = 0.1,
    maxValue = 10,
    defaultValue = 1,
    snapIncrement = 0.1,
    width = 45,
    height = 45,
  } = config;

  // Ensure knob element is defined
  defineElement('knob-element', KnobElement);

  // Create the knob element
  const knobElement = document.createElement('knob-element') as HTMLElement;

  // Set attributes
  knobElement.setAttribute('min-value', minValue.toString());
  knobElement.setAttribute('max-value', maxValue.toString());
  knobElement.setAttribute('snap-increment', snapIncrement.toString());
  knobElement.setAttribute('width', width.toString());
  knobElement.setAttribute('height', height.toString());
  knobElement.setAttribute('default-value', defaultValue.toString());

  // Add styling
  knobElement.style.marginTop = '10px';
  knobElement.className = 'envelope-time-scale-knob';

  // Add title/tooltip
  knobElement.title = `Time scale for ${envelopeType} envelope (${minValue}x - ${maxValue}x)`;

  // Add change event listener
  knobElement.addEventListener('knob-change', (e: CustomEvent) => {
    const msg: KnobChangeEventDetail = e.detail;
    onTimeScaleChange(envelopeType, msg.value);
  });

  return knobElement;
};

/**
 * Optional: Create a labeled knob with text display
 */
export const LabeledTimeScaleKnob = (
  config: TimeScaleKnobConfig & { label?: string }
): HTMLElement => {
  const { label = 'Time Scale' } = config;

  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #ccc;
  `;

  const labelElement = document.createElement('div');
  labelElement.textContent = label;
  labelElement.style.textAlign = 'center';

  const knob = TimeScaleKnob(config);

  const valueDisplay = document.createElement('div');
  valueDisplay.textContent = `${config.defaultValue || 1}x`;
  valueDisplay.style.cssText = `
    font-size: 10px;
    color: #999;
    text-align: center;
    min-width: 30px;
  `;

  // Update value display when knob changes
  knob.addEventListener('knob-change', (e: CustomEvent) => {
    const msg: KnobChangeEventDetail = e.detail;
    valueDisplay.textContent = `${msg.value.toFixed(1)}x`;
  });

  container.appendChild(labelElement);
  container.appendChild(knob);
  container.appendChild(valueDisplay);

  return container;
};
