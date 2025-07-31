import van from '@repo/vanjs-core';
import type { State } from '@repo/vanjs-core';
import { when } from '@/shared/utils/vanjs-utils';

const { div, span, input, label } = van.tags;

export type StaticLabelContent =
  | string
  | HTMLElement
  | SVGElement
  | (string | HTMLElement | SVGElement)[];

export type DynamicLabelContent = () => StaticLabelContent;
export type LabelContent = StaticLabelContent | DynamicLabelContent;

export type CustomCheckbox = {
  unchecked: string | HTMLElement | SVGElement;
  checked: string | HTMLElement | SVGElement;
};

// Helper function to render label content
const renderLabelContent = (content: LabelContent) => {
  // If content is a function, call it to get the actual content
  const actualContent = typeof content === 'function' ? content() : content;

  // Handle array content
  if (Array.isArray(actualContent)) {
    return div(
      { style: 'display: inline-flex; align-items: center;' },
      ...actualContent
    );
  }

  // Handle string or element
  return actualContent;
};

export const createSlider = (
  labelContent: LabelContent,
  state: State<number>,
  min: number,
  max: number,
  step: number,
  showValue = false,
  unit: string = '%',
  multiplier: number = 100
) => {
  return div(
    { style: 'margin-bottom: 20px;' },
    typeof labelContent === 'function'
      ? () => {
          const content = labelContent();
          return typeof content === 'string'
            ? label(content + ': ')
            : div(
                { style: 'display: inline-block; margin-right: 5px;' },
                content
              );
        }
      : typeof labelContent === 'string'
        ? label(labelContent + ': ')
        : div(
            { style: 'display: inline-block; margin-right: 5px;' },
            labelContent
          ),

    input({
      type: 'range',
      min,
      max,
      step,
      value: state,
      oninput: (e) => (state.val = parseFloat(e.target.value)),
      style: 'margin-left: 10px;',
      class: 'interactive-element',
    }),

    when(showValue, () =>
      span({ style: 'margin-left: 10px;' }, () =>
        unit === '%'
          ? Math.round(state.val * multiplier) + unit
          : state.val + unit
      )
    )
  );
};

export const createCheckbox = (
  labelContent: LabelContent,
  state: State<boolean>,
  customCheckbox?: CustomCheckbox
) => {
  if (customCheckbox) {
    return div(
      {
        style: 'display: flex; align-items: center; gap: 8px; cursor: pointer;',
        onclick: () => (state.val = !state.val),
        role: 'checkbox',
        'aria-checked': () => state.val,
      },
      // Custom checkbox element that changes based on state
      () => {
        const element = state.val
          ? customCheckbox.checked
          : customCheckbox.unchecked;

        // Handle different types of elements
        if (typeof element === 'string') {
          return span(
            {
              style:
                'font-size: 1.2rem; display: inline-flex; align-items: center;',
              class: 'custom-checkbox-text',
            },
            element
          );
        } else {
          return div(
            {
              style: 'display: inline-flex; align-items: center;',
              class: 'custom-checkbox',
            },
            element
          );
        }
      },
      // Dynamic label content
      typeof labelContent === 'function'
        ? () => renderLabelContent(labelContent())
        : renderLabelContent(labelContent)
    );
  }

  // Original implementation for standard checkbox
  return label(
    { style: 'display: flex; align-items: center; gap: 8px; cursor: pointer;' },
    input({
      type: 'checkbox',
      checked: state,
      onchange: (e) => (state.val = e.target.checked),
    }),
    // Dynamic label content
    typeof labelContent === 'function'
      ? () => renderLabelContent(labelContent())
      : renderLabelContent(labelContent)
  );
};

/** Usage Examples:
 *
 *    With text label:
 *      const volumeSlider = createSlider("Volume", volumeState, 0, 1, 0.01);
 *
 *    With SVG icon:
 *      import { volumeIcon } from './icons'; // Assuming you have an icons file
 *
 *      const volumeSliderWithIcon = createSlider(
 *        van.tags.svg({ width: 16, height: 16, viewBox: "0 0 24 24" },
 *          van.tags.path({ d: "M3 9v6h4l5 5V4L7 9H3z" })
 *        ),
 *        volumeState,
 *        0,
 *        1,
 *        0.01
 *      );
 *
 *    With custom checkbox:
 *      const customCheckbox = createCheckbox(
 *        "Dark Mode",
 *        darkModeState,
 *        {
 *          unchecked: "☀️",
 *          checked: "🌙"
 *        }
 *      );
 *
 *    With SVG custom checkbox:
 *      const customSvgCheckbox = createCheckbox(
 *        "Enable Feature",
 *        featureState,
 *        {
 *          unchecked: createSvgIcon(offIconSvg, { width: '1rem', height: '1rem' }, 'gray'),
 *          checked: createSvgIcon(onIconSvg, { width: '1rem', height: '1rem' }, 'green')
 *        }
 *      );
 */
