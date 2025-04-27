import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDevices,
  getMicrophone,
  getCamera,
  getMIDIAccess,
  getAudioInputDevices,
  getAudioOutputDevices,
  getVideoInputDevices,
  onDeviceChange,
} from './index';

describe('Device Access Utils', () => {
  const mockDevices = [
    { deviceId: '1', label: 'Mic 1', kind: 'audioinput' },
    { deviceId: '2', label: 'Speaker 1', kind: 'audiooutput' },
    { deviceId: '3', label: 'Camera 1', kind: 'videoinput' },
  ] as MediaDeviceInfo[];

  const mockStream = { getTracks: () => [] } as unknown as MediaStream;

  beforeEach(() => {
    // Mock navigator.mediaDevices
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      requestMIDIAccess: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDevices', () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
      console.error = vi.fn(); // Suppress console.error during tests
    });

    afterEach(() => {
      console.error = originalConsoleError; // Restore original console.error
    });

    it('returns list of available devices', async () => {
      const devices = await getDevices();
      expect(devices).toHaveLength(3);
      expect(devices[0]).toEqual({
        deviceId: '1',
        label: 'Mic 1',
        kind: 'audioinput',
      });
    });

    it('handles enumeration errors gracefully', async () => {
      vi.mocked(navigator.mediaDevices.enumerateDevices).mockRejectedValue(
        new Error('Permission denied')
      );
      const devices = await getDevices();
      expect(devices).toEqual([]);
    });
  });

  describe('Device Access Functions', () => {
    it('gets microphone access', async () => {
      const result = await getMicrophone();
      expect(result).toBe(mockStream);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    });

    it('gets camera access', async () => {
      const result = await getCamera();
      expect(result).toBe(mockStream);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          width: 1280,
          height: 720,
          facingMode: 'user',
        },
      });
    });

    it('handles MIDI access', async () => {
      const mockMIDIAccess = {
        inputs: new Map(),
        outputs: new Map(),
      };
      vi.mocked(navigator.requestMIDIAccess).mockResolvedValue(
        mockMIDIAccess as unknown as MIDIAccess
      );

      const result = await getMIDIAccess();
      expect(result).toBe(mockMIDIAccess);
    });

    it('handles MIDI access errors', async () => {
      vi.mocked(navigator.requestMIDIAccess).mockRejectedValue(
        new Error('MIDI not supported')
      );

      const result = await getMIDIAccess();
      expect(result).toEqual({
        type: 'UnknownError',
        message: 'MIDI not supported',
      });
    });
  });

  describe('Device Filtering Functions', () => {
    it('filters devices by type', async () => {
      const audioInputs = await getAudioInputDevices();
      const audioOutputs = await getAudioOutputDevices();
      const videoInputs = await getVideoInputDevices();

      expect(audioInputs).toHaveLength(1);
      expect(audioOutputs).toHaveLength(1);
      expect(videoInputs).toHaveLength(1);

      expect(audioInputs[0].kind).toBe('audioinput');
      expect(audioOutputs[0].kind).toBe('audiooutput');
      expect(videoInputs[0].kind).toBe('videoinput');
    });
  });

  describe('Device Change Monitoring', () => {
    it('sets up device change listener', () => {
      const callback = vi.fn();
      const cleanup = onDeviceChange(callback);

      expect(navigator.mediaDevices.addEventListener).toHaveBeenCalledWith(
        'devicechange',
        callback
      );

      cleanup();
      expect(navigator.mediaDevices.removeEventListener).toHaveBeenCalledWith(
        'devicechange',
        callback
      );
    });
  });
});
