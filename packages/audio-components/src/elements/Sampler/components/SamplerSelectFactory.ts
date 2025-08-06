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

const { div, select, option } = van.tags;

// ===== SELECT CONFIGURATION TYPES =====

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectConfig {
  label: string;
  defaultValue: string;
  options: SelectOption[];
  onTargetConnect?: (target: any, state: State<string>, van: any) => void;
}

// ===== SHARED SELECT STATE REGISTRY =====
const selectStates = new Map<string, any>();
const getSelectState = (key: string) => selectStates.get(key);
const setSelectState = (key: string, state: any) =>
  selectStates.set(key, state);

// ===== SELECT CONFIGURATIONS =====

const keymapSelectConfig: SelectConfig = {
  label: 'Keymap',
  defaultValue: 'major',
  options: [
    { value: 'default', label: 'Default' },
    { value: 'major', label: 'Major Scale' },
    { value: 'minor', label: 'Minor Scale' },
    { value: 'pentatonic', label: 'Pentatonic' },
  ],
  onTargetConnect: (sampler: any, state: State<string>, van: any) => {
    // Register this state for other components to access
    setSelectState('keymap', state);

    van.derive(() => {
      const selectedKeymap = state.val as keyof typeof KeyMaps;
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

// ===== SELECT CREATION UTILITY =====

const createSamplerSelect = (
  config: SelectConfig,
  getSamplerFn: (nodeId: string) => any,
  van: any,
  componentStyle: string
) => {
  return (attributes: ElementProps) => {
    const targetNodeId: State<string> = attributes.attr('target-node-id', '');
    const showLabel = attributes.attr('show-label', 'true');
    const state = van.state(config.defaultValue);

    const findNodeId = createFindNodeId(attributes, targetNodeId);

    // Handle sampler connection and configuration
    van.derive(() => {
      const nodeId = findNodeId();
      if (!nodeId) return;

      const sampler = getSamplerFn(nodeId);
      if (!sampler) return;

      // Execute the configuration's onTargetConnect if provided
      if (config.onTargetConnect) {
        config.onTargetConnect(sampler, state, van);
      }
    });

    const handleChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      state.val = target.value;
    };

    const createSelectElement = () =>
      select(
        {
          onchange: handleChange,
          style: SELECT_STYLE,
          value: () => state.val,
        },
        ...config.options.map((opt: SelectOption) =>
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
