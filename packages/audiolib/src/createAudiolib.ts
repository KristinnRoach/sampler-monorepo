import { Audiolib } from './Audiolib';
import { MidiController } from '@/io';
import { getAudioContext } from '@/context';

export interface AudiolibOptions {
  audioContext?: AudioContext;
  midiController?: MidiController;
  autoInit?: boolean;
}

/**
 * Creates a new Audiolib instance with optional configuration
 *
 * @param options Configuration options for the Audiolib instance
 * @returns A new Audiolib instance
 */
export async function createAudiolib(
  options: AudiolibOptions = {}
): Promise<Audiolib> {
  // Create shared resources if not provided
  const ctx = options.audioContext || getAudioContext();
  const midiController = options.midiController || new MidiController();

  // Create the Audiolib instance
  const audiolib = new Audiolib({
    audioContext: ctx,
    midiController: midiController,
  });

  // Initialize if requested
  if (options.autoInit !== false) {
    await audiolib.init();
  }

  return audiolib;
}

// For backward compatibility, maintain a singleton instance
let _instance: Audiolib | null = null;

/**
 * Gets or creates a shared Audiolib instance (for backward compatibility)
 * @deprecated Use createAudiolib() for better tree-shaking
 */
export const getInstance = () => {
  if (!_instance) {
    _instance = new Audiolib();
  }
  return _instance;
};
