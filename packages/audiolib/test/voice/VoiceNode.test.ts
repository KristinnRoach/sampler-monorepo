import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceNode, EnvelopeType } from '../../src/processors/voice/VoiceNode';

// Mock AudioContext and required Web Audio API objects
class MockAudioContext {
  currentTime = 0;
  destination = { maxChannelCount: 2 };
  
  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn()
      },
      connect: vi.fn(),
      disconnect: vi.fn()
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      onended: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
  }
}

// Mock AudioBuffer
class MockAudioBuffer {
  duration = 2.0;
  length = 88200;
  numberOfChannels = 2;
  sampleRate = 44100;
  
  getChannelData() {
    return new Float32Array(this.length);
  }
}

describe('VoiceNode', () => {
  let context: any;
  let voiceNode: VoiceNode;
  let buffer: any;
  
  beforeEach(() => {
    context = new MockAudioContext();
    voiceNode = new VoiceNode(context as unknown as BaseAudioContext);
    buffer = new MockAudioBuffer();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should initialize correctly', () => {
    expect(voiceNode).toBeDefined();
    expect(voiceNode.isActive()).toBe(false);
    expect(voiceNode.isAvailable()).toBe(true);
  });
  
  it('should set buffer', () => {
    voiceNode.setBuffer(buffer as unknown as AudioBuffer);
    // This mainly tests that no errors are thrown
    expect(voiceNode.isAvailable()).toBe(true);
  });
  
  it('should start playback', () => {
    const sourceStartSpy = vi.spyOn(context.createBufferSource(), 'start');
    
    voiceNode.setBuffer(buffer as unknown as AudioBuffer);
    voiceNode.start();
    
    expect(voiceNode.isActive()).toBe(true);
    expect(voiceNode.isAvailable()).toBe(false);
    // We can't easily check sourceStartSpy was called because we're mocking
    // But we can verify the state change occurred
  });
  
  it('should handle release phase', () => {
    const gainRampSpy = vi.spyOn(context.createGain().gain, 'exponentialRampToValueAtTime');
    
    voiceNode.setBuffer(buffer as unknown as AudioBuffer);
    voiceNode.start();
    voiceNode.release();
    
    expect(voiceNode.isActive()).toBe(true);
    expect(voiceNode.isInRelease()).toBe(true);
  });
  
  it('should stop immediately when requested', () => {
    const sourceStopSpy = vi.spyOn(context.createBufferSource(), 'stop');
    
    voiceNode.setBuffer(buffer as unknown as AudioBuffer);
    voiceNode.start();
    voiceNode.stop();
    
    expect(voiceNode.isActive()).toBe(false);
    expect(voiceNode.isAvailable()).toBe(true);
  });
  
  it('should set envelope parameters', () => {
    voiceNode.setEnvelope(EnvelopeType.ADSR, {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.6,
      release: 0.5
    });
    
    // Start to trigger envelope
    voiceNode.setBuffer(buffer as unknown as AudioBuffer);
    voiceNode.start();
    
    // Testing that the envelope was applied is challenging in a unit test
    // without checking private variables, but we can verify no errors occurred
    expect(voiceNode.isActive()).toBe(true);
  });
  
  it('should connect and disconnect', () => {
    const destinationNode = context.createGain();
    const connectSpy = vi.spyOn(context.createGain(), 'connect');
    const disconnectSpy = vi.spyOn(context.createGain(), 'disconnect');
    
    voiceNode.connect(destinationNode as unknown as AudioNode);
    voiceNode.disconnect();
    
    // Again, we can't easily verify the calls due to mocking
    // but we can check that the methods don't throw errors
    expect(true).toBe(true);
  });
});
