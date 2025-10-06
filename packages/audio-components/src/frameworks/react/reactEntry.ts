// src/frameworks/react/reactEntry.ts

// Import types to ensure they're registered
import './types';

// Force import of custom elements to ensure they're registered
import '../../elements/OscilloscopeElement';

// Export the main component
export { KnobComponent } from './primitives/knob/KnobComponent';
export { OscilloscopeComponent } from './primitives/OscilloScopeComponent';

// Export types for consumers
export type { KnobComponentProps } from './primitives/knob/KnobComponent';
export type { OscilloscopeComponentProps } from './primitives/OscilloScopeComponent';

// Re-export preset types and props from SolidJS (they're framework-agnostic)
export type { KnobPresetKey } from '../shared/KnobPresets';
export { KnobPresetProps } from '../shared/KnobPresets';

export type {
  KnobConfig,
  KnobChangeEventDetail,
} from '../../elements/primitives/KnobElement';

// Re-export the core element class for advanced usage
export { KnobElement } from '../../elements/primitives/KnobElement';
export { OscilloscopeElement } from '../../elements/OscilloscopeElement';
