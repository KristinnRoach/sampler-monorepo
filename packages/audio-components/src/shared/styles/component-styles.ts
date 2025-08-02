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
