import { define } from '@repo/vanjs-core/element';

import {
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  GainLFOSyncNoteToggle,
  PitchLFOSyncNoteToggle,
  PlaybackDirectionToggle,
  PanDriftToggle,
  PitchToggle,
} from './components/SamplerToggleFactory';

import { EnvelopeDisplay } from './components/EnvelopeDisplay';
import { EnvelopeSwitcher } from './components/EnvelopeSwitcher';
import { ComputerKeyboard } from './components/ComputerKeyboard';
import { PianoKeyboard } from './components/PianoKeyboard';
import {
  RecordButton,
  UploadButton,
  SaveButton,
} from './components/SamplerButtonFactory';
import {
  KeymapSelect,
  WaveformSelect,
  InputSourceSelect,
  RootNoteSelect,
} from './components/SamplerSelectFactory';
import { SamplerStatusElement } from './components/SamplerStatusElement';

export {
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  GainLFOSyncNoteToggle,
  PitchLFOSyncNoteToggle,
  PlaybackDirectionToggle,
  PanDriftToggle,
  PitchToggle,
  ComputerKeyboard,
  PianoKeyboard,
  RecordButton,
  UploadButton,
  SaveButton,
  KeymapSelect,
  WaveformSelect,
  InputSourceSelect,
  RootNoteSelect,
  SamplerStatusElement,
  EnvelopeDisplay,
};

const defineIfNotExists = (name: string, elementFunc: any, options: any) => {
  if (!customElements.get(name)) {
    define(name, elementFunc, options);
  }
};

/** Register the remaining app-local vanilla controls. */
export const defineSampler = () => {
  defineIfNotExists('load-button', UploadButton, false);
  defineIfNotExists('record-button', RecordButton, false);
  defineIfNotExists('save-button', SaveButton, false);

  defineIfNotExists('feedback-mode-toggle', FeedbackModeToggle, false);
  defineIfNotExists('midi-toggle', MidiToggle, false);
  defineIfNotExists('loop-lock-toggle', LoopLockToggle, false);
  defineIfNotExists('hold-lock-toggle', HoldLockToggle, false);
  defineIfNotExists('gain-lfo-sync-toggle', GainLFOSyncNoteToggle, false);
  defineIfNotExists('pitch-lfo-sync-toggle', PitchLFOSyncNoteToggle, false);
  defineIfNotExists(
    'playback-direction-toggle',
    PlaybackDirectionToggle,
    false,
  );
  defineIfNotExists('pan-drift-toggle', PanDriftToggle, false);
  defineIfNotExists('pitch-toggle', PitchToggle, false);

  defineIfNotExists('envelope-display', EnvelopeDisplay, false);
  defineIfNotExists('envelope-switcher', EnvelopeSwitcher, false);

  defineIfNotExists('computer-keyboard', ComputerKeyboard, false);
  defineIfNotExists('piano-keyboard', PianoKeyboard, false);

  defineIfNotExists('keymap-select', KeymapSelect, false);
  defineIfNotExists('waveform-select', WaveformSelect, false);
  defineIfNotExists('input-select', InputSourceSelect, false);
  defineIfNotExists('rootnote-select', RootNoteSelect, false);

  defineIfNotExists('sampler-status', SamplerStatusElement, false);
};
