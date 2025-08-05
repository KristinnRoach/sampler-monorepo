// css-custom-properties.ts - Standardized CSS custom properties for theming

/**
 * CSS Custom Properties System for Audio Components
 *
 * This provides a consistent theming interface for consuming applications.
 * Components use these custom properties with fallback values.
 */

export const CSS_CUSTOM_PROPERTIES = {
  // Component spacing
  '--ac-spacing-xs': '0.25rem',
  '--ac-spacing-sm': '0.5rem',
  '--ac-spacing-md': '1rem',
  '--ac-spacing-lg': '1.5rem',
  '--ac-spacing-xl': '2rem',

  // Component sizing
  '--ac-component-height-sm': '32px',
  '--ac-component-height-md': '40px',
  '--ac-component-height-lg': '48px',
  '--ac-component-min-width': '80px',

  // Typography
  '--ac-font-family': 'system-ui, sans-serif',
  '--ac-font-size-sm': '0.75rem',
  '--ac-font-size-md': '0.875rem',
  '--ac-font-size-lg': '1rem',
  '--ac-line-height': '1.5',

  // Colors - semantic naming
  '--ac-color-bg-primary': '#ffffff',
  '--ac-color-bg-secondary': '#f8f9fa',
  '--ac-color-bg-disabled': '#e9ecef',

  '--ac-color-border-primary': '#dee2e6',
  '--ac-color-border-focus': '#80bdff',
  '--ac-color-border-error': '#dc3545',

  '--ac-color-text-primary': '#212529',
  '--ac-color-text-secondary': '#6c757d',
  '--ac-color-text-disabled': '#adb5bd',
  '--ac-color-text-inverse': '#ffffff',

  '--ac-color-accent-primary': '#007bff',
  '--ac-color-accent-success': '#28a745',
  '--ac-color-accent-warning': '#ffc107',
  '--ac-color-accent-danger': '#dc3545',

  // State colors for audio components
  '--ac-color-active': '#4CAF50',
  '--ac-color-armed': '#ff9800',
  '--ac-color-recording': '#f44336',
  '--ac-color-feedback': '#9c27b0',

  // Shadows and effects
  '--ac-shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
  '--ac-shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
  '--ac-border-radius': '4px',
  '--ac-transition': '0.15s ease-in-out',

  // Component-specific
  '--ac-knob-size': '60px',
  '--ac-button-padding': '0.5rem 1rem',
  '--ac-toggle-height': '24px',
  '--ac-envelope-height': '200px',
  '--ac-keyboard-height': '60px',
} as const;

/**
 * Generate CSS custom properties as a string for injection
 */
export const generateCSSCustomProperties = (): string => {
  return Object.entries(CSS_CUSTOM_PROPERTIES)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');
};

/**
 * CSS class that applies all custom properties to the document root
 */
export const CSS_ROOT_STYLES = `:root {
${generateCSSCustomProperties()}
}`;
