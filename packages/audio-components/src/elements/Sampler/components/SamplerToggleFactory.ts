// SamplerToggleFactory.ts - Toggle and control components
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';
import { Toggle } from '../../primitives/VanToggle';
import { INLINE_COMPONENT_STYLE } from '../../../shared/styles/component-styles';
import { createToggleForTarget, ToggleConfig } from '../component-utils';

import { createSVGButton } from '../../primitives/createSVGButton';

const { div } = van.tags;

export const MidiToggle = (attributes: ElementProps) => {
  const targetNodeId = attributes.attr('target-node-id', '');

  const toggleButton = createSVGButton('Toggle MIDI', ['midi_on', 'midi_off'], {
    size: 'md',
    onClick: () => {
      const sampler = getSampler(targetNodeId.val);
      if (!sampler) return;

      const currentState = (toggleButton as any).getState();

      if (currentState === 'midi_on') {
        sampler.enableMIDI();
      } else {
        sampler.disableMIDI();
      }
    },
    initialState: 'midi_on',
  });

  return div({ style: '' }, toggleButton); // INLINE_COMPONENT_STYLE
};

export const PlaybackDirectionToggle = (attributes: ElementProps) => {
  const targetNodeId = attributes.attr('target-node-id', '');

  const toggleButton = createSVGButton(
    'Toggle Playback Direction',
    ['direction_forward', 'direction_reverse'],
    {
      size: 'md',
      onClick: () => {
        const sampler = getSampler(targetNodeId.val);
        if (!sampler) return;

        const currentState = (toggleButton as any).getState();
        const direction =
          currentState === 'direction_reverse' ? 'reverse' : 'forward';
        sampler.setPlaybackDirection(direction);
      },
    }
  );

  return div({ style: '' }, toggleButton); // INLINE_COMPONENT_STYLE
};

export const LoopLockToggle = (attributes: ElementProps) => {
  const targetNodeId = attributes.attr('target-node-id', '');

  const toggleButton = createSVGButton(
    'Toggle Loop Locked',
    ['loop_locked', 'loop_unlocked'],
    {
      size: 'md',
      onClick: () => {
        const sampler = getSampler(targetNodeId.val);
        if (!sampler) return;

        const currentState = (toggleButton as any).getState();
        const shouldLock = currentState === 'loop_locked';

        sampler.setLoopLocked(shouldLock);
      },
      initialState: 'loop_unlocked',
    }
  );

  return div({ style: '' }, toggleButton); // INLINE_COMPONENT_STYLE
};

export const HoldLockToggle = (attributes: ElementProps) => {
  const targetNodeId = attributes.attr('target-node-id', '');

  const toggleButton = createSVGButton(
    'Toggle Hold Locked',
    ['hold_locked', 'hold_unlocked'],
    {
      size: 'md',
      onClick: () => {
        const sampler = getSampler(targetNodeId.val);
        if (!sampler) return;

        const currentState = (toggleButton as any).getState();
        const shouldLock = currentState === 'hold_locked';

        sampler.setHoldLocked(shouldLock);
      },
      initialState: 'hold_unlocked',
    }
  );

  return div({ style: '' }, toggleButton); // INLINE_COMPONENT_STYLE
};

export const PitchToggle = (attributes: ElementProps) => {
  const targetNodeId = attributes.attr('target-node-id', '');

  const toggleButton = createSVGButton(
    'Toggle Pitch',
    ['pitch_on', 'pitch_off'],
    {
      size: 'md',
      onClick: () => {
        const sampler = getSampler(targetNodeId.val);
        if (!sampler) return;

        const currentState = (toggleButton as any).getState();

        if (currentState === 'pitch_on') sampler.enablePitch();
        else if (currentState === 'pitch_off') sampler.disablePitch();
      },
    }
  );

  return div({ style: '' }, toggleButton); // INLINE_COMPONENT_STYLE
};

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

// ===== TOGGLE COMPONENTS USING CONFIG =====

