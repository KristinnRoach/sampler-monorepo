export type DeviceInfo = {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
};

// Device-specific type aliases for better type safety
export type AudioInputDevice = DeviceInfo & { kind: 'audioinput' };
export type AudioOutputDevice = DeviceInfo & { kind: 'audiooutput' };
export type VideoInputDevice = DeviceInfo & { kind: 'videoinput' };

// Get list of available devices
export async function getDevices(): Promise<DeviceInfo[]> {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.map((device) => ({
      deviceId: device.deviceId,
      label: device.label,
      kind: device.kind,
    }));
  } catch (error) {
    console.error('Failed to enumerate devices:', error);
    return [];
  }
}

// Audio Input (Microphone)
export async function getMicrophone(
  constraints: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: true, // ?
    autoGainControl: true, // ?
  }
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: constraints,
  });
  return stream;
}

// Video Input (Camera)
export async function getCamera(
  constraints: MediaTrackConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  }
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: constraints,
  });
}

// MIDI Access
export async function getMIDIAccess(): Promise<MIDIAccess> {
  if (!navigator.requestMIDIAccess) {
    throw new Error('MIDI access not supported in this browser');
  }
  return navigator.requestMIDIAccess();
}

// Device Selection Helpers
export async function getAudioInputDevices(): Promise<AudioInputDevice[]> {
  const devices = await getDevices();
  return devices.filter((d) => d.kind === 'audioinput') as AudioInputDevice[];
}

export async function getAudioOutputDevices(): Promise<AudioOutputDevice[]> {
  const devices = await getDevices();
  return devices.filter((d) => d.kind === 'audiooutput') as AudioOutputDevice[];
}

export async function getVideoInputDevices(): Promise<VideoInputDevice[]> {
  const devices = await getDevices();
  return devices.filter((d) => d.kind === 'videoinput') as VideoInputDevice[];
}

// Device Change Monitoring
export function onDeviceChange(callback: () => void): () => void {
  navigator.mediaDevices.addEventListener('devicechange', callback);
  return () =>
    navigator.mediaDevices.removeEventListener('devicechange', callback);
}
