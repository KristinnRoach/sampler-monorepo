// Export base classes
export { BaseAudioElement } from './elements/base/BaseAudioElement';

// Export elements
import { SamplerElement } from './elements/SamplerElement';
import { SampleLoaderElement } from './elements/SampleLoaderElement';
import { OutputElement } from './elements/OutputElement';
import { RecorderElement } from './elements/RecorderElement';

export { SamplerElement, SampleLoaderElement, RecorderElement, OutputElement };

// Function to register all components
export function registerComponents() {
  if (typeof window !== 'undefined') {
    // Only register if in browser environment
    if (!customElements.get('sampler-element')) {
      customElements.define('sampler-element', SamplerElement);
    }

    if (!customElements.get('sample-loader-element')) {
      customElements.define('sample-loader-element', SampleLoaderElement);
    }

    if (!customElements.get('output-element')) {
      customElements.define('output-element', OutputElement);
    }

    if (!customElements.get('recorder-element')) {
      customElements.define('recorder-element', RecorderElement);
    }
  }
}
