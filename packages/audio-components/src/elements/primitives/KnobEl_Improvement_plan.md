# KnobElement MIDI Integration - Suggested Improvements

## Critical Issue Found

### **🚨 Curve mismatch between `setValue()` and `setValueNormalized()`**

**Problem:**

```typescript
// setValueNormalized: normalized → rotation → value
const rotation = minRotation + clamped * (maxRotation - minRotation);
const value = this.rotationToValue(rotation); // applies curve ONCE

// setValue: just sets value directly
this.currentValue = clamp(value, minValue, maxValue);
this.currentRotation = this.valueToRotation(this.currentValue); // inverse curve
```

**Result:**

- MIDI CC 64 (0.5 normalized) doesn't produce the same result as `setValue(50)` on a 0-100 knob with curve=2
- `setValueNormalized(0.5)` applies curve during rotation→value conversion
- `setValue(50)` applies inverse curve during value→rotation conversion

**Fix needed:**
`setValueNormalized()` should map directly to value space, not rotation space:

```typescript
public setValueNormalized(normalizedValue: number): void {
  const clamped = Math.max(0, Math.min(1, normalizedValue));
  const value = this.config.minValue + clamped * (this.config.maxValue - this.config.minValue);
  this.setValue(value); // Let setValue handle rotation calculation
}
```

---

## Major Improvements for Audio/MIDI Use

### **1. Add MIDI CC Number Attribute (Declarative MIDI)**

**Current:** Manual JS setup required  
**Proposed:** Built-in MIDI support

```html
<!-- Declarative MIDI binding -->
<knob-element
  midi-cc="74"
  midi-channel="1"
  min-value="20"
  max-value="20000"
  curve="5"
>
</knob-element>
```

**Benefits:**

- Zero JS code for basic MIDI
- Works with inputController automatically
- Persists with component state
- Easy to serialize/save presets

**Implementation:**

```typescript
// In KnobElement
private midiUnsubscribe?: () => void;

connectedCallback() {
  // ... existing code ...
  this.setupMIDI();
}

private setupMIDI() {
  const cc = this.getAttribute('midi-cc');
  const channel = this.getAttribute('midi-channel');

  if (cc && window.inputController) {
    this.midiUnsubscribe = window.inputController.registerControlTarget(
      this,
      {
        controller: parseInt(cc),
        channel: channel ? parseInt(channel) : 'all'
      }
    );
  }
}

disconnectedCallback() {
  this.midiUnsubscribe?.();
  this.cleanup();
}
```

---

### **2. Add Audio Param Binding (Direct Web Audio)**

**Current:** Manual `van.derive()` in every knob config  
**Proposed:** Direct AudioParam connection

```html
<knob-element audio-param="filter.frequency" min-value="20" max-value="20000">
</knob-element>
```

```typescript
// In JS
knob.connectAudioParam(filterNode.frequency);
```

**Benefits:**

- Sample-accurate automation
- No JS derivation overhead
- Works with Web Audio automation
- Standard audio workflow

---

### **3. Bidirectional Value Updates (Feedback)**

**Current:** Knob → Audio (one-way)  
**Proposed:** Audio ↔ Knob (two-way)

**Use cases:**

- Motorized MIDI controllers
- Preset loading
- Automation playback
- LFO visualization

```typescript
public enableValueFeedback(enabled: boolean) {
  // Allow external setValue to update visuals without dispatching events
}

public setValueSilent(value: number) {
  // Update knob position without triggering audio changes
}
```

---

### **4. Value Formatting for Display**

**Current:** Custom `valueFormatter` in configs, but not used by KnobElement  
**Proposed:** Built into KnobElement with tooltip

```typescript
// Add to KnobElement
private valueFormatter?: (value: number) => string;

public setValueFormatter(formatter: (value: number) => string) {
  this.valueFormatter = formatter;
  this.updateTooltip();
}

private updateTooltip() {
  const formatted = this.valueFormatter
    ? this.valueFormatter(this.currentValue)
    : this.currentValue.toFixed(2);

  this.setAttribute('title', formatted);
}
```

```html
<!-- Usage -->
<knob-element value-format="hz" min-value="20" max-value="20000">
</knob-element>
```

