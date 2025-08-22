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
    let connected = false;

    const state = van.state(config.defaultValue || 0);
    let knobContainer: HTMLElement | null = null; // Store reference

    const connect = () => {
      if (connected) return;
      const nodeId = findId();
      if (!nodeId) return;
      const target = getTarget(nodeId);
      if (target) {
        connected = true;

        const knobElement = knobContainer?.querySelector('knob-element');
        config.onConnect?.(target, state, knobElement);
      }
    };

    // Mount logic
    attributes.mount(() => {
      connect();
      const handleInit = (e: CustomEvent) => {
        if (e.detail.nodeId === findId()) connect();
      };
      document.addEventListener(
        'sampler-initialized',
        handleInit as EventListener
      );
      return () =>
        document.removeEventListener(
          'sampler-initialized',
          handleInit as EventListener
        );
    });

    if (config.label === 'Volume') {
      console.log(
        '🎯 About to create knob with state:',
        state,
        'state.val:',
        state.val
      );
    }

    knobContainer = createKnob(
      {
        ...config,
        state,
        onChange: (value) => {
          state.val = value;
          config.onChange?.(value);
        },
      },
      findId()
    );

    // Create knob with simplified config
    return div({ style: INLINE_COMPONENT_STYLE || '' }, knobContainer);
  };
};

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
