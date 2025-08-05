// createKnob.ts
import { defineElement } from '../../elementRegistry';
import { KnobElement, type KnobChangeEventDetail } from './KnobElement';

export interface KnobConfig {
  onChange: (data: any) => void;
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
  allowedValues?: number[];
  snapIncrement?: number;
  width?: number;
  height?: number;
  curve?: number;
  snapThresholds?: Array<{ maxValue: number; increment: number }>;
  className?: string;
  title?: string;
}

/**
 * Creates a generic knob element
 */
export const createKnob = (config: KnobConfig): HTMLElement => {
  const {
    onChange,
    minValue = 0,
    maxValue = 1,
    defaultValue = 0.5,
    snapIncrement = 0.01,
    width = 45,
    height = 45,
    curve = 1,
    snapThresholds,
    allowedValues = undefined,
    className = 'generic-knob',
    title,
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
  knobElement.setAttribute('curve', curve.toString());

  if (snapThresholds) {
    knobElement.setAttribute('snap-thresholds', JSON.stringify(snapThresholds));
  }

  if (allowedValues) {
    knobElement.setAttribute('allowed-values', JSON.stringify(allowedValues));
  }

  knobElement.className = className;

  if (title) {
    knobElement.title = title;
  }

  // Add change event listener
  knobElement.addEventListener('knob-change', (e: CustomEvent) => {
    const msg: KnobChangeEventDetail = e.detail;
    onChange(msg.value);
  });

  return knobElement;
};

export interface LabeledKnobConfig extends KnobConfig {
  label?: string;
  valueFormatter?: (value: number) => string;
  showValue?: boolean;
}

/**
 * Creates a labeled knob with optional value display
 */
export const createLabeledKnob = (config: LabeledKnobConfig): HTMLElement => {
  const {
    label = 'Value',
    valueFormatter = (v) => v.toFixed(2),
    showValue = true,
    ...knobConfig
  } = config;

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

  const knob = createKnob(knobConfig);

  container.appendChild(labelElement);
  container.appendChild(knob);

  if (showValue) {
    const valueDisplay = document.createElement('div');
    valueDisplay.textContent = valueFormatter(knobConfig.defaultValue || 0);
    valueDisplay.style.cssText = `
      font-size: 10px;
      color: #999;
      text-align: center;
    `;

    // Update value display when knob changes
    knob.addEventListener('knob-change', (e: CustomEvent) => {
      const msg: KnobChangeEventDetail = e.detail;
      valueDisplay.textContent = valueFormatter(msg.value);
    });

    container.appendChild(valueDisplay);
  }

  return container;
};
