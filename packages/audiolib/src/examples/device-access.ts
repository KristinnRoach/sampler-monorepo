import {
  getMicrophone,
  getCamera,
  getMIDIAccess,
  getAudioInputDevices,
  onDeviceChange,
} from '../utils/devices';

// Example usage:
async function setupDevices() {
  // Get microphone access
  const micStream = await getMicrophone();
  if ('type' in micStream) {
    console.error('Microphone access error:', micStream.message);
    return;
  }

  // Get camera access
  const camStream = await getCamera();
  if ('type' in camStream) {
    console.error('Camera access error:', camStream.message);
    return;
  }

  // Get MIDI access
  const midiAccess = await getMIDIAccess();
  if ('type' in midiAccess) {
    console.error('MIDI access error:', midiAccess.message);
    return;
  }

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

// async function setupMIDI() {
//   const midiAccess = await getMIDIAccess();

//   if ('type' in midiAccess) {
//     console.error(`Failed to get MIDI access: ${midiAccess.message}`);
//     return;
//   }

//   // Now we can use the full MIDI API
//   midiAccess.inputs.forEach(input => {
//     input.onmidimessage = (message) => {
//       console.log('MIDI message:', message.data);
//     };
//   });

//   // Listen for MIDI device connections/disconnections
//   midiAccess.onstatechange = (e) => {
//     console.log('MIDI state change:', e.port.name, e.port.state);
//   };
// }
