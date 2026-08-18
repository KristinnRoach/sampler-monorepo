import { define } from '../../vendor/van-element';

import {
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  PlaybackDirectionToggle,
  PitchToggle,
} from './SamplerToggleFactory';

import { EnvelopeSwitcher } from './EnvelopeSwitcher';
import { RecordButton, UploadButton, SaveButton } from './SamplerButtonFactory';
import { WaveformSelect, InputSourceSelect } from './SamplerSelectFactory';

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

  defineIfNotExists('envelope-switcher', EnvelopeSwitcher, false);

  defineIfNotExists('waveform-select', WaveformSelect, false);
  defineIfNotExists('input-select', InputSourceSelect, false);
};

export {
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  PlaybackDirectionToggle,
  PitchToggle,
  RecordButton,
  UploadButton,
  SaveButton,
  WaveformSelect,
  InputSourceSelect,
};
