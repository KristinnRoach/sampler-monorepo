// SamplerToggleFactory.ts - Toggle and control components
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';
import { Toggle } from '../../primitives/VanToggle';
import {
  COMPONENT_STYLE,
  INLINE_COMPONENT_STYLE,
} from '../../../shared/styles/component-styles';
import {
  createToggle,
  ToggleConfig,
} from '../../../shared/utils/component-utils';

// ===== TOGGLE CONFIGURATIONS =====

const feedbackModeConfig: ToggleConfig = {
  label: 'FB-Mode',
  defaultValue: true, // false = monophonic, true = polyphonic
  onColor: '#4CAF50',
  offText: 'Mono',
  onText: 'Poly',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => {
      const mode = state.val ? 'polyphonic' : 'monophonic';
      sampler.setFeedbackMode(mode);
    });
  },
};

const midiConfig: ToggleConfig = {
  label: '',
  defaultValue: true,
  onColor: '#4CAF50',
  offText: 'MIDI off',
  onText: 'MIDI on',
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

const pitchToggleConfig: ToggleConfig = {
  label: '',
  defaultValue: true,
  onColor: '#4CAF50',
  offText: 'Pitch off',
  onText: 'Pitch on',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => {
      if (state.val) {
        if (
          sampler &&
          'enablePitch' in sampler &&
          typeof sampler.enablePitch === 'function'
        ) {
          sampler.enablePitch();
        }
      } else {
        if (
          sampler &&
          'disablePitch' in sampler &&
          typeof sampler.disablePitch === 'function'
        ) {
          sampler.disablePitch();
        }
      }
    });
  },
};

const loopLockConfig: ToggleConfig = {
  label: '',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'Loop 🔓',
  onText: 'Loop 🔒',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.setLoopLocked(state.val));
  },
};

const holdLockConfig: ToggleConfig = {
  label: '',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'Hold 🔓',
  onText: 'Hold 🔒',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.setHoldLocked(state.val));
  },
};

const gainLFOSyncConfig: ToggleConfig = {
  label: 'Amp LFO',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'Free',
  onText: 'Sync',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.syncLFOsToNoteFreq('gain-lfo', state.val));
  },
};

const pitchLFOSyncConfig: ToggleConfig = {
  label: 'Pitch LFO',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'Free',
  onText: 'Sync',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => sampler.syncLFOsToNoteFreq('pitch-lfo', state.val));
  },
};

const playbackDirectionConfig: ToggleConfig = {
  label: '',
  defaultValue: false,
  onColor: '#ff9800',
  offText: 'Forward',
  onText: 'Reverse',
  onSamplerConnect: (sampler, state, van) => {
    van.derive(() => {
      const direction = state.val === true ? 'reverse' : 'forward';
      sampler.setPlaybackDirection(direction);
    });
  },
};

const panDriftConfig: ToggleConfig = {
  label: 'Pan drift',
  defaultValue: true,
  onColor: '#ff9800',
  offText: '○',
  onText: '◐',
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

export const PitchToggle = createToggle(
  pitchToggleConfig,
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
