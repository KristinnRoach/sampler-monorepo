// src/frameworks/solidjs/KnobComponent.tsx
import {
  Component,
  createEffect,
  onMount,
  onCleanup,
  mergeProps,
  Show,
  createSignal,
} from 'solid-js';

import {
  KnobElement,
  KnobConfig,
  KnobChangeEventDetail,
  createKnobElement,
} from '../../../../elements/primitives/KnobElement';

import { KnobPresetProps, KnobPresetKey } from '../../../shared/KnobPresets';

export interface KnobComponentProps extends Partial<KnobConfig> {
  preset?: KnobPresetKey;
  size?: number;
  color?: string;
  value?: number;
  onChange?: (detail: KnobChangeEventDetail) => void;
  ref?: (el: KnobElement) => void;

  // Value display props
  displayValue?: boolean;
  valueFormatter?: (value: number) => string;

  // Snap configuration
  snapThresholds?: Array<{ maxValue: number; increment: number }>;
  allowedValues?: number[];

  // Tooltip support
  title?: string;

  // Style props
  label?: string;
  class?: string; // Applied to root container
  labelClass?: string; // Applied to label
  knobClass?: string; // Applied to knob element
  valueClass?: string; // Applied to value display
  style?: string | Record<string, string>;
  labelStyle?: string | Record<string, string>;
  valueStyle?: string | Record<string, string>;
}

