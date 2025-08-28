// SamplerSelectFactory.ts - Select components for sampler controls
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';
import KeyMaps, {
  DEFAULT_KEYMAP_KEY,
} from '@/shared/keyboard/keyboard-keymaps';
import {
  findNodeId,
  createSamplerConnection,
} from '../../../shared/utils/component-utils';
import {
  COMPONENT_STYLE,
  SELECT_STYLE,
} from '../../../shared/styles/component-styles';

import {
  type SamplePlayer,
  SUPPORTED_WAVEFORMS,
  SupportedWaveform,
} from '@repo/audiolib';

const { div, select, option, span, button, selectedcontent } = van.tags;

// ===== SELECT CONFIGURATION TYPES =====

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectConfig<T extends string = string> {
  label?: string;
  defaultValue: T;
  options: SelectOption<T>[];
  onTargetConnect?: (
    target: any,
    state: State<T>,
    van: any,
    targetNodeId: string
  ) => void;
}

// ===== SELECT CONFIGURATIONS =====

const keymapSelectConfig: SelectConfig<keyof typeof KeyMaps> = {
  label: 'KeyMap',
  defaultValue: DEFAULT_KEYMAP_KEY,
  options: [
    { value: 'piano', label: 'Piano' },
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
    { value: 'pentatonic', label: 'Pentatonic' },
    { value: 'chromatic', label: 'Chromatic' },
  ],
  onTargetConnect: (
    sampler: any,
    state: State<keyof typeof KeyMaps>,
    van: any,
    targetNodeId: string
  ) => {
    van.derive(() => {
      const selectedKeymap = state.val;
      const keymap = KeyMaps[selectedKeymap] || KeyMaps[DEFAULT_KEYMAP_KEY];

      // Broadcast keymap changes for keyboard components
      document.dispatchEvent(
        new CustomEvent('keymap-changed', {
          detail: {
            keymap,
            selectedValue: state.val,
            targetNodeId: targetNodeId,
          },
        })
      );
    });
  },
};

// Helper to create short labels for waveforms
const getWaveformLabel = (waveform: SupportedWaveform): string => {
  const labelMap: Partial<Record<SupportedWaveform, string>> = {
    sine: 'Sine',
    square: 'Square',
    sawtooth: 'Saw',
    triangle: 'Triangle',
    pulse: 'Pulse',
    'bandlimited-sawtooth': 'BL Saw',
    supersaw: 'SuperSaw',
    'warm-pad': 'Warm Pad',
    metallic: 'Metallic',
    formant: 'Formant',
    'white-noise': 'White',
    'pink-noise': 'Pink',
    'brown-noise': 'Brown',
    'colored-noise': 'Colored',
    'random-harmonic': 'Random',
    'custom-function': 'Custom',
  };
  return labelMap[waveform] || waveform;
};

const waveformSelectConfig: SelectConfig<SupportedWaveform> = {
  label: 'Wave',
  defaultValue: 'square' as SupportedWaveform,
  options: SUPPORTED_WAVEFORMS.map((waveform: SupportedWaveform) => ({
    value: waveform,
    label: getWaveformLabel(waveform),
  })),
  onTargetConnect: (
    sampler: any,
    state: State<SupportedWaveform>,
    van: any,
    targetNodeId: string
  ) => {
    // Set up reactive binding to sampler method
    van.derive(() => {
      sampler.setModulationWaveform('AM', state.val);
    });
  },
};

const inputSourceSelectConfig: SelectConfig<'microphone' | 'browser'> = {
  defaultValue: 'microphone',
  options: [
    {
      value: 'microphone',
      label: 'Mic',
    },
    {
      value: 'browser',
      label: 'Browser',
    },
  ],
  onTargetConnect: (
    sampler: any,
    state: State<'microphone' | 'browser'>,
    van: any,
    targetNodeId: string
  ) => {
    van.derive(() => {
      sampler.setRecorderInputSource(state.val);
    });
  },
};

// ===== SELECT CREATION UTILITY =====

const createSamplerSelect = <T extends string = string>(
  config: SelectConfig<T>,
  getSamplerFn: (nodeId: string) => any,
  van: any,
  componentStyle: string,
  autoResize = true
) => {
  return (attributes: ElementProps) => {
    const targetNodeId: State<string> = attributes.attr('target-node-id', '');
    const showLabel = attributes.attr('show-label', 'false');
    const labelPosition = attributes.attr('label-position', 'inline'); // 'inline' or 'below'
    const state = van.state(config.defaultValue);

    const getId = findNodeId(attributes, targetNodeId);

    // Use standardized connection utility
    const { createMountHandler } = createSamplerConnection(
      getId,
      getSamplerFn,
      (sampler: SamplePlayer) => {
        if (config.onTargetConnect) {
          try {
            config.onTargetConnect(sampler, state, van, getId());
          } catch (error) {
            console.error(
              `Failed to connect select "${config.label || 'unnamed'}":`,
              error
            );
          }
        }
      }
    );

    attributes.mount(createMountHandler(attributes));

    const handleChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      state.val = target.value as T;
    };

    const SelectElement = div(
      { class: 'ac-selectContainer' },
      select(
        {
          onchange: handleChange,
          style: SELECT_STYLE,
          value: () => state.val,
          class: autoResize ? 'ac-select ac-autoResizableSelect' : 'ac-select',
        },
        button(selectedcontent()),
        ...config.options.map((opt: SelectOption<T>) =>
          option(
            {
              value: opt.value,
              selected: () => state.val === opt.value,
            },
            opt.label
          )
        )
      ),
      autoResize &&
        span({
          class: 'ac-select-measure',
          style:
            'visibility: hidden; position: absolute; white-space: pre; font: inherit;',
        })
    );

    if (autoResize) {
      setTimeout(() => {
        const container = SelectElement as HTMLElement;
        const select = container.querySelector(
          '.ac-autoResizableSelect'
        ) as HTMLSelectElement | null;
        const measure = container.querySelector(
          '.ac-select-measure'
        ) as HTMLSpanElement | null;

        const resizeSelect = () => {
          if (!select || !measure) return;
          measure.textContent = select.options[select.selectedIndex].text;
          measure.style.font = window.getComputedStyle(select).font;
          select.style.width = measure.offsetWidth + 35 + 'px';
        };

        if (select) {
          select.addEventListener('change', resizeSelect);
          window.addEventListener('DOMContentLoaded', resizeSelect);
          resizeSelect();
        }
      }, 0);
    }

    // If no label needed, just return the select
    if (showLabel.val !== 'true' || !config.label) {
      return SelectElement;
    }

    // Label below the select (for composite elements)
    if (labelPosition.val === 'below') {
      return div(
        {
          style: `
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          `,
        },
        SelectElement,
        div(
          {
            style: `
              font-size: 9px;
              color: var(--ac-color-text-secondary, #999);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            `,
          },
          config.label
        )
      );
    }

    // Default: Label inline with select
    return div(
      {
        style: `display: inline-flex; align-items: center; gap: var(--ac-spacing-xs, 0.25rem);`,
      },
      div(
        {
          style: `font-size: var(--ac-font-size-sm, 12px); color: var(--ac-color-text-primary);`,
        },
        `${config.label}:`
      ),
      SelectElement
    );
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

export const InputSourceSelect = createSamplerSelect(
  inputSourceSelectConfig,
  getSampler,
  van,
  COMPONENT_STYLE
);

// ===== SHARED SELECT STATE REGISTRY =====
// const selectStates = new Map<string, any>();
// const getSelectState = (key: string) => selectStates.get(key);
// const setSelectState = (key: string, state: any) =>
//   selectStates.set(key, state);
