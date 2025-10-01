import type { SamplePlayer } from '@repo/audio-components';
import {
  inputController,
  type NoteEvent,
  type ControlChangeEvent,
} from '@repo/input-controller';

type SamplePlayerAccessor = () => SamplePlayer | null | undefined;

type SetupOptions = {
  getSamplePlayer: SamplePlayerAccessor;
  onStateChange?: (enabled: boolean) => void;
  velocityTransform?: (event: NoteEvent) => number;
};

let midiNoteOnUnsub: (() => void) | null = null;
let midiNoteOffUnsub: (() => void) | null = null;
let midiControlChangeUnsub: (() => void) | null = null;
let enabled = false;
let stateChangeCallback: ((enabled: boolean) => void) | undefined;
let samplePlayerAccessor: SamplePlayerAccessor | null = null;
let sustainPedalActive = false;

const defaultVelocityTransform = (event: NoteEvent): number => {
  const velocity = typeof event.velocity === 'number' ? event.velocity : 0;
  return Math.max(0, Math.min(127, velocity));
};

export async function enableSamplePlayerMidi(
  options: SetupOptions
): Promise<boolean> {
  if (enabled) {
    return true;
  }

  const initialized = await inputController.init();
  if (!initialized) {
    return false;
  }

  const getSamplePlayer = options.getSamplePlayer;
  samplePlayerAccessor = getSamplePlayer;
  const transformVelocity =
    options.velocityTransform || defaultVelocityTransform;

  midiNoteOnUnsub = inputController.onNoteOn((event: NoteEvent) => {
    const player = getSamplePlayer();
    if (!player) return;

    const velocity = transformVelocity(event);
    player.play(event.note, velocity);
  });

  midiNoteOffUnsub = inputController.onNoteOff((event: NoteEvent) => {
    const player = getSamplePlayer();
    if (!player) return;

    player.release(event.note);
  });

  sustainPedalActive = false;

  midiControlChangeUnsub = inputController.onControlChange(
    (event: ControlChangeEvent) => {
      if (event.controller !== 64) return;

      const player = getSamplePlayer();
      if (!player) return;

      const pressed = event.value >= 64;
      if (pressed === sustainPedalActive) return;

      sustainPedalActive = pressed;

      if (pressed) {
        player.sustainPedalOn();
      } else {
        player.sustainPedalOff();
      }
    }
  );

  enabled = true;
  stateChangeCallback = options.onStateChange;
  stateChangeCallback?.(true);

  return true;
}

export function disableSamplePlayerMidi(): void {
  if (!enabled) {
    return;
  }

  midiNoteOnUnsub?.();
  midiNoteOffUnsub?.();
  midiControlChangeUnsub?.();
  midiNoteOnUnsub = null;
  midiNoteOffUnsub = null;
  midiControlChangeUnsub = null;

  if (sustainPedalActive && samplePlayerAccessor) {
    const player = samplePlayerAccessor();
    player?.sustainPedalOff();
  }

  sustainPedalActive = false;
  samplePlayerAccessor = null;
  enabled = false;

  stateChangeCallback?.(false);
  stateChangeCallback = undefined;
}

export function isSamplePlayerMidiEnabled(): boolean {
  return enabled;
}
