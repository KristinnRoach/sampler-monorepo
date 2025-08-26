// component-utils.ts - Shared utilities for components
import { type SamplePlayer } from '@repo/audiolib';
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { createKnob, KnobConfig } from '@/elements/primitives/createKnob';
import { INLINE_COMPONENT_STYLE } from '../../shared/styles/component-styles';

const { div } = van.tags;

/**
 * Find the target node ID for a component.
 * Follows the priority: explicit target-node-id > parent sampler > nearest sampler
 */
export const findNodeId =
  (attributes: ElementProps, targetNodeId: State<string>) => () => {
    if (targetNodeId.val) return targetNodeId.val;

    // Find parent sampler-element
    const parent = attributes.$this.closest('sampler-element') as any;
    if (parent?.nodeId) return parent.nodeId;

    // Find nearest sampler-element and check both nodeId property and node-id attribute
    const nearest = document.querySelector('sampler-element') as any;
    if (nearest?.nodeId) return nearest.nodeId;

    // Fallback to node-id attribute
    return nearest?.getAttribute('node-id') || '';
  };

/**
 * Creates a reusable connection handler for sampler components
 */
export const createSamplerConnection = (
  findNodeId: () => string,
  getSampler: (nodeId: string) => any,
  onConnect: (sampler: SamplePlayer) => void
) => {
  let connected = false;

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      onConnect(sampler);
    }
  };

  const createMountHandler = (attributes: ElementProps) => {
    return () => {
      // Try to connect immediately
      connect();

      // Listen for sampler-initialized events
      const handleSamplerInitialized = (e: CustomEvent) => {
        if (e.detail.nodeId === findNodeId()) connect();
      };
      document.addEventListener(
        'sampler-initialized',
        handleSamplerInitialized as EventListener
      );

      // Also try connecting periodically for timing issues
      const interval = setInterval(() => {
        if (!connected) connect();
      }, 100);

      return () => {
        document.removeEventListener(
          'sampler-initialized',
          handleSamplerInitialized as EventListener
        );
        clearInterval(interval);
      };
    };
  };

  return { connect, createMountHandler };
};

/**
 * Configuration for a toggle component
 */
export interface ToggleConfig {
  label?: string;
  defaultValue: boolean;
  onColor?: string;
  offText: string;
  onText: string;
  onSamplerConnect?: (sampler: any, state: State<boolean>, van: any) => void;
}

/**
 * Generic factory for creating toggle components
 */
export const createToggle = (
  config: ToggleConfig,
  getTargetNode: (nodeId: string) => any,
  Toggle: any,
  van: any,
  componentStyle?: string
) => {
  const { div } = van.tags;

  return (attributes: ElementProps) => {
    const targetNodeId: State<string> = attributes.attr('target-node-id', '');
    const toggleState = van.state(config.defaultValue);
    let connected = false;

    const findId = findNodeId(attributes, targetNodeId);

    const connect = () => {
      if (connected) return;
      const nodeId = findId();
      if (!nodeId) return;
      const sampler = getTargetNode(nodeId);
      if (sampler) {
        connected = true;
        config.onSamplerConnect?.(sampler, toggleState, van);
      }
    };

    attributes.mount(() => {
      connect();
      const handleInitialized = (e: CustomEvent) => {
        if (e.detail.nodeId === findId()) connect();
      };
      document.addEventListener(
        'sampler-initialized',
        handleInitialized as EventListener
      );
      return () =>
        document.removeEventListener(
          'sampler-initialized',
          handleInitialized as EventListener
        );
    });

    // // Check if label attribute was explicitly provided (even if empty)
    // const hasLabelAttribute = attributes.$this.hasAttribute('label');
    // const labelOverride = hasLabelAttribute
    //   ? attributes.$this.getAttribute('label')
    //   : null;

    // // Use label attribute if provided (including empty string), otherwise fall back to config label
    // const effectiveLabel = hasLabelAttribute ? labelOverride : config.label;

    return div(
      { style: componentStyle || '' },

      Toggle({
        on: toggleState.val,
        size: 0.9,
        onColor: config.onColor || '#4CAF50',
        onChange: () => (toggleState.val = !toggleState.val),
      }),
      div(() => (toggleState.val ? config.onText : config.offText))
    );
  };
};

