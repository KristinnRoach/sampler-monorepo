# @repo/input-controller

Generic MIDI input controller for routing MIDI events to targets (audio engines, UI controls, etc).

## Key Features

- ✅ Centralized MIDI access (one WebMidi instance)
- ✅ Generic target registration (notes, control changes)
- ✅ Multi-target support (one CC → multiple knobs)
- ✅ Channel filtering
- ✅ Custom value transforms
- ✅ Type-safe interfaces

## Installation

```bash
pnpm add @repo/input-controller
```

## ControlChangeEvent Value Properties

When you receive a control change event, it provides **two** values for maximum flexibility:

- `event.normalizedValue`: **Normalized 0-1** (ready for UI controls)
- `event.midiValue`: **Raw MIDI 0-127** (original MIDI spec)

**This package provides normalized values (0-1) by default**. Use `event.midiValue` or `transformValue` if you need raw MIDI values or other transformations.

## Usage

### Basic Setup

```typescript
import { inputController } from '@repo/input-controller';

// Initialize (call once at app startup)
await inputController.init();
```

### Note Handling

```typescript
// Register a note target (sampler, synth, etc)
const unsubscribe = inputController.registerNoteTarget({
  play: (note, velocity) => {
    mySampler.play(note, velocity);
  },
  release: (note) => {
    mySampler.release(note);
  },
});

// Channel-specific
inputController.registerNoteTarget(target, 1); // Only channel 1
```

### Control Change Handling

#### Simple Target (Knobs, Sliders)

```typescript
// By default, gets normalized values (0-1)
inputController.registerControlTarget(myKnob, {
  controller: 74, // CC number
});

// Normalized (0-1) for UI controls - this is the default!
inputController.registerControlTarget(myKnob, {
  controller: 74,
  // No transformValue needed - normalizedValue is used by default
});

// Raw MIDI values (0-127) if needed
inputController.registerControlTarget(myKnob, {
  controller: 74,
  transformValue: (event) => event.midiValue,
});
```

#### Detailed Target (Custom Logic)

```typescript
inputController.registerControlTarget(
  {
    onControlChange: (value, event) => {
      console.log(`CC${event.controller}: ${value}`);
      console.log(`Channel: ${event.channel}`);
      myControl.setValue(value);
    },
  },
  {
    controller: 74,
  }
);
```

#### Multi-Target Control

```typescript
// One CC controls multiple knobs
const knobs = [volumeKnob, filterKnob, reverbKnob];

inputController.registerControlTarget(knobs, {
  controller: 7, // MIDI volume
  // Uses normalizedValue (0-1) by default - perfect for knobs!
});
```

#### Custom Transforms

```typescript
// Exponential curve
inputController.registerControlTarget(filterKnob, {
  controller: 74,
  transformValue: (event) => {
    return Math.pow(event.normalizedValue, 2); // Square for exponential
  },
});

// Frequency range (20Hz - 20kHz)
inputController.registerControlTarget(filterKnob, {
  controller: 74,
  transformValue: (event) => {
    return 20 + event.normalizedValue * 19980; // 20 to 20000
  },
});
```

#### Channel Filtering

```typescript
// Only respond to channel 1
inputController.registerControlTarget(knob, {
  controller: 74,
  channel: 1,
});

// Respond to all channels (default)
inputController.registerControlTarget(knob, {
  controller: 74,
  channel: 'all',
});
```

### Low-Level Event Handlers

For direct access to MIDI events:

```typescript
// Note on events
const unsub = inputController.onNoteOn((event) => {
  console.log(`Note: ${event.note}, Velocity: ${event.velocity}`);
});

// Note off events
inputController.onNoteOff((event) => {
  console.log(`Note off: ${event.note}`);
});

// Control change events
inputController.onControlChange((event) => {
  console.log(
    `CC${event.controller}: ${event.normalizedValue} (0-1) / ${event.midiValue} (0-127)`
  );
});

// Cleanup
unsub();
```

## Type Definitions

### Target Interfaces

```typescript
// Simple control target - just needs setValue
interface SimpleControlTarget {
  setValue(value: number): void;
}

// Detailed control target - needs full event data
interface DetailedControlTarget {
  onControlChange(value: number, event: ControlChangeEvent): void;
}

// Note target
interface NoteTarget {
  play(note: number, velocity?: number): void;
  release(note: number): void;
}
```

### Event Types

```typescript
type NoteEvent = {
  type: 'noteon' | 'noteoff';
  note: number;
  velocity: number;
  channel: number;
  raw: any; // Original WebMidi event
};

type ControlChangeEvent = {
  type: 'controlchange';
  controller: number;
  normalizedValue: number; // 0-1 (ready for UI controls)
  midiValue: number; // 0-127 (raw MIDI spec)
  channel: number;
  raw: any; // Original WebMidi event
};
```

## Common Patterns

### Sustain Pedal

```typescript
inputController.registerControlTarget(
  {
    onControlChange: (value) => {
      if (value >= 64) {
        sampler.sustainPedalOn();
      } else {
        sampler.sustainPedalOff();
      }
    },
  },
  {
    controller: 64, // Sustain pedal CC
  }
);
```

### MIDI Learn

See the example implementation in `apps/play/src/io/InputController.ts` for a full MIDI learn system with visual feedback.

## Why Normalized Values by Default?

We provide **normalized values (0-1)** by default because:

1. **Most UI controls expect 0-1** - knobs, sliders, etc.
2. **Convenience** - no manual normalization needed for common cases
3. **Both options available** - `normalizedValue` for UI, `midiValue` for raw data
4. **Clear intent** - explicit property names avoid confusion

You always have access to both values in the event object, so you can choose what fits your use case best.

## Troubleshooting

### Values are too small (0.0-0.1 range)

You're probably normalizing values that are already normalized. By default, the package provides `normalizedValue` (0-1).

```typescript
// ❌ Wrong - double normalization
transformValue: (event) => event.normalizedValue / 127;

// ✅ Correct - use normalizedValue directly
// No transformValue needed - normalizedValue is used by default

// ✅ Or if you need raw MIDI values
transformValue: (event) => event.midiValue;
```

### Knobs not responding

1. Check MIDI device is connected: `WebMidi.inputs`
2. Verify CC number matches your controller
3. Add logging to see if events are received:

```typescript
inputController.onControlChange((e) => console.log(e));
```

## License

MIT
