import { getAudioContext } from '@/context';
import { KarplusStrongSynth } from './KarplusStrongSynth';
import { assert } from '@/utils';
import { MidiController } from '@/io';

/**
 * Creates a new KarplusStrongSynth instance
 *
 * @param polyphony - Number of voices for polyphony (default: 8)
 * @param ctx - Optional AudioContext (will use global context if not provided)
 * @param enableMidi - Whether to enable MIDI input automatically (default: false)
 * @param midiController - Optional custom MIDI controller to use
 * @returns A new KarplusStrongSynth instance
 */
export function createKarplusStrongSynth(
  polyphony: number = 8,
  ctx: AudioContext = getAudioContext(),
  enableMidi: boolean = false,
  midiController?: MidiController
): KarplusStrongSynth {
  assert(ctx, 'Audio context is not available');

  // Create the synthesizer
  const synth = new KarplusStrongSynth(polyphony);
  assert(synth, 'Failed to create KarplusStrongSynth');

  // Enable MIDI if requested
  if (enableMidi && midiController) {
    synth.enableMIDI(midiController);
  }

  return synth;
}
