// SamplerSelectFactory.ts - Select components for sampler controls
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSamplePlayer } from '../../App';
import {
  COMPONENT_STYLE,
  SELECT_STYLE,
} from '../shared/styles/component-styles';

import { SUPPORTED_WAVEFORMS, SupportedWaveform } from '@repo/audiolib';
import { createWaveformIcon } from '@/shared/utils/icons/createWaveformIcons';
import { setRecorderInputSource } from '../../utils/recorderSettings';

const { div, select, option, span, button, selectedcontent, img } = van.tags;

// ===== SELECT CONFIGURATION TYPES =====

export interface SelectOption<T extends string = string> {
  value: T;
  label?: string;
  svg?: SVGElement | null;
}

export interface SelectConfig<T extends string = string> {
  label?: string;
  title?: string;
  defaultValue: T;
  options: SelectOption<T>[];
  onTargetConnect?: (target: any, state: State<T>, van: any) => void;
}

// ===== SELECT CONFIGURATIONS =====

// Helper to create short labels for waveforms
const getWaveformLabel = (waveform: SupportedWaveform): string => {
  const labelMap: Partial<Record<SupportedWaveform, string>> = {
    sine: 'Sine',
    square: 'Square',
    sawtooth: 'Saw',
    triangle: 'Triangle',
    pulse: 'Pulse',
    'bandlimited-sawtooth': 'BL-Saw',
    supersaw: 'Super',
    'warm-pad': 'Warm',
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
  title: 'Select Modulation Waveform',
  defaultValue: 'warm-pad' as SupportedWaveform,
  options: SUPPORTED_WAVEFORMS.map((waveform: SupportedWaveform) => ({
    value: waveform,
    label: getWaveformLabel(waveform),
    svg: createWaveformIcon(waveform),
  })),
  onTargetConnect: (
    sampler: any,
    state: State<SupportedWaveform>,
    van: any,
  ) => {
    // Set up reactive binding to sampler method
    van.derive(() => {
      sampler.setModulationWaveform('AM', state.val);
    });
  },
};

const inputSourceSelectConfig: SelectConfig<
  'audio-input' | 'browser' | 'resample'
> = {
  title: 'Select Audio Input Source',
  defaultValue: 'audio-input',
  options: [
    {
      value: 'audio-input',
      label: 'Device',
    },
    {
      value: 'browser',
      label: 'Browser',
    },
    {
      value: 'resample',
      label: 'ReSample',
    },
  ],
  onTargetConnect: (
    sampler: any,
    state: State<'audio-input' | 'browser' | 'resample'>,
    van: any,
  ) => {
    van.derive(() => {
      setRecorderInputSource(state.val);
    });
  },
};

// ===== SELECT CREATION UTILITY =====

const createSamplerSelect = <T extends string = string>(
  config: SelectConfig<T>,
  van: any,
  componentStyle: string,
  autoResize = true,
) => {
  return (attributes: ElementProps) => {
    const showLabel = attributes.attr('show-label', 'false');
    const labelPosition = attributes.attr('label-position', 'inline'); // 'inline' or 'below'
    const state = van.state(config.defaultValue);

    attributes.mount(() => {
      let connected = false;

      const connect = () => {
        if (connected) return;
        const sampler = getSamplePlayer();
        if (!sampler) return;

        connected = true;
        if (config.onTargetConnect) {
          try {
            config.onTargetConnect(sampler, state, van);
          } catch (error) {
            console.error(
              `Failed to connect select "${config.label || 'unnamed'}":`,
              error,
            );
          }
        }
      };

      connect();

      if (connected) return;

      const handleSamplerInitialized = () => {
        connect();
      };

      document.addEventListener(
        'sampler-initialized',
        handleSamplerInitialized as EventListener,
      );

      return () => {
        document.removeEventListener(
          'sampler-initialized',
          handleSamplerInitialized as EventListener,
        );
      };
    });

    const handleChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      state.val = target.value as T;
    };

    const selectedOpt = config.options.find((opt) => opt.value === state.val);

    const SelectElement = div(
      { class: 'ac-selectContainer' },
      select(
        {
          title: config.title || config.label || 'Select',
          onchange: handleChange,
          style: SELECT_STYLE + ' min-width: 2.5rem;',
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
            opt.svg && opt.svg,
            span(
              {
                class: () =>
                  selectedOpt === opt && opt.svg
                    ? 'selected-option-label'
                    : 'option-label',
              },
              opt.label && opt.label,
            ),
          ),
        ),
      ),
      autoResize &&
        span({
          class: 'ac-select-measure',
          style:
            'visibility: hidden; position: absolute; white-space: pre; font: inherit;',
        }),
    );

    if (autoResize) {
      setTimeout(() => {
        const container = SelectElement as HTMLElement;
        const select = container.querySelector(
          '.ac-autoResizableSelect',
        ) as HTMLSelectElement | null;
        const measure = container.querySelector(
          '.ac-select-measure',
        ) as HTMLSpanElement | null;

        const resizeSelect = () => {
          if (!select || !measure) return;
          measure.textContent = select.options[select.selectedIndex].text;
          measure.style.font = window.getComputedStyle(select).font;

          // Try to get SVG width if present in the selected option
          let svgWidth = 0;
          const selectedOption = select.options[select.selectedIndex];
          const optConfig = config.options.find(
            (opt) => opt.value === selectedOption.value,
          );
          if (optConfig && optConfig.svg) {
            const svgEls = container.querySelectorAll('svg');
            let foundWidth = 0;
            svgEls.forEach((svg) => {
              if (
                svg.parentElement &&
                svg.parentElement.textContent?.trim() ===
                  selectedOption.text.trim()
              ) {
                foundWidth = svg.getBoundingClientRect().width;
              }
            });
            svgWidth = foundWidth || 20; // fallback to 20px
          }
          select.style.width = measure.offsetWidth + 35 + svgWidth + 'px';
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

    // Label below the select
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
          config.label,
        ),
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
        `${config.label}:`,
      ),
      SelectElement,
    );
  };
};

// ===== EXPORTED SELECT COMPONENTS =====

export const WaveformSelect = createSamplerSelect(
  waveformSelectConfig,
  van,
  COMPONENT_STYLE,
);

export const InputSourceSelect = createSamplerSelect(
  inputSourceSelectConfig,
  van,
  COMPONENT_STYLE,
);
