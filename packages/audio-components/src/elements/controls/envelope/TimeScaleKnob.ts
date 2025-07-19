// envelopeTimeScaleKnob.ts
import { EnvelopeType } from '@repo/audiolib';
import {
  createKnob,
  createLabeledKnob,
  type KnobConfig,
  type LabeledKnobConfig,
} from '../../primitives/createKnob';

export interface TimeScaleKnobConfig {
  onTimeScaleChange: (envType: EnvelopeType, timeScale: number) => void;
  envelopeType: EnvelopeType;
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
  snapIncrement?: number;
  width?: number;
  height?: number;
  curve?: number;
  snapThresholds?: Array<{ maxValue: number; increment: number }>;
}

/**
 * Creates a time scale knob for envelope duration scaling
 */
export const TimeScaleKnob = (config: TimeScaleKnobConfig): HTMLElement => {
  const { onTimeScaleChange, envelopeType, ...knobConfig } = config;

  const knobDefaults: Partial<KnobConfig> = {
    minValue: 0.1,
    maxValue: 180,
    defaultValue: 1,
    snapIncrement: 1,
    curve: 3.5,
    snapThresholds: [{ maxValue: 1.0, increment: 0.1 }],
    className: 'envelope-time-scale-knob',
    title: `Time scale (${config.minValue || 0.1}x - ${config.maxValue || 180}x)`,
  };

  return createKnob({
    ...knobDefaults,
    ...knobConfig,
    onChange: (value: number) => onTimeScaleChange(envelopeType, value),
  });
};

/**
 * Creates a labeled time scale knob with value display
 */
export const LabeledTimeScaleKnob = (
  config: TimeScaleKnobConfig & { label?: string }
): HTMLElement => {
  const {
    onTimeScaleChange,
    envelopeType,
    label = 'Time Scale',
    ...knobConfig
  } = config;

  const labeledKnobDefaults: Partial<LabeledKnobConfig> = {
    minValue: 0.1,
    maxValue: 180,
    defaultValue: 1,
    snapIncrement: 1,
    curve: 3.5,
    snapThresholds: [{ maxValue: 1.0, increment: 0.1 }],
    className: 'envelope-time-scale-knob',
    title: `Time scale (${config.minValue || 0.1}x - ${config.maxValue || 180}x)`,
    valueFormatter: (v) => `${v.toFixed(1)}x`,
  };

  return createLabeledKnob({
    ...labeledKnobDefaults,
    ...knobConfig,
    label,
    onChange: (value) => onTimeScaleChange(envelopeType, value),
  });
};

// // envelopeTimeScaleKnob.ts
// import { defineElement } from '../../elementRegistry.ts';
// import { EnvelopeType } from '@repo/audiolib';

// import {
//   KnobElement,
//   type KnobChangeEventDetail,
// } from '../../primitives/KnobElement.ts';

// export interface TimeScaleKnobConfig {
//   onTimeScaleChange: (envType: EnvelopeType, timeScale: number) => void;
//   envelopeType: EnvelopeType;
//   minValue?: number;
//   maxValue?: number;
//   defaultValue?: number;
//   snapIncrement?: number;
//   width?: number;
//   height?: number;
//   curve?: number;
//   snapThresholds?: Array<{ maxValue: number; increment: number }>;
// }

// /**
//  * Creates a time scale knob for envelope duration scaling
//  */
// export const TimeScaleKnob = (config: TimeScaleKnobConfig): HTMLElement => {
//   const {
//     onTimeScaleChange,
//     envelopeType,
//     minValue = 0.1,
//     maxValue = 180,
//     defaultValue = 1,
//     snapIncrement = 1,
//     width = 45,
//     height = 45,
//     curve = 3.5,
//     // Below values of 1.0 use 0.1, above 1 use default snapIncrement
//     snapThresholds = [{ maxValue: 1.0, increment: 0.1 }],
//   } = config;

//   // Ensure knob element is defined
//   defineElement('knob-element', KnobElement);

//   // Create the knob element
//   const knobElement = document.createElement('knob-element') as HTMLElement;

//   // Set attributes
//   knobElement.setAttribute('min-value', minValue.toString());
//   knobElement.setAttribute('max-value', maxValue.toString());
//   knobElement.setAttribute('snap-increment', snapIncrement.toString());
//   knobElement.setAttribute('snap-thresholds', JSON.stringify(snapThresholds));
//   knobElement.setAttribute('width', width.toString());
//   knobElement.setAttribute('height', height.toString());
//   knobElement.setAttribute('default-value', defaultValue.toString());
//   knobElement.setAttribute('curve', curve.toString());

//   knobElement.className = 'envelope-time-scale-knob';

//   // Add title/tooltip
//   knobElement.title = `Time scale (${minValue}x - ${maxValue}x)`;

//   // Add change event listener
//   knobElement.addEventListener('knob-change', (e: CustomEvent) => {
//     const msg: KnobChangeEventDetail = e.detail;
//     onTimeScaleChange(envelopeType, msg.value);
//   });

//   return knobElement;
// };

// /**
//  * Optional: Create a labeled knob with text display
//  */
// export const LabeledTimeScaleKnob = (
//   config: TimeScaleKnobConfig & { label?: string }
// ): HTMLElement => {
//   const { label = 'Time Scale' } = config;

//   const container = document.createElement('div');
//   container.style.cssText = `
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 4px;
//     font-size: 12px;
//     color: #ccc;
//   `;

//   const labelElement = document.createElement('div');
//   labelElement.textContent = label;
//   labelElement.style.textAlign = 'center';

//   const knob = TimeScaleKnob(config);

//   const valueDisplay = document.createElement('div');
//   valueDisplay.textContent = `${config.defaultValue || 1}x`;
//   valueDisplay.style.cssText = `
//     font-size: 10px;
//     color: #999;
//     text-align: center;
//   `;

//   // Update value display when knob changes
//   knob.addEventListener('knob-change', (e: CustomEvent) => {
//     const msg: KnobChangeEventDetail = e.detail;
//     valueDisplay.textContent = `${msg.value.toFixed(1)}x`;
//   });

//   container.appendChild(labelElement);
//   container.appendChild(knob);
//   container.appendChild(valueDisplay);

//   return container;
// };