export const createKnobForTarget = (
  config: KnobConfig,
  getTarget: (nodeId: string) => any
) => {
  return (attributes: ElementProps) => {
    const targetNodeId = attributes.attr('target-node-id', '');
    const findId = findNodeId(attributes, targetNodeId);

    // Initialize state with default value
    const state = van.state(config.defaultValue ?? 0);

    // Check if label attribute was explicitly provided (even if empty)
    const hasLabelAttribute = attributes.$this.hasAttribute('label');
    const rawLabel = hasLabelAttribute
      ? attributes.$this.getAttribute('label')
      : undefined;
    const labelOverride = rawLabel === null ? undefined : rawLabel;

    // Use label attribute if provided (including empty string), otherwise fall back to config label
    const effectiveLabel = hasLabelAttribute ? labelOverride : config.label;

    let connected = false;
    let knobContainer: HTMLElement | null = null;
    let isInitializing = true; // Flag to prevent saving during initialization

    // Storage functions
    const getStorageKey = (nodeId: string) => {
      const key = config.paramName || config.label || 'unknown';
      return `${key}:nodeId:${nodeId}`;
    };

    const loadStoredValue = (nodeId: string) => {
      if (!config.useLocalStorage || !nodeId) return false;

      const storageKey = getStorageKey(nodeId);
      const stored = localStorage.getItem(storageKey);

      // if (config.label === 'Volume') {
      //   console.log('📦 Attempting to load from key:', storageKey);
      //   console.debug('📦 Found stored value:', stored);
      // }

      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed)) {
          // if (config.label === 'Volume') {
          //   console.debug('📦 Setting state.val to:', parsed);
          // }

          state.val = parsed;

          // Update the knob element
          const knobElement = knobContainer?.querySelector(
            'knob-element'
          ) as any;
          if (knobElement?.setValue) {
            knobElement.setValue(parsed);
          }

          return true;
        }
      }
      return false;
    };

    const saveValue = (value: number, nodeId: string) => {
      if (!config.useLocalStorage || !nodeId || isInitializing) {
        return;
      }

      try {
        const storageKey = getStorageKey(nodeId);
        localStorage.setItem(storageKey, String(value));
      } catch (error) {
        console.warn('Failed to save knob value to localStorage:', error);
      }
    };

    const connect = () => {
      if (connected) return;
      const nodeId = findId();

      // if (config.label === 'Volume') {
      //   console.debug('🔍 connect() called with nodeId:', nodeId);
      // }

      if (!nodeId) {
        // if (config.label === 'Volume') {
        //   console.debug('❌ No nodeId found, cannot connect');
        // }
        return;
      }

      const target = getTarget(nodeId);

      // if (config.label === 'Volume') {
      //   console.debug('🎯 getTarget returned:', target);
      // }

      if (target) {
        // Load stored value BEFORE connecting
        loadStoredValue(nodeId);

        connected = true;

        const knobElement = knobContainer?.querySelector('knob-element');
        config.onConnect?.(target, state, knobElement);

        // Now that we're connected, allow saving
        setTimeout(() => {
          isInitializing = false;
          // if (config.label === 'Volume') {
          //   console.debug('✅ Initialization complete, saving enabled');
          // }
        }, 100);
      } else {
        // if (config.label === 'Volume') {
        //   console.debug('❌ Target not found for nodeId:', nodeId);
        // }
      }
    };

    // Mount debugic
    attributes.mount(() => {
      // if (config.label === 'Volume') {
      //   console.debug('🔌 Volume knob mounted, attempting initial connection');
      // }

      connect();

      const handleInit = (e: CustomEvent) => {
        // if (config.label === 'Volume') {
        //   console.debug(
        //     '📢 sampler-initialized event:',
        //     e.detail.nodeId,
        //     'looking for:',
        //     findId()
        //   );
        // }

        if (e.detail.nodeId === findId()) {
          // if (config.label === 'Volume') {
          //   console.debug('✅ Matching sampler-initialized event, connecting');
          // }
          connect();
        }
      };

      document.addEventListener(
        'sampler-initialized',
        handleInit as EventListener
      );

      return () => {
        document.removeEventListener(
          'sampler-initialized',
          handleInit as EventListener
        );
      };
    });

    // if (config.label === 'Volume') {
    //   console.log('🎯 createKnobForTarget initial state.val:', state.val);
    // }

    // Create knob with simplified config - NO internal storage handling
    knobContainer = createKnob(
      {
        ...config,
        label: effectiveLabel,
        useLocalStorage: false, // Disable internal storage
        state,
        onChange: (value) => {
          state.val = value;

          // Save to storage ourselves (but not during initialization)
          const nodeId = findId();
          if (nodeId) {
            saveValue(value, nodeId);
          }

          config.onChange?.(value);
        },
      },
      '' // Empty nodeId since we handle storage ourselves
    );

    return div({ style: INLINE_COMPONENT_STYLE || '' }, knobContainer);
  };
};

// export const createKnobForTarget = (
//   config: KnobConfig,
//   getTarget: (nodeId: string) => any
// ) => {
//   return (attributes: ElementProps) => {
//     const targetNodeId = attributes.attr('target-node-id', '');
//     const findId = findNodeId(attributes, targetNodeId);

//     const getStoredValue = () => {
//       if (!config.useLocalStorage || !config.paramName) {
//         return config.defaultValue ?? 0;
//       }

//       const nodeId = findId();
//       if (!nodeId) return config.defaultValue ?? 0;

//       const storageKey = `${config.paramName || config.label || 'unknown'}:nodeId:${nodeId}`;
//       const stored = localStorage.getItem(storageKey);

