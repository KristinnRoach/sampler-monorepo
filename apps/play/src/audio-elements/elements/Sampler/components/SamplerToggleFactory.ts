// SamplerToggleFactory.ts - Toggle and control components
import van from '@repo/vanjs-core';
import { getSamplePlayer } from '../../../../App';
import { createSVGButton } from '../../primitives/createSVGButton';

const { div } = van.tags;

export const MidiToggle = () => {
  const toggleButton = createSVGButton('Toggle MIDI', ['midi_on', 'midi_off'], {
    size: 'md',
    onClick: () => {
      // TODO: Finish refacoring to use centralized input handling package
      // const sampler = getSamplePlayer();
      // if (!sampler) return;
      // const currentState = toggleButton.getState();
      // if (currentState === 'midi_on') {
      //   sampler.enableMIDI();
      // } else {
      //   sampler.disableMIDI();
      // }
    },
    initialState: 'midi_on',
  });

  return div({ style: '' }, toggleButton);
};

export const PlaybackDirectionToggle = () => {
  const toggleButton = createSVGButton(
    'Toggle Playback Direction',
    ['direction_forward', 'direction_reverse'],
    {
      size: 'md',
      onClick: () => {
        const sampler = getSamplePlayer();
        if (!sampler) return;

        const currentState = toggleButton.getState();
        const direction =
          currentState === 'direction_reverse' ? 'reverse' : 'forward';
        sampler.setPlaybackDirection(direction);
      },
    }
  );

  return div({ style: '' }, toggleButton);
};

export const LoopLockToggle = () => {
  const toggleButton = createSVGButton(
    'Toggle Loop Locked',
    ['loop_locked', 'loop_unlocked'],
    {
      size: 'md',
      onClick: () => {
        const sampler = getSamplePlayer();
        if (!sampler) return;

        const currentState = toggleButton.getState();
        const shouldLock = currentState === 'loop_locked';

        sampler.setLoopLocked(shouldLock);
      },
      initialState: 'loop_unlocked',
    }
  );

  return div({ style: '' }, toggleButton);
};

export const HoldLockToggle = () => {
  const toggleButton = createSVGButton(
    'Toggle Hold Locked',
    ['hold_locked', 'hold_unlocked'],
    {
      size: 'md',
      onClick: () => {
        const sampler = getSamplePlayer();
        if (!sampler) return;

        const currentState = toggleButton.getState();
        const shouldLock = currentState === 'hold_locked';

        sampler.setHoldLocked(shouldLock);
      },
      initialState: 'hold_unlocked',
    }
  );

  return div({ style: '' }, toggleButton);
};

export const PitchToggle = () => {
  const toggleButton = createSVGButton(
    'Toggle Pitch',
    ['pitch_on', 'pitch_off'],
    {
      size: 'md',
      onClick: () => {
        const sampler = getSamplePlayer();
        if (!sampler) return;

        const currentState = toggleButton.getState();

        if (currentState === 'pitch_on') sampler.enablePitch();
        else if (currentState === 'pitch_off') sampler.disablePitch();
      },
    }
  );

  return div({ style: '' }, toggleButton);
};
