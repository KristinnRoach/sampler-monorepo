// Export base classes
export { BaseAudioElement } from './base/BaseAudioElement';

// Export elements
import { SamplerElement } from './elements/SamplerElement';
import { OutputElement } from './elements/OutputElement';

export { SamplerElement, OutputElement };

// Define custom elements
if (typeof window !== 'undefined') {
  // Only register if in browser environment
  if (!customElements.get('sampler-element')) {
    customElements.define('sampler-element', SamplerElement);
  }

  if (!customElements.get('output-element')) {
    customElements.define('output-element', OutputElement);
  }
}

// Function to register all components
export function registerComponents() {
  if (typeof window !== 'undefined') {
    if (!customElements.get('sampler-element')) {
      customElements.define('sampler-element', SamplerElement);
    }

    if (!customElements.get('output-element')) {
      customElements.define('output-element', OutputElement);
    }
  }
}
