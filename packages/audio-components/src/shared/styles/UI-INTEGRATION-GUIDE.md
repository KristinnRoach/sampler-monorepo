# Audio Components UI Integration Guide

## Overview

This guide outlines the optimized pattern for easy UI integration in consuming applications. The new system provides:

- **CSS Custom Properties** for consistent theming
- **BEM CSS classes** for predictable styling targets
- **Flexible sizing and variants** via attributes
- **Layout-agnostic components** that work anywhere
- **Dark mode support** out of the box

## Quick Start

### 1. Import the CSS

Add the default stylesheet to your consuming application:

```html
<link
  rel="stylesheet"
  href="@repo/audio-components/dist/audio-components.css"
/>
```

Or import in your CSS/SCSS:

```scss
@import '@repo/audio-components/dist/audio-components.css';
```

### 2. Use Components with Attributes

```html
<!-- Basic usage -->
<sampler-element node-id="my-sampler" debug-mode></sampler-element>
<load-button
  target-node-id="my-sampler"
  size="lg"
  variant="primary"
></load-button>

<!-- With custom styling -->
<volume-knob
  target-node-id="my-sampler"
  class="my-custom-knob"
  style="--ac-knob-size: 80px;"
>
</volume-knob>
```

## Theming System

### CSS Custom Properties

Override these CSS custom properties to theme your application:

```css
:root {
  /* Colors */
  --ac-color-bg-primary: #f8f9fa;
  --ac-color-accent-primary: #007bff;
  --ac-color-active: #28a745;

  /* Sizing */
  --ac-knob-size: 70px;
  --ac-component-height-md: 45px;

  /* Spacing */
  --ac-spacing-md: 1.2rem;
}
```

### Component-Specific Theming

```css
/* Theme all knobs */
.ac-knob {
  --ac-knob-size: 80px;
}

/* Theme specific knob types */
volume-knob {
  --ac-color-accent-primary: #e74c3c;
}

/* Theme by custom class */
.mixer-section .ac-knob {
  --ac-knob-size: 60px;
  --ac-spacing-sm: 0.3rem;
}
```

## Component Attributes

### Size Variants

Most components support size attributes:

```html
<load-button size="sm">Small Button</load-button>
<load-button size="md">Medium Button</load-button>
<load-button size="lg">Large Button</load-button>
```

### Style Variants

```html
<load-button variant="primary">Primary Style</load-button>
<load-button variant="secondary">Secondary Style</load-button>
```

### Layout Control

```html
<!-- Inline layout (side-by-side) -->
<div class="ac-layout--inline">
  <volume-knob target-node-id="sampler"></volume-knob>
  <reverb-knob target-node-id="sampler"></reverb-knob>
</div>

<!-- Grid layout -->
<div class="ac-layout--grid" style="grid-template-columns: repeat(4, 1fr);">
  <volume-knob target-node-id="sampler"></volume-knob>
  <reverb-knob target-node-id="sampler"></reverb-knob>
  <drive-knob target-node-id="sampler"></drive-knob>
  <feedback-knob target-node-id="sampler"></feedback-knob>
</div>
```

## Responsive Design

### Breakpoint Support

The system includes responsive breakpoints:

```css
/* Mobile optimization */
@media (max-width: 768px) {
  .ac-component {
    --ac-spacing-md: 0.8rem;
    --ac-knob-size: 50px;
  }
}
```

### Container Queries (Future)

For advanced responsive behavior:

```css
.mixer-panel {
  container-type: inline-size;
}

@container (max-width: 400px) {
  .mixer-panel .ac-knob {
    --ac-knob-size: 45px;
  }
}
```

## Layout Patterns

### Mixer Panel Layout

```html
<div class="mixer-panel">
  <sampler-element node-id="sampler-1"></sampler-element>

  <section class="controls-section">
    <div class="control-group">
      <h3>Volume & Mix</h3>
      <div class="ac-layout--inline">
        <volume-knob target-node-id="sampler-1"></volume-knob>
        <dry-wet-knob target-node-id="sampler-1"></dry-wet-knob>
      </div>
    </div>

    <div class="control-group">
      <h3>Effects</h3>
      <div
        class="ac-layout--grid"
        style="grid-template-columns: repeat(3, 1fr);"
      >
        <reverb-knob target-node-id="sampler-1"></reverb-knob>
        <drive-knob target-node-id="sampler-1"></drive-knob>
        <feedback-knob target-node-id="sampler-1"></feedback-knob>
      </div>
    </div>
  </section>

  <section class="input-section">
    <load-button target-node-id="sampler-1" variant="primary"></load-button>
    <record-button target-node-id="sampler-1"></record-button>
  </section>

  <section class="keyboard-section">
    <computer-keyboard target-node-id="sampler-1"></computer-keyboard>
    <piano-keyboard target-node-id="sampler-1"></piano-keyboard>
  </section>
</div>
```

### Compact Layout

```html
<div class="compact-sampler">
  <sampler-element node-id="sampler-2"></sampler-element>

  <!-- Inline controls for space efficiency -->
  <div class="ac-layout--inline ac-spacing--sm">
    <load-button target-node-id="sampler-2" size="sm"></load-button>
    <volume-knob
      target-node-id="sampler-2"
      style="--ac-knob-size: 40px;"
    ></volume-knob>
    <reverb-knob
      target-node-id="sampler-2"
      style="--ac-knob-size: 40px;"
    ></reverb-knob>
  </div>
</div>
```

## Custom Styling Examples

### Card-Based Layout

```css
.sampler-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin: 1rem;
}

.sampler-card .ac-component {
  border: none;
  margin: 0;
  background: transparent;
}

.sampler-card .ac-button {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
}
```

### Dark Theme

```css
.dark-theme {
  --ac-color-bg-primary: #1a1a1a;
  --ac-color-bg-secondary: #2d2d2d;
  --ac-color-text-primary: #ffffff;
  --ac-color-border-primary: #444444;
  --ac-color-accent-primary: #0066cc;
}
```

### Custom Brand Colors

```css
.brand-theme {
  --ac-color-accent-primary: #ff6b35;
  --ac-color-active: #4ecdc4;
  --ac-color-armed: #f7931e;
  --ac-color-recording: #ff6b9d;
}
```

## Accessibility

Components include built-in accessibility features:

- ARIA labels and live regions
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast mode support

```html
<load-button
  target-node-id="sampler"
  aria-label="Load audio sample from file"
  aria-describedby="load-instructions"
>
</load-button>
<div id="load-instructions" class="sr-only">
  Click to select an audio file to load into the sampler
</div>
```

## Migration Path

### Phase 1: Add CSS Support (Non-breaking)

1. Include the new CSS file
2. Components continue to work with existing inline styles
3. New CSS custom properties provide override capabilities

### Phase 2: Component Updates (Optional)

1. Update individual components to use BEM classes
2. Add size and variant attributes
3. Maintain backward compatibility

### Phase 3: Full Optimization (Breaking changes)

1. Remove inline styles completely
2. Require CSS file for proper styling
3. Full control through CSS custom properties

## Best Practices

1. **Use CSS custom properties** for theming instead of overriding component styles
2. **Leverage BEM classes** for specific styling needs
3. **Use layout utility classes** instead of custom container styles
4. **Test responsive behavior** at different viewport sizes
5. **Provide fallback values** when overriding CSS custom properties
6. **Use semantic HTML** structure around components
7. **Test accessibility** with screen readers and keyboard navigation
