// component-utils.ts - Shared utilities for components
import { type SamplePlayer } from '@repo/audiolib';
import van from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { createKnob, KnobConfig } from '@/elements/primitives/createKnob';
import { INLINE_COMPONENT_STYLE } from '../../shared/styles/component-styles';
import { getSamplePlayer } from '../../../App';

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
    const sampler = getSamplePlayer();
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
      const target = getSamplePlayer();

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
