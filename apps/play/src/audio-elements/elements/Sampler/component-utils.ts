// component-utils.ts - Shared utilities for components
import { type SamplePlayer } from '@repo/audiolib';
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { createKnob, KnobConfig } from '@/elements/primitives/createKnob';
import { INLINE_COMPONENT_STYLE } from '../../shared/styles/component-styles';

export const getSamplePlayerInstance = (): SamplePlayer | null => {
  return (window as any).__samplePlayerInstance || null;
};

const { div } = van.tags;


/**
 * Creates a reusable connection handler for sampler components
 */
export const createSamplerConnection = (
  onConnect: (sampler: SamplePlayer) => void
) => {
  let connected = false;

  const connect = () => {
    if (connected) return;
    const sampler = getSamplePlayerInstance();
    if (sampler) {
      connected = true;
      onConnect(sampler);
    }
  };

  const createMountHandler = () => {
    return () => {
      // Try to connect immediately
      connect();

      // If not yet available, listen for sampler-initialized
      if (!connected) {
        const handleSamplerInitialized = () => {
          connect();
        };
        document.addEventListener(
          'sampler-initialized',
          handleSamplerInitialized as EventListener
        );

        return () => {
          document.removeEventListener(
            'sampler-initialized',
            handleSamplerInitialized as EventListener
          );
        };
      }
    };
  };

  return { connect, createMountHandler };
};

/**
 * Configuration for a toggle component
 */
export interface ToggleConfig {
  label?: string;
  title?: string;
  defaultValue: boolean;
  onColor?: string;
  offText: string;
  onText: string;
  onSamplerConnect?: (sampler: any, state: State<boolean>, van: any) => void;
}

/**
 * Generic factory for creating toggle components
 */
export const createToggleForTarget = (
  config: ToggleConfig,
  Toggle: any,
  van: any,
  componentStyle?: string
) => {
  const { div } = van.tags;

  return (attributes: ElementProps) => {
    const toggleState = van.state(config.defaultValue);
    let connected = false;

    const connect = () => {
      if (connected) return;
      const sampler = getSamplePlayerInstance();
      if (sampler) {
        connected = true;
        config.onSamplerConnect?.(sampler, toggleState, van);
      }
    };

    attributes.mount(() => {
      connect();
      if (!connected) {
        const handleInitialized = () => {
          connect();
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
      }
    });

    return div(
      {
        style: componentStyle || '',
        title: config.title || config.label || '',
      },

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
  config: KnobConfig
) => {
  return (attributes: ElementProps) => {
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
    let isInitializing = true;

    const connect = () => {
      if (connected) return;
      const target = getSamplePlayerInstance();

      if (target) {
        connected = true;

        const knobElement = knobContainer?.querySelector('knob-element');
        config.onConnect?.(target, state, knobElement);

        setTimeout(() => {
          isInitializing = false;
        }, 100);
      }
    };

    attributes.mount(() => {
      connect();
      if (!connected) {
        const handleInit = () => {
          connect();
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
      }
    });

    // Create knob with simplified config
    knobContainer = createKnob(
      {
        ...config,
        label: effectiveLabel,
        useLocalStorage: false,
        state,
        onChange: (value) => {
          state.val = value;
          config.onChange?.(value);
        },
      },
      ''
    );

    return div({ style: INLINE_COMPONENT_STYLE || '' }, knobContainer);
  };
};
