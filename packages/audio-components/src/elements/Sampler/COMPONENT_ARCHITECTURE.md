# Sampler UI Component Architecture

## Overview

The Sampler UI component system provides a consistent, declarative way to create interactive controls for the audio sampler. All components follow the same patterns for connection, state management, and reactive updates.

## Core Principles

### 1. Configuration-Driven Components

Each component type (knob, toggle, select, button) is created using a configuration object that defines:

- Label and default values
- Value constraints (min/max, allowed values, etc.)
- Connection behavior (`onTargetConnect` or `onSamplerConnect`)

### 2. Consistent Connection Pattern

All components use the same connection lifecycle:

1. **Mount**: Component mounts to DOM
2. **Connect**: Attempts to find and connect to sampler
3. **Listen**: Listens for `sampler-initialized` events
4. **Cleanup**: Removes listeners on unmount

### 3. Reactive State Management

Components use Van.js reactive state for:

- UI updates (immediate visual feedback)
- Sampler synchronization (via `van.derive`)

## Component Types

### Knobs

**Factory**: `SamplerKnobFactory.ts`  
**Pattern**: Configuration → createKnob → Component

```typescript
const knobConfig: KnobConfig = {
  label: 'Volume',
  defaultValue: 0.75,
  minValue: 0,
  maxValue: 1,
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => (sampler.volume = state.val));
  },
};
```

### Toggles

**Factory**: `SamplerToggleFactory.ts`  
**Pattern**: Configuration → createToggle → Component

```typescript
const toggleConfig: ToggleConfig = {
  label: 'Loop Lock',
  defaultValue: false,
  offText: '○',
  onText: '🔒',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.setLoopLocked(state.val));
  },
};
```

### Selects

**Factory**: `SamplerSelectFactory.ts`  
**Pattern**: Configuration → createSamplerSelect → Component

```typescript
const selectConfig: SelectConfig<T> = {
  label: 'Waveform',
  defaultValue: 'sine',
  options: [
    { value: 'sine', label: 'Sine' },
    { value: 'square', label: 'Square' },
  ],
  onTargetConnect: (sampler, state, van) => {
    van.derive(() => sampler.setWaveform(state.val));
  },
};
```

### Buttons

**Factory**: `SamplerButtonFactory.ts`  
**Pattern**: Direct component implementation with mount handlers

## Creating a New Component

### Step 1: Define Configuration

```typescript
const myConfig: KnobConfig = {
  label: 'My Control',
  defaultValue: 0.5,
  minValue: 0,
  maxValue: 1,
  onTargetConnect: (sampler, state, van) => {
    // Set up reactive binding
    van.derive(() => {
      sampler.myMethod(state.val);
    });
  },
};
```

### Step 2: Export Component

```typescript
export const MyKnob = createKnob(
  myConfig,
  getSampler, // Registry function
  createLabeledKnob, // UI creator
  van, // Van.js instance
  COMPONENT_STYLE // Style constant
);
```

### Step 3: Register Component

Add to `Sampler.ts`:

```typescript
// In defineSampler()
defineIfNotExists('my-knob', MyKnob, false);
```

## Connection Flow

```mermaid
graph TD
    A[Component Mounts] --> B[Call connect()]
    B --> C{Find NodeId}
    C -->|Found| D[Get Sampler from Registry]
    C -->|Not Found| E[Wait for sampler-initialized]
    D --> F{Sampler Exists?}
    F -->|Yes| G[Call onTargetConnect]
    F -->|No| E
    G --> H[Setup van.derive]
    H --> I[Component Initialized]
    E --> J[Listen for Events]
    J --> B
```

## State Management

### Local State

Each component maintains its own state:

```typescript
const state = van.state(config.defaultValue);
```

### Reactive Updates

State changes trigger sampler updates via `van.derive`:

```typescript
van.derive(() => {
  // This runs whenever state.val changes
  sampler.setParameter(state.val);
});
```

### Shared State (Optional)

Some components register their state for cross-component access:

```typescript
setKnobState('loopStart', state);
// Other components can access:
const loopStartState = getKnobState('loopStart');
```

## Best Practices

### 1. Single Connection

Always use a `connected` flag to ensure `onTargetConnect` runs only once:

```typescript
let connected = false;
const connect = () => {
  if (connected) return;
  // ... connection logic
  connected = true;
  config.onTargetConnect(sampler, state, van);
};
```

### 2. Error Handling

Wrap connection logic in try-catch:

```typescript
try {
  connected = true;
  config.onTargetConnect(sampler, state, van);
} catch (error) {
  connected = false;
  console.error(`Failed to connect: ${error}`);
}
```

### 3. Cleanup

Always return cleanup function from mount:

```typescript
attributes.mount(() => {
  // Setup...
  return () => {
    // Cleanup listeners, intervals, etc.
  };
});
```

### 4. Type Safety

Use TypeScript generics for type-safe configurations:

```typescript
SelectConfig<SupportedWaveform>;
ToggleConfig;
KnobConfig;
```

## File Structure

```
Sampler/
├── Sampler.ts                 # Main element & registration
├── SamplerRegistry.ts         # Global sampler registry
├── components/
│   ├── SamplerKnobFactory.ts  # All knob components
│   ├── SamplerToggleFactory.ts # All toggle components
│   ├── SamplerSelectFactory.ts # All select components
│   ├── SamplerButtonFactory.ts # All button components
│   └── [Other specialized components]
```

## Usage Examples

### With Explicit Target ID

```html
<sampler-element node-id="sampler1"></sampler-element>
<volume-knob target-node-id="sampler1"></volume-knob>
<reverb-knob target-node-id="sampler1"></reverb-knob>
<waveform-select target-node-id="sampler1"></waveform-select>
```

### Auto-detect Parent (Nested)

```html
<sampler-element>
  <volume-knob></volume-knob>
  <reverb-knob></reverb-knob>
  <waveform-select></waveform-select>
</sampler-element>
```

### Auto-detect Nearest Sampler

```html
<!-- Finds the first sampler-element on the page -->
<sampler-element></sampler-element>
<volume-knob></volume-knob>
<reverb-knob></reverb-knob>
```

### Programmatic Access

```javascript
const samplerEl = document.querySelector('sampler-element');
const volumeKnob = document.createElement('volume-knob');
volumeKnob.setAttribute('target-node-id', samplerEl.nodeId);
document.body.appendChild(volumeKnob);
```

## Testing New Components

1. **Add to HTML**:

```html
<my-knob target-node-id="test-sampler"></my-knob>
```

2. **Verify Connection**:

- Check browser console for connection logs
- Test interaction updates sampler state
- Verify cleanup on unmount

3. **Common Issues**:

- Component not connecting: Check node-id matches
- Updates not working: Verify van.derive is set up
- Multiple updates: Ensure single connection with flag
