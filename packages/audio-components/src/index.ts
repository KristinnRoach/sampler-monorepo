// Import and export audio elements
import { BaseAudioElement } from './elements/base/BaseAudioElement';
import { SamplerElement } from './elements/SamplerElement';
import { SampleLoaderElement } from './elements/SampleLoaderElement';
import { RecorderElement } from './elements/RecorderElement';
import { EnvelopeElement } from './elements/EnvelopeElement';
import { LoopController } from './elements/LoopController';
import { SampleOffsetController } from './elements/SampleOffsetController';
import { StatusElement } from './elements/display/StatusElement';
import { TwoThumbSlider } from './elements/ui-core/TwoThumbSlider';
import { KnobElement } from './elements/ui-core/KnobElement';

export {
  SamplerElement,
  SampleLoaderElement,
  StatusElement,
  RecorderElement,
  EnvelopeElement,
  LoopController,
  SampleOffsetController,
  BaseAudioElement,
  TwoThumbSlider,
  KnobElement,
};

// Web component definitions
const COMPONENTS = [
  // basics
  ['status-element', StatusElement],
  ['two-thumb-slider', TwoThumbSlider],
  ['knob-element', KnobElement],

  // audiolib wrappers
  ['sampler-element', SamplerElement],
  ['sample-loader-element', SampleLoaderElement],
  ['recorder-element', RecorderElement],
  ['envelope-element', EnvelopeElement],
  ['loop-controller', LoopController],
  ['sample-offset-controller', SampleOffsetController],
] as const;

/**
 * Registers all audio components as custom elements if in browser environment
 * Each component is only registered if it hasn't been registered already
 */
export function registerComponents(): void {
  if (typeof window === 'undefined') return;

  COMPONENTS.forEach(([name, component]) => {
    if (!customElements.get(name)) {
      customElements.define(name, component);
    }
  });
}
