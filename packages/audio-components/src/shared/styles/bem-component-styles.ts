// bem-component-styles.ts - BEM-based CSS classes for audio components

/**
 * BEM-based CSS class system for Audio Components
 *
 * Pattern: .ac-{block}__{element}--{modifier}
 * Where 'ac' is the namespace for Audio Components
 */

export const BEM_CLASSES = {
  // Base component classes
  COMPONENT: 'ac-component',
  COMPONENT_INLINE: 'ac-component--inline',
  COMPONENT_BLOCK: 'ac-component--block',
  COMPONENT_DISABLED: 'ac-component--disabled',

  // Knob component
  KNOB: 'ac-knob',
  KNOB_CONTAINER: 'ac-knob__container',
  KNOB_LABEL: 'ac-knob__label',
  KNOB_VALUE: 'ac-knob__value',
  KNOB_CONTROL: 'ac-knob__control',

  // Button component
  BUTTON: 'ac-button',
  BUTTON_PRIMARY: 'ac-button--primary',
  BUTTON_SECONDARY: 'ac-button--secondary',
  BUTTON_ACTIVE: 'ac-button--active',
  BUTTON_ARMED: 'ac-button--armed',
  BUTTON_RECORDING: 'ac-button--recording',
  BUTTON_SMALL: 'ac-button--small',

  // Toggle component
  TOGGLE: 'ac-toggle',
  TOGGLE_CONTAINER: 'ac-toggle__container',
  TOGGLE_LABEL: 'ac-toggle__label',
  TOGGLE_SWITCH: 'ac-toggle__switch',
  TOGGLE_ON: 'ac-toggle--on',
  TOGGLE_OFF: 'ac-toggle--off',

  // Envelope component
  ENVELOPE: 'ac-envelope',
  ENVELOPE_CONTAINER: 'ac-envelope__container',
  ENVELOPE_DISPLAY: 'ac-envelope__display',
  ENVELOPE_CONTROLS: 'ac-envelope__controls',
  ENVELOPE_SWITCHER: 'ac-envelope__switcher',

  // Keyboard component
  KEYBOARD: 'ac-keyboard',
  KEYBOARD_COMPUTER: 'ac-keyboard--computer',
  KEYBOARD_PIANO: 'ac-keyboard--piano',
  KEYBOARD_CONTROLS: 'ac-keyboard__controls',
  KEYBOARD_STATUS: 'ac-keyboard__status',

  // Sampler component
  SAMPLER: 'ac-sampler',
  SAMPLER_CORE: 'ac-sampler__core',
  SAMPLER_CONTROLS: 'ac-sampler__controls',
  SAMPLER_STATUS: 'ac-sampler__status',

  // Layout utilities
  LAYOUT_FLEX: 'ac-layout--flex',
  LAYOUT_GRID: 'ac-layout--grid',
  LAYOUT_INLINE: 'ac-layout--inline',

  // Spacing utilities
  SPACING_XS: 'ac-spacing--xs',
  SPACING_SM: 'ac-spacing--sm',
  SPACING_MD: 'ac-spacing--md',
  SPACING_LG: 'ac-spacing--lg',
  SPACING_XL: 'ac-spacing--xl',

  // State utilities
  STATE_LOADING: 'ac-state--loading',
  STATE_ERROR: 'ac-state--error',
  STATE_SUCCESS: 'ac-state--success',
  STATE_HIDDEN: 'ac-state--hidden',
} as const;

/**
 * Utility function to combine BEM classes
 */
export const bemClass = (
  block: string,
  element?: string,
  modifier?: string
): string => {
  let className = block;
  if (element) className += `__${element}`;
  if (modifier) className += `--${modifier}`;
  return className;
};

/**
 * Utility to generate conditional BEM classes
 */
export const bemConditional = (
  baseClass: string,
  conditions: Record<string, boolean>
): string => {
  const classes = [baseClass];

  Object.entries(conditions).forEach(([modifier, condition]) => {
    if (condition) {
      classes.push(`${baseClass}--${modifier}`);
    }
  });

  return classes.join(' ');
};
