import { useRef, useState, useCallback, useEffect } from 'react';
import { audiolib, SamplePlayer } from '@repo/audiolib'; // todo: just import createSamplePlayer when treeshakeable
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
  const [rampTime, setRampTime] = useState(0.25);
  const [attackTime, setAttackTime] = useState(0.01); // Add attack time state
  const [releaseTime, setReleaseTime] = useState(0.1); // Add release time state
  const [activeVoices, setActiveVoices] = useState(0);
  const samplePlayerRef = useRef<SamplePlayer | null>(null);
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

  const createSamplePlayer = async () => {
    if (isInitialized) return true;

    try {
      samplePlayerRef.current = audiolib.createSamplePlayer();
      if (!samplePlayerRef.current) {
        console.error('Failed to create SamplePlayer');
        return false;
      }

      samplePlayerRef.current.onMessage('voice:position', (data: any) => {
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

      samplePlayerRef.current.onMessage('voice:ended', () => {
        setActiveVoices((prev) => Math.max(prev - 1, 0));
      });
      samplePlayerRef.current.onMessage('voice:started', () => {
        setActiveVoices((prev) => prev + 1);
      });

      samplePlayerRef.current.enableKeyboard();

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
    if (!(await createSamplePlayer())) return;
    if (!file) {
      console.error('No file selected');
      return;
    }
    if (!samplePlayerRef.current) {
      console.error('SamplePlayer not initialized');
      return;
    }

    const ctx = await audiolib.ensureAudioCtx();
    if (!ctx) return;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Set both the state and the ref
    const duration = audioBuffer.duration;
    setSampleDuration(duration);
    sampleDurationRef.current = duration; // Set the ref immediately

    samplePlayerRef.current.loadSample(audioBuffer);

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

    samplePlayerRef.current?.setLoopEnabled(newLoopState);
  };

  const handleLoopStartNormalizedChange = (normalizedValue: number) => {
    const clampedValue = Math.min(normalizedValue, loopEndNormalized);
    setLoopStartNormalized(clampedValue); // update ui

    const actualValue = normalizedValue * sampleDuration;
    samplePlayerRef.current?.setLoopStart(actualValue, rampTime);
  };

  const handleLoopEndNormalizedChange = (normalizedValue: number) => {
    const clampedValue = Math.max(normalizedValue, loopStartNormalized);
    setLoopEndNormalized(normalizedValue); // update ui

    const actualValue = clampedValue * sampleDuration;
    samplePlayerRef.current?.setLoopEnd(actualValue, rampTime);
  };

  const handleRampTimeChange = (value: number) => {
    setRampTime(value);
  };

  // Add handlers for attack and release time changes
  const handleAttackTimeChange = (value: number) => {
    setAttackTime(value);
    samplePlayerRef.current?.setAttackTime(value);
  };

  const handleReleaseTimeChange = (value: number) => {
    setReleaseTime(value);
    samplePlayerRef.current?.setReleaseTime(value);
  };

  // Add an effect to keep the ref in sync with the state
  useEffect(() => {
    sampleDurationRef.current = sampleDuration;
  }, [sampleDuration]);

  return (
    <div style={{ width: '100vw' }}>
      <h2>SourcePlayer Test</h2>
      {samplePlayerRef.current && (
        <RecorderComponent destination={samplePlayerRef.current} />
      )}
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
          min={0.00001}
          max={1}
          step={0.01}
          value={loopStartNormalized}
          onChange={(e) =>
            handleLoopStartNormalizedChange(parseFloat(e.target.value))
          }
        />
      </div>

      <div>
        <label style={{ display: 'block' }}>
          Loop End:
          {`           ${loopEnd.toFixed(8)}s`}
        </label>
        <input
          style={{ width: '65vw', height: '8vh', margin: '50px' }}
          type='range'
          min={0.00001}
          max={1}
          step={0.01}
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

      {/* Add attack time slider */}
      <div>
        <label>
          Attack Time:
          <input
            style={{ width: '65vw', height: '8vh', margin: '50px' }}
            type='range'
            min={0.001}
            max={1}
            step={0.001}
            value={attackTime}
            onChange={(e) => handleAttackTimeChange(parseFloat(e.target.value))}
          />
          {attackTime.toFixed(4)}s
        </label>
      </div>

      {/* Add release time slider */}
      <div>
        <label>
          Release Time:
          <input
            style={{ width: '65vw', height: '8vh', margin: '50px' }}
            type='range'
            min={0.001}
            max={1}
            step={0.001}
            value={releaseTime}
            onChange={(e) =>
              handleReleaseTimeChange(parseFloat(e.target.value))
            }
          />
          {releaseTime.toFixed(4)}s
        </label>
      </div>

      <p>{isLoaded ? 'Ready to play!' : 'Click "Load Test Sound" to start'}</p>

      <div>
        <p>Active Notes: {activeVoices}</p>
        <p>
          Sample Duration: {samplePlayerRef.current?.sampleDuration.toFixed(2)}s
        </p>
        <p>Volume: {samplePlayerRef.current?.volume.toFixed(2)}</p>
        <p>Is Initialized: {isInitialized ? 'Yes' : 'No'}</p>
        <p>UI Looping: {isLoopEnabled ? 'Enabled' : 'Disabled'}</p>
        <p>UI Loop Start: {loopStart.toFixed(2)}s</p>
        <p>UI Loop End: {loopEnd.toFixed(2)}s</p>
        <p>UI Ramp Time: {rampTime.toFixed(2)}s</p>
        <p>UI Attack Time: {attackTime.toFixed(2)}s</p>
        <p>UI Release Time: {releaseTime.toFixed(2)}s</p>
      </div>
    </div>
  );
};

export default SamplerComponent;
