import { getAudioContext } from '@/context';
import { SamplePlayer } from './SamplePlayer';
import { assert } from '@/utils';
import { MidiController } from '@/io';

/**
 * Creates a new SamplePlayer instance
 *
 * @param audioBuffer - Optional audio buffer to use (will use default if not provided)
 * @param polyphony - Number of voices for polyphony (default: 16)
 * @param ctx - Optional AudioContext (will use global context if not provided)
 * @returns A new SamplePlayer instance
 */
export function createSamplePlayer(
  audioBuffer?: AudioBuffer,
  polyphony: number = 16,
  ctx: AudioContext = getAudioContext(),
  midiController?: MidiController
): SamplePlayer {
  assert(ctx, 'Audio context is not available');

  // Create the sample player
  const samplePlayer = new SamplePlayer(
    ctx,
    polyphony,
    audioBuffer,
    midiController
  );
  assert(samplePlayer, 'Failed to create SamplePlayer');

  return samplePlayer;
}