Built-in formats: `hz`, `db`, `ms`, `percent`, `semitones`

---

### **5. MIDI Learn Integration**

**Current:** App-level click handlers checking body class  
**Proposed:** Built-in learn mode

```typescript
// Add to KnobElement
public enterMidiLearnMode(): Promise<number> {
  // Returns promise that resolves with CC number when learned
  // Visual feedback built-in
}

// Usage
knob.enterMidiLearnMode().then(cc => {
  knob.setAttribute('midi-cc', cc.toString());
});
```

**Alternative:** Keep in app layer but add standard event:

```typescript
// Knob dispatches when clicked in learn mode
knob.addEventListener('midi-learn-request', (e) => {
  // App handles the learning logic
});
```

---

### **6. Preset Management API**

**Current:** LocalStorage per-knob, hard to manage  
**Proposed:** Unified preset system

```typescript
// Serialize all knob states
const preset = KnobElement.capturePreset(container);
// { 'volume-knob': 0.75, 'filter-knob': 8000, ... }

// Restore preset
KnobElement.loadPreset(container, preset);

// Per-knob API
knob.getState(); // { value, midiCC, curve, ... }
knob.setState(state);
```

---

### **7. Value Constraints for Audio Ranges**

**Current:** Generic min/max  
**Proposed:** Audio-aware constraints

```typescript
public setAudioRange(type: 'frequency' | 'gain' | 'time') {
  switch(type) {
    case 'frequency':
      this.config.minValue = 20;
      this.config.maxValue = 20000;
      this.config.curve = 5; // Logarithmic
      break;
    case 'gain':
      this.config.minValue = -60;
      this.config.maxValue = 12;
      this.config.curve = 2; // dB curve
      break;
    // ...
  }
}
```

```html
<knob-element audio-range="frequency"></knob-element>
```

---

## Minor Conveniences

### **8. Better Default for Audio Use**

```typescript
// Current defaults
minRotation: -170;
maxRotation: 170;
curve: 1;

// Better audio defaults
minRotation: -135; // More standard knob range
maxRotation: 135;
curve: 1.5; // Slight log curve feels more natural for audio
```

---

### **9. Snap to musical values**

```typescript
// Musical timing
knob.setAttribute('snap-musical', 'true');
// Snaps to: 1/16, 1/8, 1/4, 1/2, 1, 2, 4 bars

// Semitones
knob.setAttribute('snap-semitones', 'true');
// Integer semitone values
```

---

### **10. Multi-parameter control**

```typescript
// One knob controls multiple params with different ranges
knob.addControlTarget({
  param: filterFreq,
  min: 20,
  max: 20000,
  curve: 5,
});

knob.addControlTarget({
  param: filterQ,
  min: 0.1,
  max: 20,
  curve: 1.5,
});
```

---

## Priority Recommendations

### **Must Fix:**

1. ✅ **Curve mismatch in `setValueNormalized()`** - breaks MIDI mapping accuracy

### **High Value, Low Effort:**

2. **Declarative MIDI binding** (`midi-cc` attribute) - eliminates boilerplate
3. **Value formatting/tooltip** - better UX for audio params
4. **`setValueSilent()`** - needed for preset loading without audio glitches

### **High Value, Medium Effort:**

5. **Audio param binding** - standard Web Audio workflow
6. **Preset management API** - essential for real apps

### **Nice to Have:**

7. Built-in MIDI learn mode
8. Musical snap modes
9. Audio range presets
10. Multi-param control

---

## Implementation Strategy

### **Phase 1: Fix Critical Issues**

- Fix `setValueNormalized()` curve behavior
- Add `setValueSilent()` method

### **Phase 2: MIDI Integration**

- Add `midi-cc` and `midi-channel` attributes
- Auto-register with `inputController` if available
- Add `midi-learn-request` event

### **Phase 3: Audio Workflow**

- Add `audio-param` binding
- Add value formatters
- Add audio range presets

### **Phase 4: Polish**

- Preset management API
- Multi-param control
- Musical snapping

---

## Breaking Changes?

**None if done carefully:**

- All new features are additive
- Existing API stays unchanged
- Opt-in via attributes or methods

**Only the curve fix is breaking**, but it's fixing incorrect behavior, so it's justified.