export const KnobComponent: Component<KnobComponentProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let knobInstance: KnobElement | undefined;

  // Track current value for display
  const [currentValue, setCurrentValue] = createSignal(0);

  // Merge defaults, preset config, and props (props override preset and defaults)
  const merged = mergeProps(
    { displayValue: true, size: 45 }, // Default values
    props.preset ? KnobPresetProps[props.preset] : {},
    props
  );

  onMount(() => {
    if (!containerRef) return;

    // Pass merged config to factory, converting size to width
    const knobOptions = {
      ...merged,
      width: merged.size, // Factory expects 'width'
      snapThresholds: merged.snapThresholds,
      allowedValues: merged.allowedValues,
    };

    knobInstance = createKnobElement(containerRef, knobOptions);

    // Apply knobClass if provided
    if (props.knobClass) {
      knobInstance.classList.add(...props.knobClass.split(' '));
    }

    const handleChange = (e: CustomEvent<KnobChangeEventDetail>) => {
      setCurrentValue(e.detail.value);
      props.onChange?.(e.detail);
    };

    knobInstance.addEventListener('knob-change', handleChange as EventListener);
    props.ref?.(knobInstance);

    // Set initial value for display
    setCurrentValue(merged.value ?? merged.defaultValue ?? 0);

    onCleanup(() => {
      knobInstance?.removeEventListener(
        'knob-change',
        handleChange as EventListener
      );
    });
  });

  createEffect(() => {
    if (knobInstance && merged.value !== undefined) {
      knobInstance.setValue(merged.value);
    }
  });

  // Default label styles
  const defaultLabelStyle = {
    'text-align': 'center',
    'margin-bottom': '4px',
  };

  // Merge default label styles with user-provided labelStyle
  const combinedLabelStyle = {
    ...defaultLabelStyle,
    ...(typeof merged.labelStyle === 'string' ? {} : merged.labelStyle || {}),
  };

  // Convert to string if needed
  const labelStyleString =
    typeof merged.labelStyle === 'string'
      ? `text-align: center; margin-bottom: 4px; ${merged.labelStyle}`
      : Object.entries(combinedLabelStyle)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');

  // Default value styles
  const defaultValueStyle = {
    'font-size': '10px',
    'text-align': 'center',
    color: '#999',
    'margin-top': '4px',
  };

  // Merge default value styles with user-provided valueStyle
  const combinedValueStyle = {
    ...defaultValueStyle,
    ...(typeof merged.valueStyle === 'string' ? {} : merged.valueStyle || {}),
  };

  // Convert to string if needed
  const valueStyleString =
    typeof merged.valueStyle === 'string'
      ? `font-size: 10px; text-align: center; color: #999; ${merged.valueStyle}`
      : Object.entries(combinedValueStyle)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');

  // Default formatter if none provided
  const formatter = merged.valueFormatter || ((v: number) => v.toFixed(2));

  return (
    <Show
      when={merged.label || merged.displayValue}
      fallback={<div ref={containerRef!} title={merged.title} />}
    >
      <div
        class={merged.class || 'knob-container'}
        style={merged.style}
        title={merged.title}
      >
        <Show when={merged.label}>
          <div
            class={merged.labelClass || 'knob-label'}
            style={labelStyleString}
          >
            {merged.label}
          </div>
        </Show>
        <div ref={containerRef!} />
        <Show when={merged.displayValue}>
          <div
            class={merged.valueClass || 'knob-value'}
            style={valueStyleString}
          >
            {formatter(currentValue())}
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default KnobComponent;

// export interface KnobComponentProps extends Partial<KnobConfig> {
//   preset?: KnobPresetKey;

//   // Visual props
//   width?: number;
//   knobColor?: string;
//   labelColor?: string;

//   // Value props
//   value?: number;

//   // Label
//   label?: string;
//   labelClass?: string;

//   // Event handlers
//   onChange?: (detail: KnobChangeEventDetail) => void;

//   // Standard HTML props
//   class?: string;
//   style?: string | Record<string, string>;
//   ref?: (el: KnobElement) => void;
// }

// const DEFAULT_KNOB_PROPS: Partial<KnobConfig> = {
//   minValue: 0,
//   maxValue: 1,
//   defaultValue: 0,
//   snapIncrement: 0.001,
//   minRotation: -150,
//   maxRotation: 150,
//   curve: 1,
//   disabled: false,
//   borderStyle: 'currentState' as const,
// };

// /**
//  * SolidJS wrapper component for KnobElement web component
//  */
// export const KnobComponent: Component<KnobComponentProps> = (props) => {
//   let containerRef: HTMLDivElement | undefined;
//   let knobInstance: KnobElement;

//   // Set up default props
//   const presetConfig = props.preset ? KnobPresetProps[props.preset] : {};
//   const merged = mergeProps(DEFAULT_KNOB_PROPS, presetConfig, props);

//   // Calculate the effective knob size for label styling
//   const getKnobSize = () => {
//     // Default knob size from CSS custom property or fallback
//     const defaultSize = 120;
//     return merged.width || defaultSize;
//   };

//   // Generate label styles that scale with knob size
//   const getLabelStyle = () => {
//     const knobSize = getKnobSize();
//     // Scale font size proportionally to knob size (adjust multiplier as needed)
//     const fontSize = Math.max(10, knobSize * 0.2); // Min 10px, ~20% of knob size
//     const color = merged.labelColor || 'inherit';

//     return {
//       'font-size': `${fontSize}px`,
//       color: color,
//       'text-align': 'center',
//       'white-space': 'nowrap',
//     };
//   };

//   // Support style as object as well as string
//   const getStyleString = (
//     style: string | Record<string, string> | undefined
//   ) => {
//     if (!style) return undefined;
//     if (typeof style === 'string') return style;
//     return Object.entries(style)
//       .map(([key, value]) => `${key}: ${value}`)
//       .join('; ');
//   };

//   onMount(() => {
//     if (!customElements.get('knob-element')) {
//       throw new Error('knob-element not registered. Import KnobElement first.');
//     }

//     knobInstance = document.createElement('knob-element') as KnobElement;
//     updateKnobAttributes();

//     const handleChange = (e: CustomEvent<KnobChangeEventDetail>) => {
//       merged.onChange?.(e.detail);
//     };
//     knobInstance.addEventListener('knob-change', handleChange as EventListener);

//     if (containerRef) {
//       containerRef.appendChild(knobInstance);
//     }

//     merged.ref?.(knobInstance);

//     if (merged.value !== undefined && merged.value !== merged.defaultValue) {
//       requestAnimationFrame(() => {
//         knobInstance.setValue(merged.value!);
//       });
//     }

//     onCleanup(() => {
//       knobInstance.removeEventListener(
//         'knob-change',
//         handleChange as EventListener
//       );
//       knobInstance.remove();
//     });
//   });

//   const updateVisualAttributes = () => {
//     if (!knobInstance) return;
//     try {
//       if (merged.width)
//         knobInstance.setAttribute('width', merged.width.toString());
//       if (merged.knobColor)
//         knobInstance.setAttribute('color', merged.knobColor);
//       if (merged.disabled) {
//         knobInstance.setAttribute('disabled', '');
//       } else {
//         knobInstance.removeAttribute('disabled');
//       }
//     } catch (error) {
//       console.warn('Failed to update visual attributes:', error);
//     }
//   };

//   const updateValueAttributes = () => {
//     if (!knobInstance) return;
//     try {
//       knobInstance.setAttribute('min-value', (merged.minValue ?? 0).toString());
//       knobInstance.setAttribute('max-value', (merged.maxValue ?? 1).toString());
//       knobInstance.setAttribute(
//         'default-value',
//         (merged.defaultValue ?? 0).toString()
//       );
//       knobInstance.setAttribute(
//         'snap-increment',
//         (merged.snapIncrement ?? 0.001).toString()
//       );
//       knobInstance.setAttribute(
//         'min-rotation',
//         (merged.minRotation ?? -150).toString()
//       );
//       knobInstance.setAttribute(
//         'max-rotation',
//         (merged.maxRotation ?? 150).toString()
//       );

//       if (merged.curve !== undefined) {
//         knobInstance.setAttribute('curve', merged.curve.toString());
//       }
//       if (merged.borderStyle) {
//         knobInstance.setAttribute('border-style', merged.borderStyle);
//       }
//       if (merged.allowedValues) {
//         knobInstance.setAttribute(
//           'allowed-values',
//           JSON.stringify(merged.allowedValues)
//         );
//       }
//       if (merged.snapThresholds) {
//         knobInstance.setAttribute(
//           'snap-thresholds',
//           JSON.stringify(merged.snapThresholds)
//         );
//       }
//     } catch (error) {
//       console.warn('Failed to update value attributes:', error);
//     }
//   };

//   const updateKnobAttributes = () => {
//     updateVisualAttributes();
//     updateValueAttributes();
//   };

//   createEffect(() => {
//     if (!knobInstance) return;
//     updateVisualAttributes();
//   });

//   createEffect(() => {
//     if (!knobInstance) return;
//     updateValueAttributes();
//   });

//   createEffect(() => {
//     if (!knobInstance || merged.value === undefined) return;
//     knobInstance.setValue(merged.value);
//   });

//   // Note: Label styles are automatically reactive through getLabelStyle()
//   // which reads merged.width and merged.labelColor

//   return (
//     <div
//       class={merged.class}
//       style={
//         typeof merged.style === 'string'
//           ? `${getStyleString({ display: 'block', gap: '8px' })}; ${merged.style}`
//           : getStyleString({
//               display: 'block',
//               gap: '8px',
//               ...(merged.style ?? {}),
//             })
//       }
//     >
//       <Show when={merged.label}>
//         <div
//           class={merged.labelClass ?? 'knob-label'}
//           style={getStyleString(getLabelStyle())}
//         >
//           {merged.label}
//         </div>
//       </Show>
//       <div ref={containerRef!} /> {/* Container for the knob-element */}
//     </div>
//   );
// };

// export default KnobComponent;
