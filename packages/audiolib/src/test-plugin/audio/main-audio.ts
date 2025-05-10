// main-audio.ts - Main thread audio setup
import { loadAudioWorkletWithFallback } from '../utils';

// Create and set up the audio context and worklet
export async function setupAudio(useJsVersion = false) {
  // Create audio context
  const audioContext = new AudioContext({ sampleRate: 48000 });

  // Resume context if needed (for Safari compatibility)
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }

  try {
    // Load processor code using our fallback helper function
    await loadAudioWorkletWithFallback(audioContext);
    console.log('AudioWorklet module loaded successfully');
  } catch (error) {
    console.error('Failed to load audio processors:', error);
    throw error;
  }

  // Create worklet node using our processor (TS or JS version)
  const processorName = useJsVersion ? 'js-test-oscillator' : 'test-oscillator';
  const oscillatorNode = new AudioWorkletNode(audioContext, processorName, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2], // Stereo output
  });

  // Set up message handling from processor
  oscillatorNode.port.onmessage = (event) => {
    console.log('Message from processor:', event.data);
  };

  // Connect to audio output
  oscillatorNode.connect(audioContext.destination);

  // Helper functions to control the processor
  function setNote(midiNote: number) {
    oscillatorNode.port.postMessage({
      type: 'setNote',
      payload: midiNote,
    });
  }

  function setVolume(volume: number) {
    oscillatorNode.port.postMessage({
      type: 'setVolume',
      payload: volume,
    });
  }

  function setDistortion(amount: number) {
    oscillatorNode.port.postMessage({
      type: 'setDistortion',
      payload: amount,
    });
  }

  // Return controller interface
  return {
    context: audioContext,
    node: oscillatorNode,
    setNote,
    setVolume,
    setDistortion,
  };
}
