// Export base classes
export { BaseAudioElement } from './elements/base/BaseAudioElement';

// Import and export audio elements
import { SamplerElement } from './elements/SamplerElement';
import { SampleLoaderElement } from './elements/SampleLoaderElement';
import { OutputElement } from './elements/OutputElement';
import { RecorderElement } from './elements/RecorderElement';
import { EnvelopeElement } from './elements/EnvelopeElement'; // Add this line

export { SamplerElement, SampleLoaderElement, OutputElement, RecorderElement };

// Web component definitions
const COMPONENTS = [
  ['sampler-element', SamplerElement],
  ['sample-loader-element', SampleLoaderElement],
  ['output-element', OutputElement],
  ['recorder-element', RecorderElement],
  ['envelope-element', EnvelopeElement],
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
