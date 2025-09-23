// createKnob.ts
import { defineElement } from '../../elementRegistry';
import { KnobElement, type KnobChangeEventDetail } from './KnobElement';
import van, { State } from '@repo/vanjs-core';

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export interface KnobConfig {
  // Core knob properties
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
  snapIncrement?: number;
  width?: number;
  height?: number;
  curve?: number;
  allowedValues?: number[];
  snapThresholds?: Array<{ maxValue: number; increment: number }>;

  color?: string;

  // State
  state?: State<number>; // Optional van state

  // UI properties
  label?: string;
  valueFormatter?: (value: number) => string;
  showValue?: boolean;
  className?: string;
  title?: string;

  // Storage properties
  paramName?: string;
  useLocalStorage?: boolean;

  // Callbacks
  onChange?: (value: any) => void;
  onConnect?: (target: any, state: any, knobElement?: any) => void;
  onStateReady?: (state: any) => void;
}

export const createKnob = (
  config: KnobConfig,
  nodeId?: string
): HTMLElement => {
  const {
    label,
    valueFormatter = (v) => v.toFixed(2),
    showValue = true,
    useLocalStorage = false,
    onChange,
    className = 'generic-knob',
  } = config;

  // Create container
  const container = document.createElement('div');
  container.classList.add(className);
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: ${config.color ?? '#ccc'}; 
  `;

  // Create label
  if (label) {
    const labelElement = document.createElement('div');
    labelElement.textContent = label;
    labelElement.style.cssText = `text-align: center; cursor: pointer; color: ${config.color ?? '#ccc'};`;
    labelElement.addEventListener('dblclick', () => {
      knobElement.setValue?.(config.defaultValue || 0, true);
    });
    container.appendChild(labelElement);
  }

  // Ensure knob element is defined
  defineElement('knob-element', KnobElement);

  // Create knob element
  const knobElement = document.createElement('knob-element') as any;

  // Set all knob properties
  Object.entries({
    'min-value': config.minValue ?? 0,
    'max-value': config.maxValue ?? 1,
    'default-value': config.defaultValue ?? 0.5,
    'snap-increment': config.snapIncrement ?? 0.01,
    width: config.width ?? 45,
    height: config.height ?? 45,
    curve: config.curve ?? 1,
    color: config.color ?? 'rgb(234, 234, 234)',
  }).forEach(([key, value]) => {
    knobElement.setAttribute(key, value.toString());
  });

  if (config.snapThresholds) {
    knobElement.setAttribute(
      'snap-thresholds',
      JSON.stringify(config.snapThresholds)
    );
  }
  if (config.allowedValues) {
    knobElement.setAttribute(
      'allowed-values',
      JSON.stringify(config.allowedValues)
    );
  }

  container.appendChild(knobElement);

  // Handle storage
  const getStorageKey = () => {
    let key = config.paramName || label || 'unkown-knob-value';
    if (nodeId) key += ':nodeId:' + nodeId;
    return key;
  };

  const getInitialValue = () => {
    const storageKey = getStorageKey();
    if (useLocalStorage && storageKey) {
      const stored = localStorage.getItem(storageKey);

      if (config.label === 'Volume') console.log('stored', stored);

      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return config.defaultValue ?? 0;
  };

  const initialValue = getInitialValue();

  const storeDebounced = debounce((key: string, val: string) => {
    try {
      localStorage.setItem(key, val);
    } catch {
      /* ignore quota/unavailable */
    }
  }, 200);

  knobElement.addEventListener('knob-change', (e: CustomEvent) => {
    const value = e.detail.value;

    if (config.state) {
      config.state.val = value;
    }

    // Save to localStorage if enabled
    const storageKey = getStorageKey();
    if (useLocalStorage && storageKey) {
      storeDebounced(storageKey, String(value));
    }

    onChange?.(value);
  });

  if (showValue) {
    const valueDisplay = document.createElement('div');
    valueDisplay.textContent = valueFormatter(initialValue);
    valueDisplay.style.cssText = `font-size: 10px; text-align: center; color: ${config.color ?? '#999'};`;
    container.appendChild(valueDisplay);

    knobElement.addEventListener('knob-change', (e: CustomEvent) => {
      valueDisplay.textContent = valueFormatter(e.detail.value);
    });
  }

  knobElement.setValue(initialValue);

  return container;
};

// export const createKnob = (config: KnobConfig): HTMLElement => {
//   const {
//     onChange,
//     minValue = 0,
//     maxValue = 1,
//     defaultValue = 0.5,
//     snapIncrement = 0.01,
//     width = 45,
//     height = 45,
//     curve = 1,
//     snapThresholds,
//     allowedValues = undefined,
//     className = 'generic-knob',
//     title,
//   } = config;

//   // Ensure knob element is defined
//   defineElement('knob-element', KnobElement);

//   // Create the knob element
//   const knobElement = document.createElement('knob-element') as HTMLElement & {
//     setValue?: (value: number, animate?: boolean) => void;
//   };

//   // Set attributes
//   knobElement.setAttribute('min-value', minValue.toString());
//   knobElement.setAttribute('max-value', maxValue.toString());
//   knobElement.setAttribute('snap-increment', snapIncrement.toString());
//   knobElement.setAttribute('width', width.toString());
//   knobElement.setAttribute('height', height.toString());
//   knobElement.setAttribute('default-value', defaultValue.toString());
//   knobElement.setAttribute('curve', curve.toString());

//   if (snapThresholds) {
//     knobElement.setAttribute('snap-thresholds', JSON.stringify(snapThresholds));
//   }

//   if (allowedValues) {
//     knobElement.setAttribute('allowed-values', JSON.stringify(allowedValues));
//   }

//   knobElement.className = className;

//   if (title) {
//     knobElement.title = title;
//   }

//   // Add change event listener
//   knobElement.addEventListener('knob-change', (e: CustomEvent) => {
//     const msg: KnobChangeEventDetail = e.detail;
//     onChange(msg.value);
//   });

//   // ! This does not work // TODO: make dblclick handler work EITHER in KnobElement or here if necessary
//   // Add double-click event handler to reset to default value
//   // knobElement.addEventListener('dblclick', (e) => {
//   //   console.debug('dblclick fired');
//   //   if (typeof knobElement.setValue === 'function') {
//   //     knobElement.setValue(defaultValue, true);
//   //   }
//   // });

//   return knobElement;
// };

// /**
//  * Creates a labeled knob with optional value display
//  */
// export const createLabeledKnob = (config: KnobConfig): HTMLElement => {
//   const {
//     label = 'Value',
//     valueFormatter = (v) => v.toFixed(2),
//     showValue = true,
//     paramName,
//     useLocalStorage = false,
//     ...knobConfig
//   } = config;

//   const container = document.createElement('div');
//   container.style.cssText = `
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 4px;
//     font-size: 12px;
//     color: #ccc;
//   `;

//   const knob = createKnob(knobConfig);
//   if (label !== '') {
//     const labelElement = document.createElement('div');
//     labelElement.textContent = label;
//     labelElement.style.textAlign = 'center';
//     labelElement.style.cursor = 'pointer';
//     labelElement.addEventListener('dblclick', (e) => {
//       if (typeof (knob as any).setValue === 'function') {
//         (knob as any).setValue(knobConfig.defaultValue || 0, true);
//       }
//     });
//     container.appendChild(labelElement);
//   }

//   container.appendChild(knob);

//   if (showValue) {
//     const valueDisplay = document.createElement('div');
//     valueDisplay.textContent = valueFormatter(knobConfig.defaultValue || 0);
//     valueDisplay.style.cssText = `
//       font-size: 10px;
//       color: #999;
//       text-align: center;
//     `;

//     // Update value display when knob changes
//     knob.addEventListener('knob-change', (e: CustomEvent) => {
//       const msg: KnobChangeEventDetail = e.detail;
//       valueDisplay.textContent = valueFormatter(msg.value);
//     });

//     container.appendChild(valueDisplay);
//   }

//   return container;
// };

// export interface KnobConfig {
//   onChange: (data: any) => void;
//   minValue?: number;
//   maxValue?: number;
//   defaultValue?: number;
//   paramName?: string; // Used as key for local storage
//   useLocalStorage?: boolean;
//   allowedValues?: number[];
//   snapIncrement?: number;
//   width?: number;
//   height?: number;
//   curve?: number;
//   snapThresholds?: Array<{ maxValue: number; increment: number }>;
//   className?: string;
//   title?: string;
// }

// export interface LabeledKnobConfig extends KnobConfig {
//   label?: string;
//   valueFormatter?: (value: number) => string;
//   showValue?: boolean;
// }
