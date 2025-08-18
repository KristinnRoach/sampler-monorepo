// component-styles.ts - Minimal styles using CSS custom properties

export const COMPONENT_STYLE = `
  display: flex;
  flex-direction: column;
  gap: var(--ac-spacing-sm, 0.5rem);
  padding: var(--ac-spacing-sm, 0.5rem);
  margin: var(--ac-spacing-xs, 0.25rem);
  border-radius: var(--ac-border-radius, 4px);
  min-height: var(--ac-component-height-md, 40px);
  font-family: var(--ac-font-family, system-ui, sans-serif);
  font-size: var(--ac-font-size-md, 14px);
`;

export const INLINE_COMPONENT_STYLE = `
  display: inline-flex;
  align-items: center;
  gap: var(--ac-spacing-sm, 0.5rem);
  padding: var(--ac-spacing-sm, 0.5rem);
  margin: var(--ac-spacing-xs, 0.25rem);
  border-radius: var(--ac-border-radius, 4px);
  min-height: var(--ac-component-height-sm, 32px);
  font-family: var(--ac-font-family, system-ui, sans-serif);
  font-size: var(--ac-font-size-md, 14px);
`;

export const BUTTON_STYLE = `
  padding: var(--ac-button-padding, 0.5rem 1rem);
  border-radius: var(--ac-border-radius, 4px);
  cursor: pointer;
  font-family: var(--ac-font-family, inherit);
  font-size: var(--ac-font-size-md, 14px);
  background: var(--ac-color-bg-primary, white);
  color: var(--ac-color-text-primary, black);
  transition: var(--ac-transition, 0.15s ease-in-out);
`;

export const BUTTON_ACTIVE_STYLE = `
  background: var(--ac-color-active, #4CAF50);
  color: var(--ac-color-text-inverse, white);
`;

export const CONTROL_ROW_STYLE = `
  display: flex;
  align-items: center;
  gap: var(--ac-spacing-sm, 0.5rem);
  margin-bottom: var(--ac-spacing-sm, 0.5rem);
`;

export const CONTROL_GROUP_STYLE = `
  display: flex;
  align-items: center;
  gap: var(--ac-spacing-sm, 0.5rem);
  margin: var(--ac-spacing-sm, 0);
`;

export const SMALL_BUTTON_STYLE = `
  padding: var(--ac-spacing-xs, 0.25rem) var(--ac-spacing-sm, 0.5rem);
  font-size: var(--ac-font-size-sm, 0.8rem);
  border-radius: var(--ac-border-radius, 4px);
  cursor: pointer;
  font-family: var(--ac-font-family, inherit);
`;

export const SELECT_STYLE = `
  padding: 2px 6px;
  border-radius: var(--ac-border-radius, 4px);
  font-size: var(--ac-font-size-xs, 11px);
  background: var(--ac-color-bg-primary, #333);
  color: var(--ac-color-text-primary, #ccc);
  cursor: pointer;
  width: 75px;
  height: 22px;
  font-family: var(--ac-font-family, inherit);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

export const HELP_TEXT_STYLE = `
  font-size: var(--ac-font-size-sm, 0.75rem);
  color: var(--ac-color-text-secondary, #666);
  margin-top: var(--ac-spacing-xs, 0.25rem);
`;

export const RECORD_BUTTON_RECORDING_STYLE = `
  background: var(--ac-color-recording, #f44336);
  color: var(--ac-color-text-inverse, white);
`;

export const RECORD_BUTTON_ARMED_STYLE = `
  background: var(--ac-color-armed, #ff9800);
  color: var(--ac-color-text-inverse, white);
`;

export const DISABLED_STYLE = `
  opacity: 0.5;
  pointer-events: none;
`;
