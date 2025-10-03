// src/frameworks/react/reactEntry.ts

// Import types to ensure they're registered
import './types';

// Export the main component
export { KnobComponent } from './primitives/knob/KnobComponent';

// Export types for consumers
export type { KnobComponentProps } from './primitives/knob/KnobComponent';

// Re-export preset types and props from SolidJS (they're framework-agnostic)
export type { KnobPresetKey } from '../solidjs/primitives/knob/KnobPresets';
export { KnobPresetProps } from '../solidjs/primitives/knob/KnobPresets';

export type {
  KnobConfig,
  KnobChangeEventDetail,
} from '../../elements/primitives/KnobElement';

// Re-export the core element class for advanced usage
export { KnobElement } from '../../elements/primitives/KnobElement';
