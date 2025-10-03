# React Integration Guide

This document explains how to use the audio-components library with React.

## Installation

The audio-components library supports both SolidJS and React frameworks. When using with React:

```bash
npm install @repo/audio-components react react-dom
# or
pnpm add @repo/audio-components react react-dom
```

## Basic Usage

### Import the React components

```tsx
import { KnobComponent } from '@repo/audio-components/react';
import '@repo/audio-components/style';
```

### Simple Knob

```tsx
import React, { useState } from 'react';
import {
  KnobComponent,
  KnobChangeEventDetail,
} from '@repo/audio-components/react';

function MyComponent() {
  const [value, setValue] = useState(0.5);

  const handleChange = (detail: KnobChangeEventDetail) => {
    setValue(detail.value);
    console.log('Value changed:', detail.value);
  };

  return (
    <KnobComponent
      value={value}
      onChange={handleChange}
      label='Volume'
      size={60}
    />
  );
}
```

## Props Reference

### KnobComponentProps

The React `KnobComponent` accepts the following props:

#### Core Configuration

- `value?: number` - Current knob value
- `onChange?: (detail: KnobChangeEventDetail) => void` - Value change callback
- `minValue?: number` - Minimum value (default: 0)
- `maxValue?: number` - Maximum value (default: 1)
- `defaultValue?: number` - Initial value
- `size?: number` - Knob diameter in pixels (default: 45)
- `color?: string` - Knob color

#### Visual Configuration

- `label?: string` - Text label above the knob
- `displayValue?: boolean` - Show value below knob (default: true)
- `valueFormatter?: (value: number) => string` - Custom value formatting
- `title?: string` - Tooltip text

#### Styling

- `className?: string` - CSS class for root container
- `labelClassName?: string` - CSS class for label
- `knobClassName?: string` - CSS class for knob element
- `valueClassName?: string` - CSS class for value display
- `style?: React.CSSProperties` - Inline styles for container
- `labelStyle?: React.CSSProperties` - Inline styles for label
- `valueStyle?: React.CSSProperties` - Inline styles for value

#### Interaction

- `snapIncrement?: number` - Snap to increments
- `allowedValues?: number[]` - Restrict to specific values
- `snapThresholds?: Array<{ maxValue: number; increment: number }>` - Dynamic snapping
- `disabled?: boolean` - Disable interaction

#### Presets

- `preset?: KnobPresetKey` - Use predefined configuration

## Presets

Use presets for common audio controls:

```tsx
<KnobComponent preset="volume" />
<KnobComponent preset="dryWet" />
<KnobComponent preset="feedback" />
<KnobComponent preset="distortion" />
```

Available presets: `volume`, `dryWet`, `feedback`, `distortion`, `drive`, `clipping`, `glide`, `pan`, `pitch`, `speed`, `mix`, `gain`, `threshold`, `ratio`, `attack`, `release`, `delay`, `reverb`, `chorus`, `flanger`, `phaser`, `tremolo`, `vibrato`, `filter`, `resonance`, `tempo`

## Advanced Usage

### Ref Forwarding

Access the underlying KnobElement:

```tsx
import { useRef } from 'react';
import { KnobComponent, KnobElement } from '@repo/audio-components/react';

function MyComponent() {
  const knobRef = useRef<KnobElement>(null);

  const resetKnob = () => {
    if (knobRef.current) {
      knobRef.current.setValue(0.5);
    }
  };

  return (
    <div>
      <KnobComponent ref={knobRef} defaultValue={0.5} />
      <button onClick={resetKnob}>Reset</button>
    </div>
  );
}
```

### Custom Styling

```tsx
<KnobComponent
  label='Custom Knob'
  size={80}
  color='#ff6b6b'
  className='my-knob-container'
  labelStyle={{
    color: '#333',
    fontWeight: 'bold',
    fontSize: '14px',
  }}
  valueStyle={{
    color: '#666',
    fontSize: '12px',
    fontFamily: 'monospace',
  }}
  valueFormatter={(v) => `${Math.round(v * 100)}%`}
/>
```

### Dynamic Snapping

```tsx
<KnobComponent
  label='Dynamic Snap'
  minValue={0}
  maxValue={100}
  snapThresholds={[
    { maxValue: 10, increment: 1 }, // Fine control at low values
    { maxValue: 50, increment: 5 }, // Medium control in middle
    { maxValue: 100, increment: 10 }, // Coarse control at high values
  ]}
/>
```

## Direct Web Component Usage

You can also use the underlying web component directly in React:

```tsx
// Import types for TypeScript support
import '@repo/audio-components/react'; // This registers the JSX types

function MyComponent() {
  const handleChange = (e: CustomEvent<KnobChangeEventDetail>) => {
    console.log('Knob changed:', e.detail.value);
  };

  return (
    <knob-element
      min-value={0}
      max-value={1}
      default-value={0.5}
      width={60}
      color='#00ff00'
      onknob-change={handleChange}
    />
  );
}
```

## Framework Comparison

| Feature      | React              | SolidJS      | Vanilla      |
| ------------ | ------------------ | ------------ | ------------ |
| Bundle Size  | Medium             | Small        | Smallest     |
| Performance  | Good               | Excellent    | Excellent    |
| TypeScript   | Full Support       | Full Support | Full Support |
| Reactivity   | useState/useEffect | Signals      | Manual       |
| Tree Shaking | Good               | Excellent    | N/A          |

## Troubleshooting

### TypeScript Errors

If you get TypeScript errors about missing React types:

```bash
npm install --save-dev @types/react @types/react-dom
```

### Missing CSS

Don't forget to import the stylesheet:

```tsx
import '@repo/audio-components/style';
```

### Peer Dependency Warnings

The React dependencies are marked as optional peer dependencies. Install them explicitly:

```bash
npm install react react-dom
```

## Migration from SolidJS

The React and SolidJS APIs are very similar. Main differences:

1. **Props naming**: `class` → `className`, `classList` → not available
2. **Ref handling**: Different ref forwarding patterns
3. **Event handlers**: Same callback signature
4. **Styling**: React.CSSProperties instead of string styles

```tsx
// SolidJS
<KnobComponent class="my-knob" />

// React
<KnobComponent className="my-knob" />
```
