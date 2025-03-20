import {
  Component,
  createSignal,
  onMount,
  onCleanup,
  createEffect,
} from 'solid-js';
import { LoopWorklet } from '@repo/audiolib';
import styles from './LoopWorkletTest.module.css';

const LoopWorkletTest: Component = () => {
  // State for audio elements and controls
  const [audioBuffer, setAudioBuffer] = createSignal<AudioBuffer | null>(null);
  const [sourceNode, setSourceNode] =
    createSignal<AudioBufferSourceNode | null>(null);
  const [loopProcessor, setLoopProcessor] = createSignal<LoopWorklet | null>(
    null
  );
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isLooping, setIsLooping] = createSignal(true);
  const [fileName, setFileName] = createSignal('');

  // Loop parameters
  const [duration, setDuration] = createSignal(0);
  const [loopStart, setLoopStart] = createSignal(0);
  const [loopEnd, setLoopEnd] = createSignal(1);
  const [minLoopLength, setMinLoopLength] = createSignal(0.001); // 1ms minimum by default
  const [interpolationSpeed, setInterpolationSpeed] = createSignal(0.05);

  // Get AudioContext
  let audioContext: AudioContext;

  onMount(async () => {
    try {
      audioContext = new AudioContext();
      console.log(
        'AudioContext created with sample rate:',
        audioContext.sampleRate
      );
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
    }
  });

  onCleanup(() => {
    // Clean up audio resources
    stopPlayback();
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
  });

  // Load audio file
  const handleFileSelect = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file || !file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }
    setFileName(file.name);

    try {
      const arrayBuffer = await file?.arrayBuffer();
      if (!arrayBuffer) {
        throw new Error('Failed to read file');
      }
      const newAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      setAudioBuffer(newAudioBuffer);
      setDuration(newAudioBuffer.duration);

      // Set default loop points
      setLoopStart(0);
      setLoopEnd(newAudioBuffer.duration);

      setIsLoaded(true);
      console.log(
        `Loaded audio file: ${file?.name}, duration: ${newAudioBuffer.duration}s`
      );
    } catch (error) {
      console.error('Error loading audio file:', error);
      alert('Failed to load audio file. Please try another file.');
    }
  };

  // Start playback with loop processor
  const startPlayback = async () => {
    if (!audioBuffer()) return;

    try {
      // Stop any existing playback
      stopPlayback();

      // Create a new AudioBufferSourceNode
      const newSourceNode = audioContext.createBufferSource();
      newSourceNode.buffer = audioBuffer();
      newSourceNode.loop = isLooping();

      // Set initial loop points
      newSourceNode.loopStart = loopStart();
      newSourceNode.loopEnd = loopEnd();

      // Create and initialize the loop processor
      const newLoopProcessor = new LoopWorklet(audioContext);
      await newLoopProcessor.initialise();

      // Connect the loop processor to the source
      newLoopProcessor.connectToSource(newSourceNode);

      // Set loop parameters
      newLoopProcessor.setLoopStart(loopStart());
      newLoopProcessor.setLoopEnd(loopEnd());
      newLoopProcessor.setInterpolationSpeed(interpolationSpeed());

      // Start playback
      newSourceNode.start();

      // Update state
      setSourceNode(newSourceNode);
      setLoopProcessor(newLoopProcessor);
      setIsPlaying(true);

      // Handle playback end
      newSourceNode.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error('Error starting playback:', error);
    }
  };

  // Stop playback
  const stopPlayback = () => {
    if (sourceNode()) {
      sourceNode()?.stop();
      setSourceNode(null);
    }
    setIsPlaying(false);
  };

  // Toggle looping
  const toggleLooping = () => {
    const newLoopingState = !isLooping();
    setIsLooping(newLoopingState);

    if (sourceNode()) {
      sourceNode()!.loop = newLoopingState;
    }
  };

  // Update loop parameters when they change
  createEffect(() => {
    if (loopProcessor() && isPlaying()) {
      loopProcessor()?.setLoopStart(loopStart());
      loopProcessor()?.setLoopEnd(loopEnd());

      // Ensure source node loop settings are updated too
      if (sourceNode()) {
        sourceNode()!.loopStart = loopStart();
        sourceNode()!.loopEnd = loopEnd();
      }
    }
  });

  createEffect(() => {
    if (loopProcessor() && isPlaying()) {
      loopProcessor()?.setInterpolationSpeed(interpolationSpeed());
    }
  });

  // Handle loop start slider change with minimum length validation
  const handleLoopStartChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const newStart = parseFloat(input.value);
    const currentEnd = loopEnd();

    // Ensure loop end is at least minLoopLength away from new start
    if (currentEnd - newStart < minLoopLength()) {
      const newEnd = newStart + minLoopLength();
      if (newEnd <= duration()) {
        setLoopEnd(newEnd);
      } else {
        // If we can't push the end forward, adjust start instead
        setLoopStart(currentEnd - minLoopLength());
        return;
      }
    }

    setLoopStart(newStart);
  };

  // Handle loop end slider change with minimum length validation
  const handleLoopEndChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const newEnd = parseFloat(input.value);
    const currentStart = loopStart();

    // Ensure loop start is at least minLoopLength away from new end
    if (newEnd - currentStart < minLoopLength()) {
      const newStart = newEnd - minLoopLength();
      if (newStart >= 0) {
        setLoopStart(newStart);
      } else {
        // If we can't push the start backward, adjust end instead
        setLoopEnd(currentStart + minLoopLength());
        return;
      }
    }

    setLoopEnd(newEnd);
  };

  // Calculate display values with appropriate precision
  const getDisplayTime = (seconds: number) => {
    // For short files (< 1 second), show more decimal places
    return duration() < 1 ? seconds.toFixed(5) : seconds.toFixed(3);
  };

  // Calculate slider step size based on duration
  const getStepSize = () => {
    // Use smaller steps for shorter files
    return duration() < 1 ? 0.0001 : 0.001;
  };

  return (
    <div class={styles.container}>
      <h2>Loop Processor Test</h2>

      <div class={styles.fileSelector}>
        <input
          type='file'
          accept='audio/*'
          onChange={handleFileSelect}
          id='audioFileInput'
        />
        <label for='audioFileInput' class={styles.fileLabel}>
          {fileName() || 'Select Audio File'}
        </label>
      </div>

      <div class={styles.playbackControls}>
        <button
          onClick={isPlaying() ? stopPlayback : startPlayback}
          disabled={!isLoaded()}
          class={styles.playButton}
        >
          {isPlaying() ? 'Stop' : 'Play'}
        </button>

        <button
          onClick={toggleLooping}
          disabled={!isLoaded()}
          class={`${styles.loopButton} ${isLooping() ? styles.active : ''}`}
        >
          Loop: {isLooping() ? 'ON' : 'OFF'}
        </button>
      </div>

      <div class={styles.infoDisplay}>
        <p>File duration: {getDisplayTime(duration())}s</p>
        <p>Minimum loop length: {getDisplayTime(minLoopLength())}s</p>
      </div>

      <div class={styles.sliderContainer}>
        <label for='minLoopLengthSlider'>
          Min Loop Length: {getDisplayTime(minLoopLength())}s
        </label>
        <input
          type='range'
          id='minLoopLengthSlider'
          min='0.0001'
          max={Math.min(0.5, duration() / 2)}
          step='0.0001'
          value={minLoopLength()}
          onInput={(e) =>
            setMinLoopLength(parseFloat((e.target as HTMLInputElement).value))
          }
          disabled={!isLoaded()}
          class={styles.slider}
        />
      </div>

      <div class={styles.sliderContainer}>
        <label for='loopStartSlider'>
          Loop Start: {getDisplayTime(loopStart())}s
        </label>
        <input
          type='range'
          id='loopStartSlider'
          min='0'
          max={duration()}
          step={getStepSize()}
          value={loopStart()}
          onInput={handleLoopStartChange}
          disabled={!isLoaded()}
          class={styles.slider}
        />
      </div>

      <div class={styles.sliderContainer}>
        <label for='loopEndSlider'>
          Loop End: {getDisplayTime(loopEnd())}s
        </label>
        <input
          type='range'
          id='loopEndSlider'
          min='0'
          max={duration()}
          step={getStepSize()}
          value={loopEnd()}
          onInput={handleLoopEndChange}
          disabled={!isLoaded()}
          class={styles.slider}
        />
      </div>

      <div class={styles.sliderContainer}>
        <label for='interpolationSpeedSlider'>
          Interpolation Speed: {interpolationSpeed().toFixed(4)}
          <span class={styles.hint}>(Lower = Smoother)</span>
        </label>
        <input
          type='range'
          id='interpolationSpeedSlider'
          min='0.0001'
          max='0.2'
          step='0.0001'
          value={interpolationSpeed()}
          onInput={(e) =>
            setInterpolationSpeed(
              parseFloat((e.target as HTMLInputElement).value)
            )
          }
          disabled={!isLoaded()}
          class={styles.slider}
        />
      </div>

      <div class={styles.visualizer}>
        <div
          class={styles.waveform}
          style={{
            'background-position': `${(loopStart() / duration()) * 100}% 0, ${(loopEnd() / duration()) * 100}% 0`,
          }}
        >
          <div
            class={styles.loopRegion}
            style={{
              left: `${(loopStart() / duration()) * 100}%`,
              width: `${((loopEnd() - loopStart()) / duration()) * 100}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoopWorkletTest;
