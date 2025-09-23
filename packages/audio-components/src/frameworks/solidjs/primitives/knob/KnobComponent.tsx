// src/frameworks/solidjs/KnobComponent.tsx
import {
  Component,
  createEffect,
  onMount,
  onCleanup,
  mergeProps,
  Show,
} from 'solid-js';

import {
  KnobElement,
  KnobConfig,
  KnobChangeEventDetail,
} from '../../../../elements/primitives/KnobElement';

export interface KnobComponentProps extends Partial<KnobConfig> {
  preset?: Partial<KnobConfig>;

  // Visual props
  width?: number;
  knobColor?: string;
  labelColor?: string;

  // Value props
  value?: number;

  // Label
  label?: string;
  labelClass?: string; // allow styling override

  // Event handlers
  onChange?: (detail: KnobChangeEventDetail) => void;

  // Standard HTML props
  class?: string;
  style?: string | Record<string, string>;
  ref?: (el: KnobElement) => void;
}

const DEFAULT_KNOB_PROPS: Partial<KnobConfig> = {
  minValue: 0,
  maxValue: 1,
  defaultValue: 0,
  snapIncrement: 0.001,
  minRotation: -150,
  maxRotation: 150,
  curve: 1,
  disabled: false,
  borderStyle: 'currentState' as const,
};

/**
 * SolidJS wrapper component for KnobElement web component
 */
export const KnobComponent: Component<KnobComponentProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let knobInstance: KnobElement;

  // Set up default props
  const merged = mergeProps(DEFAULT_KNOB_PROPS, props.preset ?? {}, props);

  // Support style as object as well as string
  const getStyleString = (
    style: string | Record<string, string> | undefined
  ) => {
    if (!style) return undefined;
    if (typeof style === 'string') return style;
    return Object.entries(style)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  };

  onMount(() => {
    if (!customElements.get('knob-element')) {
      throw new Error('knob-element not registered. Import KnobElement first.');
    }

    knobInstance = document.createElement('knob-element') as KnobElement;
    updateKnobAttributes();

    const handleChange = (e: CustomEvent<KnobChangeEventDetail>) => {
      merged.onChange?.(e.detail);
    };
    knobInstance.addEventListener('knob-change', handleChange as EventListener);

    if (containerRef) {
      containerRef.appendChild(knobInstance);
    }

    merged.ref?.(knobInstance);

    if (merged.value !== undefined && merged.value !== merged.defaultValue) {
      requestAnimationFrame(() => {
        knobInstance.setValue(merged.value!);
      });
    }

    onCleanup(() => {
      knobInstance.removeEventListener(
        'knob-change',
        handleChange as EventListener
      );
      knobInstance.remove();
    });
  });

  const updateVisualAttributes = () => {
    if (!knobInstance) return;
    try {
      if (merged.width)
        knobInstance.setAttribute('width', merged.width.toString());
      if (merged.knobColor)
        knobInstance.setAttribute('color', merged.knobColor);
      if (merged.disabled) {
        knobInstance.setAttribute('disabled', '');
      } else {
        knobInstance.removeAttribute('disabled');
      }
    } catch (error) {
      console.warn('Failed to update visual attributes:', error);
    }
  };

  const updateValueAttributes = () => {
    if (!knobInstance) return;
    try {
      knobInstance.setAttribute('min-value', (merged.minValue ?? 0).toString());
      knobInstance.setAttribute('max-value', (merged.maxValue ?? 1).toString());
      knobInstance.setAttribute(
        'default-value',
        (merged.defaultValue ?? 0).toString()
      );
      knobInstance.setAttribute(
        'snap-increment',
        (merged.snapIncrement ?? 0.001).toString()
      );
      knobInstance.setAttribute(
        'min-rotation',
        (merged.minRotation ?? -150).toString()
      );
      knobInstance.setAttribute(
        'max-rotation',
        (merged.maxRotation ?? 150).toString()
      );

      if (merged.curve !== undefined) {
        knobInstance.setAttribute('curve', merged.curve.toString());
      }
      if (merged.borderStyle) {
        knobInstance.setAttribute('border-style', merged.borderStyle);
      }
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
    } catch (error) {
      console.warn('Failed to update value attributes:', error);
    }
  };

  const updateKnobAttributes = () => {
    updateVisualAttributes();
    updateValueAttributes();
  };

  createEffect(() => {
    if (!knobInstance) return;
    updateVisualAttributes();
  });

  createEffect(() => {
    if (!knobInstance) return;
    updateValueAttributes();
  });

  createEffect(() => {
    if (!knobInstance || merged.value === undefined) return;
    knobInstance.setValue(merged.value);
  });

  return (
    <div class={merged.class} style={getStyleString(merged.style)}>
      <Show when={merged.label}>
        <div class={merged.labelClass ?? 'knob-label'}>{merged.label}</div>
      </Show>
      <div ref={containerRef!} />
    </div>
  );
};

export default KnobComponent;
