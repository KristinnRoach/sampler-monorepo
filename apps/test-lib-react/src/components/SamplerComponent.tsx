import { useRef, useState, useCallback, useEffect } from 'react';
import { audiolib, Sampler } from '@repo/audiolib';
import RecorderComponent from './RecorderComponent';

const SamplerComponent = () => {
  const [isInitialized, setInitialized] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);

  // Actual loop points (in seconds)
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);

  // Normalized slider positions (0-1)
  const [loopStartNormalized, setLoopStartNormalized] = useState(0);
  const [loopEndNormalized, setLoopEndNormalized] = useState(1);

  const [sampleDuration, setSampleDuration] = useState(0);
  const [rampTime, setRampTime] = useState(0.2);
  const [activeVoices, setActiveVoices] = useState(0);
  const samplerRef = useRef<Sampler | null>(null);
  const sampleDurationRef = useRef(0); // Add this ref to track sample duration

  const [playbackPosition, setPlaybackPosition] = useState(0);

  // Memoize the PlaybackVisualizer to ensure it only updates when needed
  const PlaybackVisualizer = useCallback(() => {
    return (
      <div
        style={{
          width: '65vw',
          height: '20px',
          backgroundColor: '#eee',
          margin: '20px 50px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${playbackPosition * 100}%`,
            backgroundColor: '#4CAF50',
            transition: 'width 0.05s linear',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${loopStartNormalized * 100}%`,
            width: '2px',
            height: '100%',
            backgroundColor: 'blue',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${loopEndNormalized * 100}%`,
            width: '2px',
            height: '100%',
            backgroundColor: 'red',
          }}
        />
      </div>
    );
  }, [playbackPosition]); // Only re-render when playbackPosition changes

  // Update actual loop points when normalized positions or sample duration changes
  useEffect(() => {
    if (sampleDuration > 0) {
      setLoopStart(loopStartNormalized * sampleDuration);
      setLoopEnd(loopEndNormalized * sampleDuration);
    }
  }, [loopStartNormalized, loopEndNormalized, sampleDuration]);

  const createSampler = async () => {
    if (isInitialized) return true;

    try {
      samplerRef.current = audiolib.createSampler();
      if (!samplerRef.current) {
        console.error('Failed to create sampler');
        return false;
      }

      // Enable position tracking
      console.log('Enabling position tracking');
      samplerRef.current.enablePositionTracking(true, 'mostRecent');

      samplerRef.current.onMessage('voice:position', (data: any) => {
        // Force immediate state update
        setPlaybackPosition((prev) => {
          // Use the ref instead of the state
          if (!sampleDurationRef.current) {
            console.warn('Sample duration ref is 0 or not set');
            return prev;
          }
          const newPos = data.position / sampleDurationRef.current;
          // Clamp the position between 0 and 1
          const clampedPos = Math.min(Math.max(newPos, 0), 1);
          return clampedPos;
        });
      });

      samplerRef.current.onMessage('voice:ended', () => {
        setActiveVoices((prev) => Math.max(prev - 1, 0));
      });
      samplerRef.current.onMessage('voice:started', () => {
        setActiveVoices((prev) => prev + 1);
      });

      audiolib.enableKeyboard();

      setInitialized(true);
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  };

  const fetchInitSample = async () => {
    const response = await fetch('/init_sample.wav');
    if (!response.ok) {
      console.error('Failed to fetch initial sample');
      return;
    }
    const blob = await response.blob();
    const file = new File([blob], 'init_sample.wav', { type: 'audio/wav' });

    return file;
  };

  const loadSample = async (file: File) => {
    if (!(await createSampler())) return;
    if (!file) {
      console.error('No file selected');
      return;
    }
    if (!samplerRef.current) {
      console.error('Sampler not initialized');
      return;
    }

    const ctx = await audiolib.ensureAudioCtx();
    if (!ctx) return;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Set both the state and the ref
    const duration = audioBuffer.duration;
    console.log('Setting sample duration:', duration);
    setSampleDuration(duration);
    sampleDurationRef.current = duration; // Set the ref immediately

    samplerRef.current.loadSample(audioBuffer);

    // Reset normalized positions to defaults (start at beginning, end at full duration)
    setLoopStartNormalized(0);
    setLoopEndNormalized(1);

    setIsLoaded(true);
  };

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        loadSample(file);
      }
    },
    []
  );

  useEffect(() => {
    fetchInitSample()
      .then((file) => {
        if (file) {
          loadSample(file);
        }
      })
      .catch((error) => {
        console.error('Error fetching initial sample:', error);
      });
  }, []);

  const toggleLoopEnabled = () => {
    const newLoopState = !isLoopEnabled;
    setIsLoopEnabled(newLoopState);

    samplerRef.current?.setLoopEnabled(newLoopState);
  };

  // NOT using Logarithm:
  const handleLoopStartNormalizedChange = (normalizedValue: number) => {
    // Clamp to make sure start doesn't exceed end position
    const clampedValue = Math.min(normalizedValue, loopEndNormalized - 0.001);
    setLoopStartNormalized(clampedValue);

    // Calculate actual time value and update sampler
    const actualValue = clampedValue * sampleDuration;
    samplerRef.current?.setLoopStart(actualValue, rampTime);
  };

  const handleLoopEndNormalizedChange = (normalizedValue: number) => {
    // Clamp to make sure end doesn't go below start position
    const clampedValue = Math.max(normalizedValue, loopStartNormalized + 0.001);
    setLoopEndNormalized(clampedValue);

    // Calculate actual time value and update sampler
    const actualValue = clampedValue * sampleDuration;
    samplerRef.current?.setLoopEnd(actualValue, rampTime);
  };

  const handleRampTimeChange = (value: number) => {
    setRampTime(value);
  };

  // Add an effect to keep the ref in sync with the state
  useEffect(() => {
    sampleDurationRef.current = sampleDuration;
  }, [sampleDuration]);

  return (
    <div style={{ width: '100vw' }}>
      <h2>SourcePlayer Test</h2>
      <RecorderComponent />
      <button
        id='loadDefaultSample'
        onClick={async () => {
          const file = await fetchInitSample();
          if (!file) {
            console.error('Failed to fetch initial sample');
            return;
          }
          loadSample(file);
        }}
      >
        Load default sample
      </button>

      <div>
        <input type='file' accept='audio/*' onChange={handleFileChange} />
        <button onClick={toggleLoopEnabled} disabled={!isLoaded}>
          {isLoopEnabled ? 'Disable Loop' : 'Enable Loop'}
        </button>
      </div>

      <PlaybackVisualizer />

      {/* Position display */}
      <div style={{ margin: '10px 50px' }}>
        Playback Position: {(playbackPosition * sampleDuration).toFixed(3)}s
      </div>

      <div style={{ width: '100vw' }}>
        <label style={{ display: 'flex', justifyContent: 'center' }}>
          Loop Start:
          {`           ${loopStart.toFixed(8)}s`}
        </label>
        <input
          style={{ width: '65vw', height: '8vh', margin: '50px' }}
          type='range'
          min={0}
          max={1}
          step={0.0001}
          value={loopStartNormalized}
          onChange={(e) =>
            handleLoopStartNormalizedChange(parseFloat(e.target.value))
          }
        />
      </div>

      <div>
        <label style={{ display: 'block' }}>
          Loop End:
          {/* {'         ' +
            (logScaleEnd(loopEndNormalized) * sampleDuration).toFixed(8)}s */}
          {`           ${loopEnd.toFixed(8)}s`}
        </label>
        <input
          style={{ width: '65vw', height: '8vh', margin: '50px' }}
          type='range'
          min={0}
          max={1}
          step={0.0001}
          value={loopEndNormalized}
          onChange={(e) =>
            handleLoopEndNormalizedChange(parseFloat(e.target.value))
          }
        />
      </div>

      <div>
        <label>
          Ramp Time:
          <input
            style={{ width: '65vw', height: '8vh', margin: '50px' }}
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={rampTime}
            onChange={(e) => handleRampTimeChange(parseFloat(e.target.value))}
          />
          {rampTime.toFixed(4)}s
        </label>
      </div>

      <p>{isLoaded ? 'Ready to play!' : 'Click "Load Test Sound" to start'}</p>

      <div>
        {' '}
        {/* TODO: useState to render info display instead of ref.current  */}
        <p>Active Notes: {activeVoices}</p>
        <p>Sample Duration: {samplerRef.current?.sampleDuration.toFixed(2)}s</p>
        <p>Volume: {samplerRef.current?.volume.toFixed(2)}</p>
        <p>Voice Count: {samplerRef.current?.voiceCount}</p>
        <p>Is Playing: {samplerRef.current?.isPlaying ? 'Yes' : 'No'}</p>
        <p>Is Looping: {samplerRef.current?.isLooping ? 'Yes' : 'No'}</p>
        <p>Is Initialized: {isInitialized ? 'Yes' : 'No'}</p>
        <p>UI Looping: {isLoopEnabled ? 'Enabled' : 'Disabled'}</p>
        <p>
          Sampler Looping:{' '}
          {samplerRef.current?.isLooping ? 'Enabled' : 'Disabled'}
        </p>
        <p>UI Loop Start: {loopStart.toFixed(2)}s</p>
        <p>UI Loop End: {loopEnd.toFixed(2)}s</p>
        <p>UI Ramp Time: {rampTime.toFixed(2)}s</p>
      </div>
    </div>
  );
};

export default SamplerComponent;

// Using Logarithm:

// const handleLoopStartNormalizedChange = (linearPosition: number) => {
//   // Apply logarithmic scaling (more sensitive at beginning)
//   const logValue = logScaleStart(linearPosition);

//   // Clamp to make sure start doesn't exceed end position
//   const clampedLogValue = Math.min(logValue, loopEndNormalized - 0.001);
//   setLoopStartNormalized(inverseLogScaleStart(clampedLogValue));

//   // Calculate actual time value and update sampler
//   const actualValue = clampedLogValue * sampleDuration;
//   samplerRef.current?.setLoopStart(actualValue, rampTime);
// };

// const handleLoopEndNormalizedChange = (linearPosition: number) => {
//   // Apply logarithmic scaling (more sensitive at end)
//   const logValue = logScaleEnd(linearPosition);

//   // Clamp to make sure end doesn't go below start position
//   const clampedLogValue = Math.max(logValue, loopStartNormalized + 0.001);
//   setLoopEndNormalized(inverseLogScaleEnd(clampedLogValue));

//   // Calculate actual time value and update sampler
//   const actualValue = clampedLogValue * sampleDuration;
//   samplerRef.current?.setLoopEnd(actualValue, rampTime);
// };
