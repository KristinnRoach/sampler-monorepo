// src/frameworks/solidjs/types.ts
import { JSX } from 'solid-js';

import { KnobChangeEventDetail } from '../../elements/primitives/KnobElement';

// Extend SolidJS JSX namespace for direct knob-element usage
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'knob-element': {
        // Value configuration
        'min-value'?: string | number;
        'max-value'?: string | number;
        'default-value'?: string | number;
        value?: string | number;

        // Snapping configuration
        'snap-increment'?: string | number;
        'allowed-values'?: string; // JSON string
        'snap-thresholds'?: string; // JSON string

        // Rotation configuration
        'min-rotation'?: string | number;
        'max-rotation'?: string | number;

        // Visual configuration
        width?: string | number;
        height?: string | number;
        color?: string;
        'border-style'?: 'currentState' | 'fullCircle';
        curve?: string | number;

        // State
        disabled?: boolean | '';

        // Event handlers (SolidJS style)
        'onknob-change'?: JSX.EventHandlerUnion<
          HTMLElement,
          CustomEvent<KnobChangeEventDetail>
        >;
        'on:knob-change'?: JSX.EventHandlerUnion<
          HTMLElement,
          CustomEvent<KnobChangeEventDetail>
        >;

        // Standard HTML attributes
        ref?: HTMLElement | ((el: HTMLElement) => void);
        class?: string;
        classList?: { [k: string]: boolean | undefined };
        style?: JSX.CSSProperties | string;
        id?: string;

        // ARIA attributes for accessibility
        'aria-label'?: string;
        'aria-valuemin'?: string | number;
        'aria-valuemax'?: string | number;
        'aria-valuenow'?: string | number;
        'aria-valuetext'?: string;
        role?: string;
      };
    }
  }
}

// Re-export types from core for convenience
export type {
  KnobConfig,
  KnobChangeEventDetail,
} from '../../elements/primitives/KnobElement';

export type { KnobComponentProps } from './primitives/knob/KnobComponent';
