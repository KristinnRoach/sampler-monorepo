// TestSourceNode.jsx
import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { SourceNode, SOURCE_EVENTS } from '@repo/audiolib';

const TestSourceNode = () => {
  const [audioContext, setAudioContext] = createSignal(null);
  const [sourceNode, setSourceNode] = createSignal(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [position, setPosition] = createSignal(0);
  const [duration, setDuration] = createSignal(0);
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [playbackRate, setPlaybackRate] = createSignal(1.0);
  const [looping, setLooping] = createSignal(false);

  // Initialize the audio context and source node
  onMount(async () => {
    const ctx = new AudioContext();
    setAudioContext(ctx);

    const source = new SourceNode(ctx);
    await source.init();

    // Explicitly connect to the destination
    source.connect(ctx.destination);

    // Add this line to connect the source to the speakers
    source.output.connect(ctx.destination);

    // Set up event listeners
    source.addEventListener(SOURCE_EVENTS.POSITION_CHANGE, (event) => {
      setPosition(event.detail.position);
    });

    source.addEventListener(SOURCE_EVENTS.PLAYBACK_STATE_CHANGE, (event) => {
      setIsPlaying(event.detail.isPlaying);
    });

    source.addEventListener(SOURCE_EVENTS.BUFFER_LOADED, (event) => {
      setDuration(event.detail.duration);
      setIsLoaded(true);
    });

    source.enablePositionTracking(10); // Update position every 10 frames
    setSourceNode(source);
  });

  // Clean up on component unmount
  onCleanup(() => {
    const source = sourceNode();
    if (source) {
      source.dispose();
    }
    const ctx = audioContext();
    if (ctx) {
      ctx.close();
    }
  });

  // Load audio file
  const loadAudio = async (file) => {
    const source = sourceNode();
    if (!source) return;

    setIsLoaded(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = await audioContext().decodeAudioData(arrayBuffer);
      await source.loadBuffer(buffer);
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      loadAudio(file);
    }
  };

  // Playback controls
  const togglePlay = () => {
    const source = sourceNode();
    if (!source || !isLoaded()) return;

    if (isPlaying()) {
      source.stop();
    } else {
      source.play();
    }
  };

  const handleSeek = (event) => {
    const source = sourceNode();
    if (!source || !isLoaded()) return;

    const seekPosition = (event.target.value / 100) * duration();
    source.seekTo(seekPosition);
  };

  const toggleLooping = (event) => {
    const source = sourceNode();
    if (!source || !isLoaded()) return;

    const isLooping = event.target.checked;
    setLooping(isLooping);
    source.setLooping(isLooping);
  };

  const handlePlaybackRateChange = (event) => {
    const source = sourceNode();
    if (!source || !isLoaded()) return;

    const rate = parseFloat(event.target.value);
    setPlaybackRate(rate);
    source.setPlaybackParameters({ playbackRate: rate });
  };

  return (
    <div class='audio-player'>
      <div class='controls'>
        <input type='file' accept='audio/*' onChange={handleFileChange} />

        <button onClick={togglePlay} disabled={!isLoaded()}>
          {isPlaying() ? 'Pause' : 'Play'}
        </button>

        <div class='seek-container'>
          <input
            type='range'
            min='0'
            max='100'
            value={duration() ? (position() / duration()) * 100 : 0}
            onInput={handleSeek}
            disabled={!isLoaded()}
          />
          <div class='time-display'>
            {position().toFixed(2)}s / {duration().toFixed(2)}s
          </div>
        </div>

        <div class='playback-rate'>
          <label>
            Speed:
            <select value={playbackRate()} onChange={handlePlaybackRateChange}>
              <option value='0.5'>0.5x</option>
              <option value='0.75'>0.75x</option>
              <option value='1.0'>1.0x</option>
              <option value='1.25'>1.25x</option>
              <option value='1.5'>1.5x</option>
              <option value='2.0'>2.0x</option>
            </select>
          </label>
        </div>

        <div class='looping'>
          <label>
            <input
              type='checkbox'
              checked={looping()}
              onChange={toggleLooping}
              disabled={!isLoaded()}
            />
            Loop
          </label>
        </div>
      </div>

      <div class='status'>
        Status:{' '}
        {!sourceNode()
          ? 'Initializing...'
          : isLoaded()
            ? 'Ready'
            : 'No audio loaded'}
      </div>
    </div>
  );
};

export default TestSourceNode;
