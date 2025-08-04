// ToggleComponents.ts - Toggle and control components
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../../../SamplerRegistry';
import { Toggle } from '../../primitives/VanToggle';
import { INLINE_COMPONENT_STYLE } from '../../../shared/styles/component-styles';
import {
  createToggle,
  ToggleConfig,
} from '../../../shared/utils/component-utils';

// ===== TOGGLE CONFIGURATIONS =====

const feedbackModeConfig: ToggleConfig = {
  label: 'Feedback Mode',
  defaultValue: false, // false = monophonic, true = polyphonic
  onColor: '#4CAF50',
  offText: 'Monophonic',
  onText: 'Polyphonic',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => {
      const mode = state.val ? 'polyphonic' : 'monophonic';
      sampler.setFeedbackMode(mode);
    });
  },
};

const midiConfig: ToggleConfig = {
  label: 'MIDI',
  defaultValue: true,
  onColor: '#4CAF50',
  offText: 'OFF',
  onText: 'ON',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => {
      if (state.val) {
        if (
          sampler &&
          'enableMIDI' in sampler &&
          typeof sampler.enableMIDI === 'function'
        ) {
          sampler.enableMIDI();
        }
      } else {
        if (
          sampler &&
          'disableMIDI' in sampler &&
          typeof sampler.disableMIDI === 'function'
        ) {
          sampler.disableMIDI();
        }
      }
    });
  },
};

const loopLockConfig: ToggleConfig = {
  label: 'Loop Lock',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'FREE',
  onText: 'LOCKED',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.setLoopLocked(state.val));
  },
};

const holdLockConfig: ToggleConfig = {
  label: 'Hold Lock',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'FREE',
  onText: 'LOCKED',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.setHoldLocked(state.val));
  },
};

const gainLFOSyncConfig: ToggleConfig = {
  label: 'Gain LFO Sync',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'FREE',
  onText: 'SYNCED',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.syncLFOsToNoteFreq('gain-lfo', state.val));
  },
};

const pitchLFOSyncConfig: ToggleConfig = {
  label: 'Pitch LFO Sync',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'FREE',
  onText: 'SYNCED',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.syncLFOsToNoteFreq('pitch-lfo', state.val));
  },
};

const playbackDirectionConfig: ToggleConfig = {
  label: 'Direction',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'FORWARD',
  onText: 'REVERSE',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => {
      const direction = state.val === true ? 'reverse' : 'forward';
      sampler.setPlaybackDirection(direction);
    });
  },
};

const panDriftConfig: ToggleConfig = {
  label: 'Pan Drift',
  defaultValue: true,
  onColor: '#ff9800',
  offText: 'DISABLED',
  onText: 'ENABLED',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => {
      sampler.setPanDriftEnabled(state.val);
    });
  },
};

// ===== EXPORTED TOGGLE COMPONENTS =====

export const FeedbackModeToggle = createToggle(
  feedbackModeConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const MidiToggle = createToggle(
  midiConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const LoopLockToggle = createToggle(
  loopLockConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const HoldLockToggle = createToggle(
  holdLockConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const GainLFOSyncNoteToggle = createToggle(
  gainLFOSyncConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const PitchLFOSyncNoteToggle = createToggle(
  pitchLFOSyncConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const PlaybackDirectionToggle = createToggle(
  playbackDirectionConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const PanDriftToggle = createToggle(
  panDriftConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);
