// src/frameworks/react/types.ts
import { ComponentProps } from 'react';
import { KnobChangeEventDetail } from '../../elements/primitives/KnobElement';

// Extend React JSX namespace for direct knob-element usage
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'knob-element': ComponentProps<'div'> & {
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
        disabled?: boolean;

        // Event handlers (React style)
        onknobchange?: (event: CustomEvent<KnobChangeEventDetail>) => void;
        'onknob-change'?: (event: CustomEvent<KnobChangeEventDetail>) => void;

        // Standard HTML attributes
        ref?: React.Ref<HTMLElement>;
        className?: string;
        style?: React.CSSProperties;
        title?: string;
        id?: string;
        tabIndex?: number;
        role?: string;
        'aria-label'?: string;
        'aria-valuemin'?: number;
        'aria-valuemax'?: number;
        'aria-valuenow'?: number;
      };

      'oscilloscope-element': ComponentProps<'div'> & {
        ref?: React.Ref<HTMLElement>;
        className?: string;
        style?: React.CSSProperties;
        'aria-orientation'?: 'horizontal' | 'vertical';
        'data-testid'?: string;
      };
    }
  }
}

// Export empty object to make this a module
export {};
