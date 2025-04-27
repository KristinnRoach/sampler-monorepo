export type DeviceInfo = {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
};

export type AudioInputDevice = DeviceInfo & {
  kind: 'audioinput';
};

export type AudioOutputDevice = DeviceInfo & {
  kind: 'audiooutput';
};

export type VideoInputDevice = DeviceInfo & {
  kind: 'videoinput';
};

export type DeviceAccessError = {
  type:
    | 'NotAllowedError'
    | 'NotFoundError'
    | 'NotSupportedError'
    | 'UnknownError';
  message: string;
};

// Helper function to handle errors
function handleDeviceError(error: unknown): DeviceAccessError {
  if (error instanceof Error) {
    // Map common error names to our DeviceAccessError types
    const errorTypeMap: Record<string, DeviceAccessError['type']> = {
      NotAllowedError: 'NotAllowedError',
      NotFoundError: 'NotFoundError',
      NotSupportedError: 'NotSupportedError',
      // Add any other specific error mappings here
    };

    return {
      type: errorTypeMap[error.name] || 'UnknownError',
      message: error.message,
    };
  }
  return {
    type: 'UnknownError',
    message: String(error),
  };
}

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
    console.error('Failed to enumerate devices:', handleDeviceError(error));
    return [];
  }
}

// Audio Input (Microphone)
export async function getMicrophone(
  constraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
): Promise<MediaStream | DeviceAccessError> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: constraints,
    });
  } catch (error) {
    return handleDeviceError(error);
  }
}

// Video Input (Camera)
export async function getCamera(
  constraints: MediaTrackConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  }
): Promise<MediaStream | DeviceAccessError> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: constraints,
    });
  } catch (error) {
    return handleDeviceError(error);
  }
}

// MIDI Access
export async function getMIDIAccess(): Promise<MIDIAccess | DeviceAccessError> {
  try {
    if (!navigator.requestMIDIAccess) {
      throw new Error('MIDI access not supported in this browser');
    }
    return await navigator.requestMIDIAccess();
  } catch (error) {
    return handleDeviceError(error);
  }
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
