// src/frameworks/react/primitives/knob/KnobComponent.tsx
/** @jsx React.createElement */
/** @jsxRuntime classic */
import React, { useEffect, useRef, useState, useCallback } from 'react';

import {
  KnobElement,
  KnobConfig,
  KnobChangeEventDetail,
  createKnobElement,
} from '../../../../elements/primitives/KnobElement';

import {
  KnobPresetProps,
  KnobPresetKey,
} from '../../../solidjs/primitives/knob/KnobPresets';

export interface KnobComponentProps extends Partial<KnobConfig> {
  preset?: KnobPresetKey;
  size?: number;
  color?: string;
  value?: number;
  onChange?: (detail: KnobChangeEventDetail) => void;
  ref?: React.Ref<KnobElement>;

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
  className?: string; // Applied to root container
  labelClassName?: string; // Applied to label
  knobClassName?: string; // Applied to knob element
  valueClassName?: string; // Applied to value display
  style?: React.CSSProperties | string;
  labelStyle?: React.CSSProperties;
  valueStyle?: React.CSSProperties;
}

export const KnobComponent = React.forwardRef<KnobElement, KnobComponentProps>(
  (props, ref): React.ReactElement => {
    const containerRef = useRef<HTMLDivElement>(null);
    const knobInstanceRef = useRef<KnobElement | null>(null);
    const [currentValue, setCurrentValue] = useState(
      () => props.value ?? props.defaultValue ?? 0
    );

    // Merge defaults, preset config, and props (props override preset and defaults)
    const merged = React.useMemo(
      () => ({
        displayValue: true,
        size: 45,
        ...(props.preset ? KnobPresetProps[props.preset] : {}),
        ...props,
      }),
      [props]
    );

    // Create knob instance once on mount
    useEffect(() => {
      if (!containerRef.current) return;

      // Create stable config object
      const config = {
        displayValue: true,
        size: 45,
        ...(props.preset ? KnobPresetProps[props.preset] : {}),
        ...props,
      };

      const knobOptions = {
        ...config,
        width: config.size, // Factory expects 'width'
        snapThresholds: config.snapThresholds,
        allowedValues: config.allowedValues,
      };

      const knobInstance = createKnobElement(containerRef.current, knobOptions);
      knobInstanceRef.current = knobInstance;

      // Apply knobClassName if provided
      if (props.knobClassName) {
        knobInstance.classList.add(...props.knobClassName.split(' '));
      }

      // Create event handler inside useEffect to avoid stale closures
      const handleChange = (e: CustomEvent<KnobChangeEventDetail>) => {
        setCurrentValue(e.detail.value);
        props.onChange?.(e.detail);
      };

      knobInstance.addEventListener(
        'knob-change',
        handleChange as EventListener
      );

      // Handle ref forwarding
      if (typeof ref === 'function') {
        ref(knobInstance);
      } else if (ref) {
        (ref as React.MutableRefObject<KnobElement>).current = knobInstance;
      }

      // Set initial value
      const initialValue = merged.value ?? merged.defaultValue ?? 0;
      setCurrentValue(initialValue);
      knobInstance.setValue(initialValue);

      return () => {
        knobInstance.removeEventListener(
          'knob-change',
          handleChange as EventListener
        );

        // Clean up the DOM by removing all children from the container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        knobInstanceRef.current = null;
      };
    }, []); // Empty dependency array - create only once

    // Update value when props.value changes (controlled component)
    useEffect(() => {
      if (
        knobInstanceRef.current &&
        props.value !== undefined &&
        props.value !== currentValue
      ) {
        knobInstanceRef.current.setValue(props.value);
        setCurrentValue(props.value);
      }
    }, [props.value, currentValue]);

    // Default label styles
    const defaultLabelStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '4px',
    };

    // Merge default label styles with user-provided labelStyle
    const combinedLabelStyle: React.CSSProperties = {
      ...defaultLabelStyle,
      ...(merged.labelStyle && typeof merged.labelStyle === 'object'
        ? merged.labelStyle
        : {}),
    };

    // Default value styles
    const defaultValueStyle: React.CSSProperties = {
      fontSize: '10px',
      textAlign: 'center',
      color: '#999',
      marginTop: '4px',
    };

    // Merge default value styles with user-provided valueStyle
    const combinedValueStyle: React.CSSProperties = {
      ...defaultValueStyle,
      ...(merged.valueStyle && typeof merged.valueStyle === 'object'
        ? merged.valueStyle
        : {}),
    };

    // Default formatter if none provided
    const formatter = merged.valueFormatter || ((v: number) => v.toFixed(2));

    // Simple render without label or value display
    if (!merged.label && !merged.displayValue) {
      return React.createElement('div', {
        ref: containerRef,
        title: merged.title,
      });
    }

    // Full render with label and/or value display
    return React.createElement(
      'div',
      {
        className: merged.className || 'knob-container',
        style: typeof merged.style === 'string' ? undefined : merged.style,
        title: merged.title,
      },
      [
        merged.label &&
          React.createElement(
            'div',
            {
              key: 'label',
              className: merged.labelClassName || 'knob-label',
              style: combinedLabelStyle,
            },
            merged.label
          ),
        React.createElement('div', {
          key: 'knob',
          ref: containerRef,
        }),
        merged.displayValue &&
          React.createElement(
            'div',
            {
              key: 'value',
              className: merged.valueClassName || 'knob-value',
              style: combinedValueStyle,
            },
            formatter(currentValue)
          ),
      ].filter(Boolean)
    );
  }
);

KnobComponent.displayName = 'KnobComponent';

export default KnobComponent;
