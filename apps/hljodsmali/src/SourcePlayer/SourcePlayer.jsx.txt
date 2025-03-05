// SourcePlayer.jsx
import { createSignal, onCleanup } from 'solid-js';
import { SourceNode } from '@repo/audiolib';

export default function SourcePlayer() {
  const [audioContext, setAudioContext] = createSignal(null);
  const [sourceNode, setSourceNode] = createSignal(null);
  const [isPlaying, setIsPlaying] = createSignal(false);

  const initAudio = async () => {
    const ctx = new AudioContext();
    setAudioContext(ctx);

    // Create and initialize the source node
    // No need to specify a path - it's handled automatically
    const node = new SourceNode(ctx);
    await node.init();

    setSourceNode(node);
    console.log('Audio initialized successfully');
  };

  // Handle file loading, playback, etc.
  const loadFile = async (event) => {
    const file = event.target.files[0];
    if (!file || !sourceNode()) return;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext().decodeAudioData(arrayBuffer);
    await sourceNode().loadBuffer(audioBuffer);
  };

  const togglePlayback = () => {
    if (!sourceNode()) return;

    if (isPlaying()) {
      sourceNode().stop();
      setIsPlaying(false);
    } else {
      sourceNode().play();
      setIsPlaying(true);
    }
  };

  // Clean up on unmount
  onCleanup(() => {
    if (sourceNode()) sourceNode().dispose();
    if (audioContext()) audioContext().close();
  });

  return (
    <div>
      <button onClick={initAudio} disabled={!!audioContext()}>
        Initialize
      </button>
      <input
        type='file'
        accept='audio/*'
        onChange={loadFile}
        disabled={!audioContext()}
      />
      <button onClick={togglePlayback} disabled={!sourceNode()}>
        {isPlaying() ? 'Stop' : 'Play'}
      </button>
    </div>
  );
}
