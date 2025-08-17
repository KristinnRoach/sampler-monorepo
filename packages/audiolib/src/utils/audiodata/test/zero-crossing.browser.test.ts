import { describe, it, expect } from 'vitest';
import {
  findZeroCrossings,
  snapToNearestZeroCrossing,
  findWaveCycles,
} from '../zero-crossing';

class MockAudioBuffer {
  constructor(
    public data: number[],
    public sampleRate = 44100
  ) {}
  getChannelData(channel: number) {
    return Float32Array.from(this.data);
  }
}

describe('zero-crossing utils', () => {
  it('findZeroCrossings detects zero crossings', () => {
    const buffer = new MockAudioBuffer([1, -1, 1, -1]);
    const crossings = findZeroCrossings(buffer as any);
    expect(crossings.length).toBeGreaterThan(0);
  });

  it('snapToNearestZeroCrossing returns closest crossing', () => {
    const crossings = [0.01, 0.02, 0.03];
    expect(snapToNearestZeroCrossing(0.025, crossings)).toBeCloseTo(0.03);
  });

  it('findWaveCycles returns cycles', () => {
    const buffer = new MockAudioBuffer([1, -1, 1, -1]);
    const cycles = findWaveCycles(buffer as any);
    expect(Array.isArray(cycles)).toBe(true);
  });
});
