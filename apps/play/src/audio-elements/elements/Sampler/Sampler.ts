import { define } from '@repo/vanjs-core/element';

import {
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  PlaybackDirectionToggle,
  PitchToggle,
} from './components/SamplerToggleFactory';

import { EnvelopeDisplay } from './components/EnvelopeDisplay';
import { EnvelopeSwitcher } from './components/EnvelopeSwitcher';
import { PianoKeyboard } from './components/PianoKeyboard';
import {
  RecordButton,
  UploadButton,
  SaveButton,
} from './components/SamplerButtonFactory';
import {
  WaveformSelect,
  InputSourceSelect,
  RootNoteSelect,
} from './components/SamplerSelectFactory';
import { SamplerStatusElement } from './components/SamplerStatusElement';

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

  defineIfNotExists('midi-toggle', MidiToggle, false);
  defineIfNotExists('loop-lock-toggle', LoopLockToggle, false);
  defineIfNotExists('hold-lock-toggle', HoldLockToggle, false);
  defineIfNotExists(
    'playback-direction-toggle',
    PlaybackDirectionToggle,
    false,
  );
  defineIfNotExists('pitch-toggle', PitchToggle, false);

  defineIfNotExists('envelope-display', EnvelopeDisplay, false);
  defineIfNotExists('envelope-switcher', EnvelopeSwitcher, false);

  defineIfNotExists('piano-keyboard', PianoKeyboard, false);

  defineIfNotExists('waveform-select', WaveformSelect, false);
  defineIfNotExists('input-select', InputSourceSelect, false);
  defineIfNotExists('rootnote-select', RootNoteSelect, false);

  defineIfNotExists('sampler-status', SamplerStatusElement, false);
};

export {
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  PlaybackDirectionToggle,
  PitchToggle,
  PianoKeyboard,
  RecordButton,
  UploadButton,
  SaveButton,
  WaveformSelect,
  InputSourceSelect,
  RootNoteSelect,
  SamplerStatusElement,
  EnvelopeDisplay,
};
