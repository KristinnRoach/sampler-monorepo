import { Recorder } from './Recorder';
import { getAudioContext } from '@/context';

/**
 * Creates and initializes a new audio recorder
 *
 * @param context - Optional AudioContext to use. If not provided, the global audio context will be used.
 * @returns A promise that resolves to the initialized Recorder instance
 * @example
 * ```ts
 * Create and initialize a recorder
 * const recorder = await createAudioRecorder();
 *
 * Connect to a sample player
 * recorder.connect(player);
 *
 * Start recording
 * await recorder.start();
 *
 * Stop recording and automatically load the sample to the connected destination
 * const buffer = await recorder.stop();
 * ```
 */
async function createAudioRecorder(context?: AudioContext): Promise<Recorder> {
  const audioContext = context || getAudioContext();
  const recorder = new Recorder(audioContext);
  return await recorder.init();
}

export { createAudioRecorder, Recorder };
