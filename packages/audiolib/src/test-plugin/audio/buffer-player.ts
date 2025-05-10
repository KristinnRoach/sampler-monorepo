// buffer-player.ts - Main thread implementation for the buffer player

// Setup function to create and initialize the buffer player
export async function setupBufferPlayer(audioContext: AudioContext) {
  // Make sure the audio worklet module is loaded (should be already done by main audio setup)
  try {
    // Create the worklet node
    const bufferPlayerNode = new AudioWorkletNode(
      audioContext,
      'buffer-player',
      {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2], // Stereo output
      }
    );

    // Connect to audio output
    bufferPlayerNode.connect(audioContext.destination);

    // Handle messages from the processor
    bufferPlayerNode.port.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'bufferLoaded':
          console.log(
            `Buffer loaded: ${payload.numChannels} channels, ${payload.length} samples`
          );
          break;

        case 'playbackEnded':
          console.log('Playback ended');
          // Update UI if needed
          const playButton = document.getElementById('playButton');
          if (playButton) {
            playButton.textContent = 'Play';
            playButton.classList.remove('playing');
          }
          break;
      }
    };

    // Function to load buffer from an audio file
    async function loadAudioFile(file: File) {
      try {
        // Read the file as an ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Extract the channels as Float32Arrays
        const channels: Float32Array[] = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          channels.push(audioBuffer.getChannelData(i));
        }

        // Send the buffer to the processor
        bufferPlayerNode.port.postMessage({
          type: 'loadBuffer',
          payload: {
            buffer: channels,
            sampleRate: audioBuffer.sampleRate,
          },
        });

        return {
          duration: audioBuffer.duration,
          numChannels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate,
        };
      } catch (error) {
        console.error('Error loading audio file:', error);
        throw error;
      }
    }

    // Play control functions
    function play() {
      bufferPlayerNode.port.postMessage({
        type: 'play',
      });
    }

    function stop() {
      bufferPlayerNode.port.postMessage({
        type: 'stop',
      });
    }

    function pause() {
      bufferPlayerNode.port.postMessage({
        type: 'pause',
      });
    }

    function setVolume(volume: number) {
      bufferPlayerNode.port.postMessage({
        type: 'setVolume',
        payload: volume,
      });
    }

    // Return public interface
    return {
      node: bufferPlayerNode,
      loadAudioFile,
      play,
      stop,
      pause,
      setVolume,
    };
  } catch (error) {
    console.error('Failed to setup buffer player:', error);
    throw error;
  }
}
