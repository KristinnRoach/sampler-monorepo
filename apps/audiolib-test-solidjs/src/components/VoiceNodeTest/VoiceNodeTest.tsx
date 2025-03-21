import { createSignal, onCleanup, onMount } from 'solid-js';
import { VoiceNode } from '@repo/audiolib';

export default function VoiceNodeTest() {
  const [audioContext, setAudioContext] = createSignal<AudioContext | null>(
    null
  );
  const [voiceNode, setVoiceNode] = createSignal<VoiceNode | null>(null);
  const [buffer, setBuffer] = createSignal<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [message, setMessage] = createSignal('');

  // Add this to your VoiceNodeTest.tsx component
  // Replace the current error handling in onMount

  onMount(async () => {
    try {
      // Create audio context on user interaction to comply with browser policies
      const ctx = new AudioContext();
      setAudioContext(ctx);

      // Initialize voice node
      const voice = new VoiceNode(ctx);

      try {
        await voice.init();
      } catch (error) {
        console.error('Voice init error:', error);
        if (error instanceof Error) {
          console.error('Stack:', error.stack);
          setMessage(
            `Error initializing: ${error.message}\n\nStack: ${error.stack}`
          );
        } else {
          setMessage(`Error initializing: ${String(error)}`);
        }
        return;
      }

      voice.connect(ctx.destination);
      setVoiceNode(voice);

      setMessage('VoiceNode initialized');
    } catch (error) {
      console.error('Mount error:', error);
      if (error instanceof Error) {
        console.error('Stack:', error.stack);
        setMessage(
          `Error initializing: ${error.message}\n\nStack: ${error.stack}`
        );
      } else {
        setMessage(`Error initializing: ${String(error)}`);
      }
    }
  });

  onCleanup(() => {
    // Clean up audio context and voice when component unmounts
    if (voiceNode()) {
      voiceNode()?.stop();
      voiceNode()?.disconnect();
    }

    if (audioContext()) {
      audioContext()?.close();
    }
  });

  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || !target.files.length) return;

    const file = target.files[0];
    const ctx = audioContext();

    if (!ctx) {
      setMessage('Audio context not initialized');
      return;
    }

    try {
      setMessage('Loading audio file...');

      if (!file) {
        setMessage('No file selected');
        return;
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Decode audio data
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      setBuffer(audioBuffer);

      setMessage(
        `Loaded audio file: ${file.name} (${audioBuffer.duration.toFixed(2)}s)`
      );
    } catch (error) {
      setMessage(
        `Error loading audio: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const playSound = () => {
    const voice = voiceNode();
    const audioBuffer = buffer();

    if (!voice || !audioBuffer) {
      setMessage('Voice node or audio buffer not ready');
      return;
    }

    try {
      voice.play(audioBuffer);
      setIsPlaying(true);
      setMessage('Playing sound');

      // Reset playing state when playback ends
      setTimeout(() => {
        setIsPlaying(false);
      }, audioBuffer.duration * 1000);
    } catch (error) {
      setMessage(
        `Error playing sound: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const stopSound = () => {
    const voice = voiceNode();

    if (!voice) {
      setMessage('Voice node not ready');
      return;
    }

    try {
      voice.stop();
      setIsPlaying(false);
      setMessage('Stopped sound');
    } catch (error) {
      setMessage(
        `Error stopping sound: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div>
      <h2>VoiceNode Test</h2>

      <div>
        <input type='file' accept='audio/*' onChange={handleFileUpload} />
      </div>

      <div style='margin-top: 16px'>
        <button onClick={playSound} disabled={!buffer() || isPlaying()}>
          Play
        </button>

        <button
          onClick={stopSound}
          disabled={!isPlaying()}
          style='margin-left: 8px'
        >
          Stop
        </button>
      </div>

      <div style='margin-top: 16px'>
        <p>{message()}</p>
      </div>
    </div>
  );
}
