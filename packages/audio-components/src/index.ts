// Import and export audio elements
import { BaseAudioElement } from './elements/base/BaseAudioElement';
import { SamplerElement } from './elements/SamplerElement';
import { SampleLoaderElement } from './elements/SampleLoaderElement';
import { RecorderElement } from './elements/RecorderElement';
import { EnvelopeElement } from './elements/EnvelopeElement';
import { LoopControlElement } from './elements/LoopControlElement';
import { StatusElement } from './elements/display/StatusElement';

export {
  SamplerElement,
  SampleLoaderElement,
  StatusElement,
  RecorderElement,
  EnvelopeElement,
  LoopControlElement,
  BaseAudioElement,
};

// Web component definitions
const COMPONENTS = [
  ['base-audio-element', BaseAudioElement],
  ['status-element', StatusElement],

  ['sampler-element', SamplerElement],
  ['sample-loader-element', SampleLoaderElement],
  ['recorder-element', RecorderElement],
  ['envelope-element', EnvelopeElement],
  ['loop-control-element', LoopControlElement],
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
