import { tryCatch } from '../utils/code/tryCatch';
import {
  getMicrophone,
  getCamera,
  getMIDIAccess,
  getAudioInputDevices,
  onDeviceChange,
} from '../utils/devices/devices';

async function setupDevices() {
  // Get microphone access
  const micResult = await tryCatch(getMicrophone());
  if (micResult.error) {
    console.error('Microphone access error:', micResult.error.message);
    return;
  }
  const micStream = micResult.data;

  // Get camera access
  const camResult = await tryCatch(getCamera());
  if (camResult.error) {
    console.error('Camera access error:', camResult.error.message);
    return;
  }
  const camStream = camResult.data;

  // Get MIDI access
  const midiResult = await tryCatch(getMIDIAccess());
  if (midiResult.error) {
    console.error('MIDI access error:', midiResult.error.message);
    return;
  }
  const midiAccess = midiResult.data;

  // List available audio input devices
  const audioDevices = await getAudioInputDevices();
  console.log('Available audio inputs:', audioDevices);

  // Monitor device changes
  const cleanup = onDeviceChange(() => {
    console.log('Device configuration changed');
  });

  // Cleanup when done
  return () => {
    cleanup();
    micStream.getTracks().forEach((track) => track.stop());
    camStream.getTracks().forEach((track) => track.stop());
  };
}

export { setupDevices };