//       if (stored) {
//         const parsed = parseFloat(stored);
//         if (!isNaN(parsed)) return parsed;
//       }

//       return config.defaultValue ?? 0;
//     };

//     const state = van.state(getStoredValue());

//     let connected = false;
//     let knobContainer: HTMLElement | null = null; // Store reference

//     const connect = () => {
//       if (connected) return;
//       const nodeId = findId();
//       if (!nodeId) return;
//       const target = getTarget(nodeId);
//       if (target) {
//         connected = true;

//         const knobElement = knobContainer?.querySelector('knob-element');
//         config.onConnect?.(target, state, knobElement);
//       }
//     };

//     // Mount logic
//     attributes.mount(() => {
//       connect();
//       const handleInit = (e: CustomEvent) => {
//         if (e.detail.nodeId === findId()) connect();
//       };
//       document.addEventListener(
//         'sampler-initialized',
//         handleInit as EventListener
//       );
//       return () =>
//         document.removeEventListener(
//           'sampler-initialized',
//           handleInit as EventListener
//         );
//     });

//     if (config.label === 'Volume') {
//       console.log(
//         '🎯 createKnobForTarget with state:',
//         state,
//         'state.val:',
//         state.val
//       );
//     }

//     knobContainer = createKnob(
//       {
//         ...config,
//         state,
//         onChange: (value) => {
//           state.val = value;
//           config.onChange?.(value);
//         },
//       },
//       findId()
//     );

//     // Create knob with simplified config
//     return div({ style: INLINE_COMPONENT_STYLE || '' }, knobContainer);
//   };
// };

// export const createKnobForTarget = (
//   config: KnobConfig,
//   getTargetNode: (nodeId: string) => any,
//   van: any,
//   componentStyle?: string
// ) => {
//   return (attributes: ElementProps) => {
//     const targetNodeId: State<string> = attributes.attr('target-node-id', '');
//     const value = van.state(config.defaultValue);
//     let connected = false;

//     const getId = findNodeId(attributes, targetNodeId);

//     const connect = () => {
//       if (connected) return;
//       const nodeId = getId();
//       if (!nodeId) return;
//       const target = getTargetNode(nodeId);
//       if (target) {
//         try {
//           connected = true;
//           config.onTargetConnect?.(target, value, van);

//           if (config.onKnobElementReady) {
//             const actualKnobElement =
//               knobElement?.querySelector('knob-element');
//             if (actualKnobElement) {
//               config.onKnobElementReady(actualKnobElement, value, target);
//             }
//           }
//         } catch (error) {
//           connected = false;
//           console.error(
//             `Failed to connect knob "${config.label || 'unnamed'}":`,
//             error
//           );
//         }
//       }
//     };

//     attributes.mount(() => {
//       connect();
//       const handleReady = (e: CustomEvent) => {
//         if (e.detail.nodeId === getId()) connect();
//       };
//       document.addEventListener(
//         'sampler-initialized',
//         handleReady as EventListener
//       );
//       return () =>
//         document.removeEventListener(
//           'sampler-initialized',
//           handleReady as EventListener
//         );
//     });

//     // Check if label attribute was explicitly provided (even if empty)
//     const hasLabelAttribute = attributes.$this.hasAttribute('label');
//     const rawLabel = hasLabelAttribute
//       ? attributes.$this.getAttribute('label')
//       : undefined;
//     const labelOverride = rawLabel === null ? undefined : rawLabel;

//     // Use label attribute if provided (including empty string), otherwise fall back to config label
//     const effectiveLabel = hasLabelAttribute ? labelOverride : config.label;

//     const knobElement = createLabeledKnob({
//       label: effectiveLabel,
//       defaultValue: config.defaultValue,
//       minValue: config.minValue,
//       maxValue: config.maxValue,
//       allowedValues: config.allowedValues,
//       curve: config.curve,
//       snapIncrement: config.snapIncrement,
//       valueFormatter: config.valueFormatter,
//       onChange: (v: number) => (value.val = v),
//     });

//     // Apply component style if provided
//     if (componentStyle) {
//       const wrapper = document.createElement('div');
//       wrapper.style.cssText = componentStyle;
//       wrapper.appendChild(knobElement);
//       return wrapper;
//     }

//     return knobElement;
//   };
// };

// /**
//  * Configuration for a knob component
//  */
// export interface KnobConfig {
//   label?: string;
//   defaultValue: number;
//   minValue?: number;
//   maxValue?: number;
//   paramName?: string; // Used as key for local storage
//   useLocalStorage?: boolean;
//   allowedValues?: number[];
//   curve?: number;
//   snapIncrement?: number;
//   valueFormatter?: (value: number) => string;
//   onTargetConnect?: (
//     target: SamplePlayer,
//     state: State<number>,
//     van: any
//   ) => void;
//   onKnobElementReady?: (
//     knobElement: any,
//     state: State<number>,
//     target?: SamplePlayer
//   ) => void;
// }
