// createSamplePlayer.ts

import { getAudioContext, ensureAudioCtx } from '@/context';
import { SamplePlayer } from './SamplePlayer';
import { assert } from '@/utils';
import { MidiController } from '@/io';

import { initProcessors } from '@/worklets';
import { initIdb } from '@/storage/idb';
import { fetchInitSampleAsAudioBuffer } from '@/storage/assets/asset-utils';

/**
 * Creates a new SamplePlayer instance
 *
 * @param audioBuffer - Optional audio buffer to use (will use default if not provided)
 * @param polyphony - Number of voices for polyphony (default: 16)
 * @param context - Optional AudioContext (will use global context if not provided)
 * @returns A new SamplePlayer instance
 */
export async function createSamplePlayer(
  audioBuffer?: AudioBuffer,
  polyphony: number = 16,
  context: AudioContext = getAudioContext(),
  midiController?: MidiController
): Promise<SamplePlayer> {
  await ensureAudioCtx();
  assert(context, 'Audio context is not available');

  const workletResult = await initProcessors(context); // Ensure worklets are registered

  if (!workletResult.success) {
    // AudioWorklet is not supported on this browser
    throw new Error(
      'AudioWorklet is required but not supported on this browser. ' +
        'Please use a modern desktop browser (Chrome, Firefox, Edge) or update your mobile browser.'
    );
  }

  // Get buffer - only initialize IndexedDB if no buffer is provided
  let buffer: AudioBuffer;
  if (audioBuffer) {
    buffer = audioBuffer;
  } else {
    await initIdb(); // Only initialize IndexedDB when needed
    buffer = await fetchInitSampleAsAudioBuffer();
  }

  const samplePlayer = new SamplePlayer(
    context,
    polyphony,
    buffer,
    midiController
  );

  await samplePlayer.init();

  return samplePlayer;
}
