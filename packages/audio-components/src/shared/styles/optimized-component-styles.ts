// optimized-component-styles.ts - Optimized styles for UI integration

import { BEM_CLASSES, bemConditional } from './bem-component-styles';

// Re-export BEM_CLASSES for convenience
export { BEM_CLASSES };

/**
 * Optimized component styles that use CSS custom properties and BEM classes
 * instead of inline styles. This provides better integration for consuming apps.
 */

// Base component style that uses CSS custom properties
export const BASE_COMPONENT_STYLE = BEM_CLASSES.COMPONENT;

// Inline component style for controls that should be side-by-side
export const INLINE_COMPONENT_STYLE = `${BEM_CLASSES.COMPONENT} ${BEM_CLASSES.COMPONENT_INLINE}`;

// Button styles using BEM classes
export const BUTTON_STYLE = BEM_CLASSES.BUTTON;
export const BUTTON_PRIMARY_STYLE = `${BEM_CLASSES.BUTTON} ${BEM_CLASSES.BUTTON_PRIMARY}`;
export const BUTTON_SMALL_STYLE = `${BEM_CLASSES.BUTTON} ${BEM_CLASSES.BUTTON_SMALL}`;

// Dynamic button style generator
export const createButtonStyle = (options: {
  primary?: boolean;
  active?: boolean;
  armed?: boolean;
  recording?: boolean;
  small?: boolean;
  disabled?: boolean;
}): string => {
  return bemConditional(BEM_CLASSES.BUTTON, {
    primary: options.primary || false,
    active: options.active || false,
    armed: options.armed || false,
    recording: options.recording || false,
    small: options.small || false,
    disabled: options.disabled || false,
  });
};

// Toggle styles
export const TOGGLE_STYLE = BEM_CLASSES.TOGGLE;
export const createToggleStyle = (isOn: boolean): string => {
  return bemConditional(BEM_CLASSES.TOGGLE, { on: isOn });
};

// Layout utilities
export const LAYOUT_FLEX_STYLE = BEM_CLASSES.LAYOUT_FLEX;
export const LAYOUT_GRID_STYLE = BEM_CLASSES.LAYOUT_GRID;
export const LAYOUT_INLINE_STYLE = BEM_CLASSES.LAYOUT_INLINE;

// Component spacing
export const SPACING_SMALL = BEM_CLASSES.SPACING_SM;
export const SPACING_MEDIUM = BEM_CLASSES.SPACING_MD;
export const SPACING_LARGE = BEM_CLASSES.SPACING_LG;

/**
 * Utility to create component styles with consistent patterns
 */
export const createComponentStyle = (options: {
  inline?: boolean;
  disabled?: boolean;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'flex' | 'grid' | 'inline';
}): string => {
  const classes: string[] = [BEM_CLASSES.COMPONENT];

  if (options.inline) classes.push(BEM_CLASSES.COMPONENT_INLINE);
  if (options.disabled) classes.push(BEM_CLASSES.COMPONENT_DISABLED);
  if (options.spacing) classes.push(`ac-spacing--${options.spacing}`);
  if (options.layout) classes.push(`ac-layout--${options.layout}`);

  return classes.join(' ');
};

/**
 * Legacy compatibility - these provide the old inline styles as fallbacks
 * for components that haven't been migrated yet
 */
export const LEGACY_COMPONENT_STYLE = `
  display: flex;
  flex-direction: column;
  gap: var(--ac-spacing-sm, 0.5rem);
  padding: var(--ac-spacing-sm, 0.5rem);
  margin: var(--ac-spacing-xs, 0.25rem);
  border: 1px solid var(--ac-color-border-primary, #ccc);
  border-radius: var(--ac-border-radius, 4px);
  min-height: var(--ac-component-height-md, 40px);
  font-family: var(--ac-font-family, system-ui, sans-serif);
  font-size: var(--ac-font-size-md, 14px);
`;

export const LEGACY_INLINE_COMPONENT_STYLE = `
  display: inline-flex;
  align-items: center;
  gap: var(--ac-spacing-sm, 0.5rem);
  padding: var(--ac-spacing-sm, 0.5rem);
  margin: var(--ac-spacing-xs, 0.25rem);
  border: 1px solid var(--ac-color-border-primary, #ccc);
  border-radius: var(--ac-border-radius, 4px);
  min-height: var(--ac-component-height-sm, 32px);
  font-family: var(--ac-font-family, system-ui, sans-serif);
  font-size: var(--ac-font-size-md, 14px);
`;

export const LEGACY_BUTTON_STYLE = `
  padding: var(--ac-button-padding, 0.5rem 1rem);
  border: 1px solid var(--ac-color-border-primary, #ccc);
  border-radius: var(--ac-border-radius, 4px);
  cursor: pointer;
  font-family: var(--ac-font-family, inherit);
  font-size: var(--ac-font-size-md, 14px);
  background: var(--ac-color-bg-primary, white);
  color: var(--ac-color-text-primary, black);
  transition: var(--ac-transition, 0.15s ease-in-out);
`;

// Backward compatibility exports
export const COMPONENT_STYLE = BASE_COMPONENT_STYLE;
export const CONTROL_ROW_STYLE = LAYOUT_FLEX_STYLE;
export const CONTROL_GROUP_STYLE = LAYOUT_INLINE_STYLE;