export const FeedbackModeToggle = createToggleForTarget(
  feedbackModeConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const GainLFOSyncNoteToggle = createToggleForTarget(
  gainLFOSyncConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const PitchLFOSyncNoteToggle = createToggleForTarget(
  pitchLFOSyncConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

export const PanDriftToggle = createToggleForTarget(
  panDriftConfig,
  getSampler,
  Toggle,
  van,
  INLINE_COMPONENT_STYLE
);

// const midiConfig: ToggleConfig = {
//   label: '',
//   defaultValue: true,
//   onColor: '#4CAF50',
//   offText: 'MIDI off',
//   onText: 'MIDI on',
//   onSamplerConnect: (sampler, state, van) => {
//     van.derive(() => {
//       if (state.val) {
//         if (
//           sampler &&
//           'enableMIDI' in sampler &&
//           typeof sampler.enableMIDI === 'function'
//         ) {
//           sampler.enableMIDI();
//         }
//       } else {
//         if (
//           sampler &&
//           'disableMIDI' in sampler &&
//           typeof sampler.disableMIDI === 'function'
//         ) {
//           sampler.disableMIDI();
//         }
//       }
//     });
//   },
// };

// const pitchToggleConfig: ToggleConfig = {
//   label: '',
//   defaultValue: true,
//   onColor: '#4CAF50',
//   offText: 'Pitch off',
//   onText: 'Pitch on',
//   onSamplerConnect: (sampler, state, van) => {
//     van.derive(() => {
//       if (state.val) {
//         if (
//           sampler &&
//           'enablePitch' in sampler &&
//           typeof sampler.enablePitch === 'function'
//         ) {
//           sampler.enablePitch();
//         }
//       } else {
//         if (
//           sampler &&
//           'disablePitch' in sampler &&
//           typeof sampler.disablePitch === 'function'
//         ) {
//           sampler.disablePitch();
//         }
//       }
//     });
//   },
// };

// const holdLockConfig: ToggleConfig = {
//   label: '',
//   defaultValue: false,
//   onColor: '#ff9800',
//   offText: 'Hold 🔓',
//   onText: 'Hold 🔒',
//   onSamplerConnect: (sampler, state, van) => {
//     van.derive(() => sampler.setHoldLocked(state.val));
//   },
// };

// const loopLockConfig: ToggleConfig = {
//   label: '',
//   defaultValue: false,
//   onColor: '#ff9800',
//   offText: 'Loop 🔓',
//   onText: 'Loop 🔒',
//   onSamplerConnect: (sampler, state, van) => {
//     van.derive(() => sampler.setLoopLocked(state.val));
//   },
// };

// const playbackDirectionConfig: ToggleConfig = {
//   label: '',
//   defaultValue: false,
//   onColor: '#ff9800',
//   offText: 'Forward',
//   onText: 'Reverse',
//   onSamplerConnect: (sampler, state, van) => {
//     van.derive(() => {
//       const direction = state.val === true ? 'reverse' : 'forward';
//       sampler.setPlaybackDirection(direction);
//     });
//   },
// };

// export const MidiToggle = createToggle(
//   midiConfig,
//   getSampler,
//   Toggle,
//   van,
//   INLINE_COMPONENT_STYLE
// );

// export const PitchToggle = createToggle(
//   pitchToggleConfig,
//   getSampler,
//   Toggle,
//   van,
//   INLINE_COMPONENT_STYLE
// );

// export const LoopLockToggle = createToggle(
//   loopLockConfig,
//   getSampler,
//   Toggle,
//   van,
//   INLINE_COMPONENT_STYLE
// );

// export const HoldLockToggle = createToggle(
//   holdLockConfig,
//   getSampler,
//   Toggle,
//   van,
//   INLINE_COMPONENT_STYLE
// );

// export const PlaybackDirectionToggle = createToggle(
//   playbackDirectionConfig,
//   getSampler,
//   Toggle,
//   van,
//   INLINE_COMPONENT_STYLE
// );
