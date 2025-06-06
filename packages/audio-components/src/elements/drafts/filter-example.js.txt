import '@repo/audio-components/src/elements/SamplerElement';
import '../elements/FilterElement';
import { audiolib } from '@repo/audiolib';

// Initialize audio when the page loads
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize audiolib
  await audiolib.init();

  // Get the sampler element
  const samplerElement = document.getElementById('my-sampler');

  // Load a default sample if needed
  // This is just a placeholder - you'd need to implement actual sample loading
  const loadDefaultSample = async () => {
    try {
      // Example: Load a sample from a URL
      const response = await fetch('/path/to/sample.wav');
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = audiolib.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Load the sample into the sampler
      if (samplerElement.samplePlayer) {
        await samplerElement.samplePlayer.loadSample(audioBuffer);
      }
    } catch (error) {
      console.error('Failed to load default sample:', error);
    }
  };

  // Load default sample
  loadDefaultSample();
});
