# Instrument Settings Save/Restore Feature

## Overview
The sampler instrument now saves and restores all instrument settings alongside audio samples. When you save a sample, the current state of all knobs, toggles, and controls is captured and stored in the database. When you load a saved sample, these settings are automatically restored.

## What Gets Saved

### Knobs (25 parameters) ✅
- **Mix Controls**: volume, dry/wet mix
- **Effects**: reverb (send, size), delay (send, time, feedback), distortion, AM modulation  
- **Filters**: highpass, lowpass cutoff frequencies
- **Loop Controls**: start, duration, drift
- **Trim**: start and end points
- **Feedback**: amount, pitch, lowpass filter, decay
- **LFOs**: gain LFO (rate, depth), pitch LFO (rate, depth)
- **Performance**: glide amount

### Toggles (9 states) ✅
- MIDI enable/disable
- Playback direction (forward/reverse)
- Loop lock
- Hold lock
- Pitch tracking
- Pan drift
- Feedback mode (mono/poly)
- LFO sync states (gain, pitch)

### Select Controls ✅
- Root note selection
- Keymap selection (piano, major, minor, pentatonic, chromatic)
- Input source selection (microphone, browser, resample)
- Waveform selection (for AM modulation)

### Envelopes (Amp, Filter, Pitch) ✅
- All envelope points (time, value, curve type)
- Sustain and release point indices
- Envelope enabled/disabled state
- Loop enabled state
- Sync to playback rate setting
- Time scale setting

### Other ✅
- Tempo setting

## How It Works

### Saving
1. When you click the save button, the `captureInstrumentState()` function queries all control elements in the DOM
2. For knobs: The nested `knob-element` inside each wrapper is found and its value is captured
3. For toggles: SVG buttons use `getState()` to capture their current icon state (e.g., 'midi_on' or 'midi_off')
4. For selects: The actual `<select>` element's value is captured, including the waveform select inside am-modulation
5. All settings are stored in IndexedDB alongside the audio data as part of the `SavedSample` object

### Loading
1. When you select a saved sample from the sidebar, the audio is loaded first
2. After a 250ms delay (to ensure the UI and sampler are ready), `restoreInstrumentState()` is called
3. For knobs: Values are restored using the `setValue()` method on the knob element
4. For toggles: SVG button states are set using `setState()`, then the sampler is updated directly
5. For selects: The `<select>` element's value is set and a change event is dispatched to update Van.js state
6. The sampler methods are called directly to ensure the audio engine state matches the UI

## Implementation Files

- **`/apps/playground-solidjs/src/utils/instrumentState.ts`**
  - Contains the capture and restore logic
  - Defines the settings data structure
  
- **`/apps/playground-solidjs/src/components/SaveButton.tsx`**
  - Modified to capture settings when saving
  
- **`/apps/playground-solidjs/src/App.tsx`**
  - Modified to restore settings when loading samples
  
- **`/apps/playground-solidjs/src/db/samplelib/sampleIdb.ts`**
  - Database schema updated to include settings field

## Future Enhancements

### Preset Management
The current system could be extended to support:
- Saving settings as presets (without audio)
- Importing/exporting presets
- A/B comparison between settings
- Undo/redo for parameter changes

### Real-time State Tracking
Instead of capturing state only on save, the system could:
- Track changes in real-time using event listeners
- Maintain a central state store
- Support auto-save functionality
- Enable session recovery after browser crashes

## Usage

### Save a Sample with Settings
1. Load or record an audio sample
2. Adjust all knobs, toggles, and controls to your liking
3. Click the save button
4. Enter a name for your sample
5. The sample and all current settings are saved

### Load a Sample with Settings
1. Click the sidebar toggle to open the saved samples list
2. Click on any saved sample
3. The audio loads and all settings are automatically restored
4. All knobs, toggles, and controls return to their saved positions

## Troubleshooting

If settings aren't restoring properly:
1. Check that the sample was saved after the settings feature was added
2. Verify that control elements haven't changed their tag names or structure
3. Check browser console for any error messages
4. The 100ms delay before restoration can be adjusted if controls aren't ready

## Technical Notes

- Settings are stored as JSON in IndexedDB
- The system uses DOM queries to find controls, making it flexible but dependent on HTML structure
- Each control wrapper element must have a unique tag name for identification
- The restoration happens after audio load to ensure the sampler is initialized