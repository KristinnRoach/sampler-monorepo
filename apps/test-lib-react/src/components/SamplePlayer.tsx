import { useRef, useState, useCallback, useEffect } from 'react';
import KeyboardController from '../input/KeyboardController';
import { audiolib, Sampler } from '@repo/audiolib';

// // Utility functions for logarithmic scaling
// const logScaleStart = (position: number) => {
//   return 1 - Math.pow(1 - position, 3);
// };

// const inverseLogScaleStart = (value: number) => {
//   return 1 - Math.pow(1 - value, 1 / 3);
// };

// const logScaleEnd = (position: number) => {
//   return Math.pow(position, 3);
// };

// const inverseLogScaleEnd = (value: number) => {
//   return Math.pow(value, 1 / 3);
// };

const SamplePlayer = () => {
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
  const samplerRef = useRef<Sampler | undefined>(null);

  const [isInitialized, setInitialized] = useState(false);

  // Update actual loop points when normalized positions or sample duration changes
  useEffect(() => {
    if (sampleDuration > 0) {
      setLoopStart(loopStartNormalized * sampleDuration);
      setLoopEnd(loopEndNormalized * sampleDuration);
    }
  }, [loopStartNormalized, loopEndNormalized, sampleDuration]);

  // audio must be initialized on user interaction
  const createSampler = async () => {
    if (isInitialized) return;

    try {
      samplerRef.current = audiolib.createSampler();
      if (!samplerRef.current) {
        console.error('Failed to create sampler');
        return false;
      }
      setInitialized(true);

      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  };

  const fetchInitSample = async () => {
    if (!(await createSampler())) return;

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

    samplerRef.current.loadSample(audioBuffer);

    // Set duration and reset end point
    setSampleDuration(audioBuffer.duration);

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

  const handleNoteOn = (midiNote: number) => {
    samplerRef.current?.playNote(midiNote);

    setActiveVoices(samplerRef.current?.activeNotesCount || 0);
  };

  const handleNoteOff = (midiNote: number) => {
    samplerRef.current?.stopNote(midiNote);

    setActiveVoices(samplerRef.current?.activeNotesCount || 0);
  };

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

  const handleRampTimeChange = (value: number) => {
    setRampTime(value);
  };

  return (
    <div style={{ width: '100vw' }}>
      <h2>SourcePlayer Test</h2>
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

      <KeyboardController onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />

      <div>
        <input type='file' accept='audio/*' onChange={handleFileChange} />

        <button onClick={toggleLoopEnabled} disabled={!isLoaded}>
          {isLoopEnabled ? 'Disable Loop' : 'Enable Loop'}
        </button>
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

export default SamplePlayer;
