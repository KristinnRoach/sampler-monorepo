// component-styles.ts - Minimal safety styles for visibility

export const COMPONENT_STYLE = `
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  margin: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-height: 40px;
  font-family: system-ui, sans-serif;
  font-size: 14px;
`;

export const INLINE_COMPONENT_STYLE = `
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-height: 32px;
  font-family: system-ui, sans-serif;
  font-size: 14px;
`;

export const BUTTON_STYLE = `
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
`;

export const BUTTON_ACTIVE_STYLE = `
  background: #4CAF50;
  color: white;
`;

// Additional configurable styles for components
export const CONTROL_ROW_STYLE = `
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const CONTROL_GROUP_STYLE = `
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
`;

export const SMALL_BUTTON_STYLE = `
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
`;

export const SELECT_STYLE = `
  margin-left: 0.5rem;
  padding: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
`;

export const HELP_TEXT_STYLE = `
  font-size: 0.7rem;
  color: #666;
  margin-top: 0.25rem;
`;

export const RECORD_BUTTON_RECORDING_STYLE = `
  background: #f44336;
`;

export const RECORD_BUTTON_ARMED_STYLE = `
  background: #ff9800;
`;

export const DISABLED_STYLE = `
  opacity: 0.5;
  pointer-events: none;
`;
