// SamplerSelectFactory.ts - Select components for sampler controls
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';
import KeyMaps from '@/shared/keyboard/keyboard-keymaps';
import { createFindNodeId } from '../../../shared/utils/component-utils';
import {
  COMPONENT_STYLE,
  CONTROL_GROUP_STYLE,
  SELECT_STYLE,
} from '../../../shared/styles/component-styles';

import { SUPPORTED_WAVEFORMS, SupportedWaveform } from '@repo/audiolib';

const { div, select, option } = van.tags;

// ===== SELECT CONFIGURATION TYPES =====

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectConfig<T extends string = string> {
  label?: string;
  defaultValue: T;
  options: SelectOption<T>[];
  onTargetConnect?: (target: any, state: State<T>, van: any) => void;
}

// ===== SHARED SELECT STATE REGISTRY =====
const selectStates = new Map<string, any>();
const getSelectState = (key: string) => selectStates.get(key);
const setSelectState = (key: string, state: any) =>
  selectStates.set(key, state);

// ===== SELECT CONFIGURATIONS =====

const keymapSelectConfig: SelectConfig<keyof typeof KeyMaps> = {
  label: 'Key',
  defaultValue: 'default',
  options: [
    { value: 'default', label: 'Chromatic' },
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
    { value: 'pentatonic', label: 'Pentatonic' },
  ],
  onTargetConnect: (
    sampler: any,
    state: State<keyof typeof KeyMaps>,
    van: any
  ) => {
    // Register this state for other components to access
    setSelectState('keymap', state);

    van.derive(() => {
      const selectedKeymap = state.val;
      const keymap = KeyMaps[selectedKeymap] || KeyMaps.default;

      // Broadcast keymap changes for keyboard components
      document.dispatchEvent(
        new CustomEvent('keymap-changed', {
          detail: {
            keymap,
            selectedValue: state.val,
            targetNodeId: sampler.nodeId,
          },
        })
      );
    });
  },
};

const waveformSelectConfig: SelectConfig<SupportedWaveform> = {
  // label: 'Wave',
  defaultValue: 'square' as SupportedWaveform,
  options: SUPPORTED_WAVEFORMS.map((waveform: SupportedWaveform) => ({
    value: waveform,
    label:
      waveform.charAt(0).toUpperCase() + waveform.slice(1).replace(/-/g, ' '),
  })),
  onTargetConnect: (
    sampler: any,
    state: State<SupportedWaveform>,
    van: any
  ) => {
    // Register this state for other components to access
    setSelectState('waveform', state);

    // Set up reactive binding to sampler method
    van.derive(() => {
      sampler.setModulationWaveform('AM', state.val);
    });
  },
};

// ===== SELECT CREATION UTILITY =====

const createSamplerSelect = <T extends string = string>(
  config: SelectConfig<T>,
  getSamplerFn: (nodeId: string) => any,
  van: any,
  componentStyle: string
) => {
  return (attributes: ElementProps) => {
    const targetNodeId: State<string> = attributes.attr('target-node-id', '');
    const showLabel = attributes.attr('show-label', 'true');
    const state = van.state(config.defaultValue);

    const findNodeId = createFindNodeId(attributes, targetNodeId);

    // Track if we've already set up the connection
    let connected = false;

    // Connection handler - same pattern as knobs
    const connect = () => {
      if (connected) return;
      const nodeId = findNodeId();
      if (!nodeId) return;

      const sampler = getSamplerFn(nodeId);
      if (!sampler) return;

      // Set up the connection once
      if (config.onTargetConnect) {
        try {
          connected = true;
          config.onTargetConnect(sampler, state, van);
        } catch (error) {
          connected = false;
          console.error(
            `Failed to connect select "${config.label || 'unnamed'}":`,
            error
          );
        }
      }
    };

    // Mount handler - same pattern as knobs
    attributes.mount(() => {
      // Try to connect immediately
      connect();

      // Listen for sampler-ready events
      const handleReady = (e: CustomEvent) => {
        if (e.detail.nodeId === findNodeId()) {
          connect();
        }
      };
      document.addEventListener('sampler-ready', handleReady as EventListener);

      // Cleanup
      return () => {
        document.removeEventListener(
          'sampler-ready',
          handleReady as EventListener
        );
      };
    });

    const handleChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      state.val = target.value as T;
    };

    const createSelectElement = () =>
      select(
        {
          onchange: handleChange,
          style: SELECT_STYLE,
          value: () => state.val,
        },
        ...config.options.map((opt: SelectOption<T>) =>
          option(
            {
              value: opt.value,
              selected: () => state.val === opt.value,
            },
            opt.label
          )
        )
      );

    if (showLabel.val === 'true' && config.label) {
      return div(
        { style: componentStyle },
        div(
          { style: CONTROL_GROUP_STYLE },
          `${config.label}: `,
          createSelectElement()
        )
      );
    }

    return div({ style: componentStyle }, createSelectElement());
  };
};

// ===== EXPORTED SELECT COMPONENTS =====

export const KeymapSelect = createSamplerSelect(
  keymapSelectConfig,
  getSampler,
  van,
  COMPONENT_STYLE
);

export const WaveformSelect = createSamplerSelect(
  waveformSelectConfig,
  getSampler,
  van,
  COMPONENT_STYLE
);
