// src/frameworks/solidjs/index.ts

// Import types to ensure they're registered
import './types';

// Export the main component
export { KnobComponent } from './primitives/knob/KnobComponent';

// Export types for consumers
export type { KnobComponentProps } from './primitives/knob/KnobComponent';

export type {
  KnobConfig,
  KnobChangeEventDetail,
} from '../../elements/primitives/KnobElement';

// Re-export the core element class for advanced usage
export { KnobElement } from '../../elements/primitives/KnobElement';
