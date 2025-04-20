import { useRef, useState } from 'react';
import KeyboardController from '../input/KeyboardController';
import { audiolib, Sampler } from '@repo/audiolib';

const SamplePlayer = () => {
  // const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [rampTime, setRampTime] = useState(0.2);
  const [activeVoices, setActiveVoices] = useState(0);
  const samplerRef = useRef<Sampler | undefined>(null);

  const [isInitialized, setInitialized] = useState(false);

  // Initialize audio on first user interaction
  const initAudio = async () => {
    try {
      if (!isInitialized) {
        await audiolib.init();
      }

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

  // Load sample uploaded by user
  const loadSample = async (file: File) => {
    if (!(await initAudio())) return;
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

    setLoopEnd(audioBuffer.duration); // Set default loopEnd to the duration of the audio
    setIsLoaded(true);
  };

  // Load initial sample
  const fetchInitSample = async () => {
    if (!(await initAudio())) return;

    const response = await fetch('/init_sample.wav');
    if (!response.ok) {
      console.error('Failed to fetch initial sample');
      return;
    }
    const blob = await response.blob();
    const file = new File([blob], 'init_sample.wav', { type: 'audio/wav' });

    return file;
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadSample(file);
    }
  };

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

  const handleLoopStartChange = (value: number) => {
    setLoopStart(value);
    samplerRef.current?.setLoopStart(value, rampTime);
  };

  const handleLoopEndChange = (value: number) => {
    setLoopEnd(value);
    samplerRef.current?.setLoopEnd(value, rampTime);
  };

  const handleRampTimeChange = (value: number) => {
    setRampTime(value);
    // ?? if (samplerRef.current) samplerRef.current.loopRampTime = value; // unnecessary
  };

  return (
    <div style={{ width: '100vw' }}>
      <h2>SourcePlayer Test</h2>
      <button
        id='loadTestSound'
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
          {'         ' + loopStart.toFixed(8)}s
        </label>
        <input
          style={{ width: '65vw', height: '8vh', margin: '50px' }}
          type='range'
          min={0}
          max={0.5} // for testing
          step={0.0001}
          value={loopStart}
          onChange={(e) => handleLoopStartChange(parseFloat(e.target.value))}
        />
      </div>

      <div>
        <label style={{ display: 'flex' }}>
          Loop End:
          {'         ' + loopEnd.toFixed(8)}s
        </label>
        <input
          style={{ width: '65vw', height: '8vh', margin: '50px' }}
          type='range'
          min={loopStart}
          max={0.5} // {samplerRef.current?.sampleDuration || 10}
          step={0.0001}
          value={loopEnd}
          onChange={(e) => handleLoopEndChange(parseFloat(e.target.value))}
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
