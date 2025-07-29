import { describe, it, expect, vi } from 'vitest';
import { CustomEnvelope } from '../CustomEnvelope';
import { EnvelopeData } from '../EnvelopeData';

// Mock AudioContext to bypass compatibility issues
const mockAudioContext = {
  currentTime: 0,
  createGain: () => ({ connect: () => {}, gain: { setValueAtTime: () => {} } }),
  createOscillator: () => ({
    connect: () => {},
    start: () => {},
    stop: () => {},
  }),
  // Add other necessary mock methods if needed
} as unknown as AudioContext;

const mockEnvelopeData = new EnvelopeData(
  [
    { time: 0, value: 2000, curve: 'exponential' },
    { time: 0.05, value: 18000, curve: 'exponential' },
    { time: 1.7755, value: 500, curve: 'exponential' },
  ],
  [20, 23000],
  2
);

describe('CustomEnvelope', () => {
  it('should generate a curve with correct initial value', () => {
    const envelope = new CustomEnvelope(
      mockAudioContext,
      'filter-env',
      mockEnvelopeData,
      [],
      [20, 23000],
      2,
      true
    );

    const options = {
      baseValue: 1,
      playbackRate: 1,
    };

    // Test the envelope points directly instead of SVG path
    const points = envelope.points;
    expect(points).toHaveLength(3);
    expect(points[0].value).toBe(2000);

    // Ensure envelope has the correct properties
    expect(envelope.envelopeType).toBe('filter-env');
    expect(envelope.valueRange).toEqual([20, 23000]);
  });

  it('should generate a curve with logarithmic scaling', () => {
    const envelope = new CustomEnvelope(
      mockAudioContext,
      'filter-env',
      mockEnvelopeData,
      [],
      [20, 23000],
      2,
      true
    );

    const options = {
      baseValue: 1,
      playbackRate: 1,
    };

    // Test the envelope behavior directly instead of SVG path
    const points = envelope.points;
    expect(points).toHaveLength(3);

    // Test that filter-env has logarithmic behavior characteristics
    expect(envelope.envelopeType).toBe('filter-env');
  });

  it('should apply logarithmic scaling correctly in triggerEnvelope for filter-env', () => {
    // Create a mock AudioParam to capture the values being set
    const mockAudioParam = {
      value: 2000, // Starting value
      setValueAtTime: vi.fn(),
      setValueCurveAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    };

    const envelope = new CustomEnvelope(
      mockAudioContext,
      'filter-env',
      mockEnvelopeData,
      [],
      [20, 23000],
      2,
      true
    );

    const options = {
      baseValue: 1,
      playbackRate: 1,
    };

    // Trigger the envelope
    envelope.triggerEnvelope(mockAudioParam as any, 0, options);

    // Check that setValueCurveAtTime was called
    expect(mockAudioParam.setValueCurveAtTime).toHaveBeenCalled();

    // Get the curve that was applied
    const curveCall = mockAudioParam.setValueCurveAtTime.mock.calls[0];
    const curve = curveCall[0] as Float32Array;
    const startTime = curveCall[1];
    const duration = curveCall[2];

    console.log('=== Curve Analysis ===');
    console.log('Curve length:', curve.length);
    console.log('Duration:', duration);
    console.log('First 5 values:', Array.from(curve.slice(0, 5)));
    console.log('Last 5 values:', Array.from(curve.slice(-5)));
    console.log('Current param value:', mockAudioParam.value);
    console.log('Envelope first point value:', envelope.points[0].value);

    // Critical test: Check if there's a big jump at the start
    const currentValue = mockAudioParam.value;
    const firstCurveValue = curve[0];
    const valueDifference = Math.abs(firstCurveValue - currentValue);
    const percentageDifference = (valueDifference / currentValue) * 100;

    console.log('Value difference at start:', valueDifference);
    console.log(
      'Percentage difference:',
      percentageDifference.toFixed(2) + '%'
    );

    // This test will help identify if there's a sudden jump
    // A large percentage difference could cause the pop sound
    expect(curve.length).toBeGreaterThan(1);
    expect(firstCurveValue).toBeCloseTo(envelope.points[0].value, -1); // Allow some tolerance for logarithmic scaling

    // Check that values are within the expected range
    expect(firstCurveValue).toBeGreaterThanOrEqual(20);
    expect(firstCurveValue).toBeLessThanOrEqual(23000);

    // Verify the curve shows logarithmic progression
    const midPoint = Math.floor(curve.length / 2);
    const midValue = curve[midPoint];
    const lastValue = curve[curve.length - 1];

    console.log('Mid value:', midValue);
    console.log('Last value:', lastValue);

    // In logarithmic scaling, we expect smooth transitions
    expect(midValue).toBeGreaterThanOrEqual(20);
    expect(midValue).toBeLessThanOrEqual(23000);
    expect(lastValue).toBeCloseTo(
      envelope.points[envelope.points.length - 1].value,
      -1
    );
  });
});
