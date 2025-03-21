import { Component, onCleanup } from 'solid-js';
import { createSignal, createEffect } from 'solid-js';
import { createVoiceProcessor, WorkletNode } from '@repo/audiolib';

const VoiceProcessorTest: Component = () => {
  const [audioContext, setAudioContext] = createSignal<AudioContext | null>(
    null
  );
  const [buffer, setBuffer] = createSignal<AudioBuffer | null>(null);
  const [processor, setProcessor] = createSignal<WorkletNode | null>(null);
  const [source, setSource] = createSignal<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = createSignal(false);

  // Initialize on first interaction
  const initAudio = async () => {
    if (audioContext()) return;

    const ctx = new AudioContext();
    setAudioContext(ctx);

    // Create worklet manager and processor
    const voiceProcessor = await createVoiceProcessor(ctx, 'voiceProcessor');

    // Create gain node and connect processor to output
    const gainNode = ctx.createGain();
    voiceProcessor.connect(gainNode);
    gainNode.connect(ctx.destination);

    setProcessor(voiceProcessor);
  };

  // Load audio file
  const loadFile = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    await initAudio();
    const ctx = audioContext()!;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    setBuffer(audioBuffer);
  };

  // Play loaded audio
  const playAudio = () => {
    if (!audioContext() || !buffer() || !processor() || isPlaying()) return;

    const ctx = audioContext()!;

    // Create and connect source
    const audioSource = ctx.createBufferSource();
    audioSource.buffer = buffer()!;
    audioSource.connect(processor()!);

    // Store source reference and start playback
    setSource(audioSource);
    audioSource.start();
    setIsPlaying(true);

    // Reset when playback ends
    audioSource.onended = () => {
      setIsPlaying(false);
      setSource(null);
    };
  };

  // Stop playback
  const stopAudio = () => {
    if (!source() || !isPlaying()) return;

    source()?.stop();
    setIsPlaying(false);
    setSource(null);
  };

  // Clean up resources
  onCleanup(() => {
    source()?.stop();
    audioContext()?.close();
  });

  return (
    <div>
      <h1>Voice Processor Test</h1>
      <div>
        <input type='file' accept='audio/*' onChange={loadFile} />
        <button onClick={playAudio} disabled={!buffer() || isPlaying()}>
          Play
        </button>
        <button onClick={stopAudio} disabled={!isPlaying()}>
          Stop
        </button>
      </div>
      <div>
        {buffer()
          ? `Loaded: ${buffer()?.duration.toFixed(2)}s`
          : 'No audio loaded'}
      </div>
    </div>
  );
};

export default VoiceProcessorTest;
