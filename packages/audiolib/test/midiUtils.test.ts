import { describe, it, expect } from 'vitest';
import { midiToPlaybackRate, midiToDetune } from '../src/nodes/voice/midiUtils';
describe('midiUtils', () => {
  describe('midiToPlaybackRate', () => {
    it('returns 1 when midiNote equals baseNote', () => {
      expect(midiToPlaybackRate(60, 60)).toBe(1);
    });

    it('returns 2 when midiNote is 12 semitones above baseNote', () => {
      expect(midiToPlaybackRate(72, 60)).toBe(2);
    });

    it('returns 0.5 when midiNote is 12 semitones below baseNote', () => {
      expect(midiToPlaybackRate(48, 60)).toBe(0.5);
    });

    it('uses default baseNote of 60 when not provided', () => {
      expect(midiToPlaybackRate(60)).toBe(1);
      expect(midiToPlaybackRate(72)).toBe(2);
    });
  });

  describe('midiToDetune', () => {
    it('returns 0 when midiNote equals baseNote', () => {
      expect(midiToDetune(60, 60)).toBe(0);
    });

    it('returns 1200 cents when midiNote is 12 semitones above baseNote', () => {
      expect(midiToDetune(72, 60)).toBe(1200);
    });

    it('returns -1200 cents when midiNote is 12 semitones below baseNote', () => {
      expect(midiToDetune(48, 60)).toBe(-1200);
    });

    it('uses default baseNote of 60 when not provided', () => {
      expect(midiToDetune(60)).toBe(0);
      expect(midiToDetune(72)).toBe(1200);
    });
  });
});
