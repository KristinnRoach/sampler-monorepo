// src/frameworks/solidjs/KnobComponent.tsx
import {
  Component,
  createEffect,
  onMount,
  onCleanup,
  mergeProps,
} from 'solid-js';
import {
  KnobElement,
  KnobConfig,
  KnobChangeEventDetail,
} from '../../../../elements/primitives/KnobElement';

export interface KnobComponentProps extends Partial<KnobConfig> {
  // Visual props
  width?: number;
  height?: number;
  color?: string;

  // Value props
  value?: number;

  // Event handlers
  onChange?: (detail: KnobChangeEventDetail) => void;

  // Standard HTML props
  class?: string;
  style?: string | Record<string, string>;
  ref?: (el: KnobElement) => void;
}

/**
 * SolidJS wrapper component for KnobElement web component
 */
export const KnobComponent: Component<KnobComponentProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let knobInstance: KnobElement;

  // Set up default props
  const merged = mergeProps(
    {
      minValue: 0,
      maxValue: 100,
      defaultValue: 0,
      snapIncrement: 1,
      minRotation: -150,
      maxRotation: 150,
      curve: 1,
      disabled: false,
      borderStyle: 'currentState' as const,
    },
    props
  );

  onMount(() => {
    // Create the knob element
    knobInstance = document.createElement('knob-element') as KnobElement;

    // Apply initial configuration
    updateKnobAttributes();

    // Add event listener
    const handleChange = (e: CustomEvent<KnobChangeEventDetail>) => {
      merged.onChange?.(e.detail);
    };

    knobInstance.addEventListener('knob-change', handleChange as EventListener);

    // Append to container
    if (containerRef) {
      containerRef.appendChild(knobInstance);
    }

    // Call ref callback if provided
    merged.ref?.(knobInstance);

    // Set initial value if different from default
    if (merged.value !== undefined && merged.value !== merged.defaultValue) {
      requestAnimationFrame(() => {
        knobInstance.setValue(merged.value!);
      });
    }

    // Cleanup function
    onCleanup(() => {
      knobInstance.removeEventListener(
        'knob-change',
        handleChange as EventListener
      );
      knobInstance.remove();
    });
  });

  // Function to update knob attributes
  const updateKnobAttributes = () => {
    if (!knobInstance) return;

    // Core value attributes
    knobInstance.setAttribute('min-value', merged.minValue.toString());
    knobInstance.setAttribute('max-value', merged.maxValue.toString());
    knobInstance.setAttribute('default-value', merged.defaultValue.toString());
    knobInstance.setAttribute(
      'snap-increment',
      merged.snapIncrement.toString()
    );

    // Rotation attributes
    knobInstance.setAttribute('min-rotation', merged.minRotation.toString());
    knobInstance.setAttribute('max-rotation', merged.maxRotation.toString());

    // Visual attributes
    if (merged.width)
      knobInstance.setAttribute('width', merged.width.toString());
    if (merged.height)
      knobInstance.setAttribute('height', merged.height.toString());
    if (merged.color) knobInstance.setAttribute('color', merged.color);
    if (merged.curve !== undefined)
      knobInstance.setAttribute('curve', merged.curve.toString());
    if (merged.borderStyle)
      knobInstance.setAttribute('border-style', merged.borderStyle);

    // State attributes
    if (merged.disabled) {
      knobInstance.setAttribute('disabled', '');
    } else {
      knobInstance.removeAttribute('disabled');
    }

    // Complex attributes (JSON)
    if (merged.allowedValues) {
      knobInstance.setAttribute(
        'allowed-values',
        JSON.stringify(merged.allowedValues)
      );
    }
    if (merged.snapThresholds) {
      knobInstance.setAttribute(
        'snap-thresholds',
        JSON.stringify(merged.snapThresholds)
      );
    }
  };

  // React to prop changes
  createEffect(() => {
    if (!knobInstance) return;
    updateKnobAttributes();
  });

  // React to value changes
  createEffect(() => {
    if (!knobInstance || merged.value === undefined) return;
    knobInstance.setValue(merged.value);
  });

  return (
    <div
      ref={containerRef!}
      class={merged.class}
      style={typeof merged.style === 'string' ? merged.style : undefined}
    />
  );
};

// Export default for convenience
export default KnobComponent;
