import { useRef, useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { audiolib, Sampler } from '@repo/audiolib';

interface SamplerNodeData {
  onNoteOn?: (midiNote: number) => void;
  onNoteOff?: (midiNote: number) => void;
  onSampleLoaded?: (sampler: any) => void;
  registerMethods?: (methods: any) => void;
}

const SamplerNode = ({ data, isConnectable }: NodeProps<SamplerNodeData>) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);

  // Actual loop points (in seconds)
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);

  // Normalized slider positions (0-1)
  const [loopStartNormalized, setLoopStartNormalized] = useState(0);
  const [loopEndNormalized, setLoopEndNormalized] = useState(1);

  // Sample duration
  const [sampleDuration, setSampleDuration] = useState(0);

  const [rampTime, setRampTime] = useState(0.2);
  const [activeVoices, setActiveVoices] = useState(0);
  const samplerRef = useRef<Sampler | null>(null);

  const [isInitialized, setInitialized] = useState(false);

  // Update actual loop points when normalized positions or sample duration changes
  useEffect(() => {
    if (sampleDuration > 0) {
      const actualLoopStart = loopStartNormalized * sampleDuration;
      const actualLoopEnd = loopEndNormalized * sampleDuration;

      setLoopStart(actualLoopStart);
      setLoopEnd(actualLoopEnd);

      // Only update the sampler if it's already loaded
      if (isLoaded && samplerRef.current) {
        samplerRef.current.setLoopStart(actualLoopStart, rampTime);
        samplerRef.current.setLoopEnd(actualLoopEnd, rampTime);
      }
    }
  }, [
    loopStartNormalized,
    loopEndNormalized,
    sampleDuration,
    isLoaded,
    rampTime,
  ]);

  const initAudio = async () => {
    if (isInitialized) return true;

    try {
      await audiolib.init();
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

  const loadSample = async (file: File) => {
    if (!(await initAudio())) return;
    if (!file) return;
    if (!samplerRef.current) return;

    const ctx = await audiolib.ensureAudioCtx();
    if (!ctx) return;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const success = await samplerRef.current.loadSample(audioBuffer);
    if (success) {
      // Set duration and store it for normalizing calculations
      setSampleDuration(audioBuffer.duration);

      // Reset normalized positions to defaults
      setLoopStartNormalized(0);
      setLoopEndNormalized(1);

      setIsLoaded(true);

      // Notify parent component that the sample is loaded
      if (data.onSampleLoaded) {
        data.onSampleLoaded(samplerRef.current);
      }
    }
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

  const handleNoteOn = useCallback(
    (midiNote: number) => {
      samplerRef.current?.playNote(midiNote);
      setActiveVoices(samplerRef.current?.activeNotesCount || 0);

      // Signal to connected nodes
      if (data.onNoteOn) {
        data.onNoteOn(midiNote);
      }
    },
    [data]
  );

  const handleNoteOff = useCallback(
    (midiNote: number) => {
      samplerRef.current?.stopNote(midiNote);
      setActiveVoices(samplerRef.current?.activeNotesCount || 0);

      // Signal to connected nodes
      if (data.onNoteOff) {
        data.onNoteOff(midiNote);
      }
    },
    [data]
  );

  const toggleLoopEnabled = useCallback(() => {
    const newLoopState = !isLoopEnabled;
    setIsLoopEnabled(newLoopState);
    samplerRef.current?.setLoopEnabled(newLoopState);
  }, [isLoopEnabled]);

  const handleLoopStartNormalizedChange = useCallback(
    (normalizedValue: number) => {
      // Clamp to ensure start doesn't exceed end
      const clampedValue = Math.min(normalizedValue, loopEndNormalized - 0.001);
      setLoopStartNormalized(clampedValue);
    },
    [loopEndNormalized]
  );

  const handleLoopEndNormalizedChange = useCallback(
    (normalizedValue: number) => {
      // Clamp to ensure end doesn't go below start
      const clampedValue = Math.max(
        normalizedValue,
        loopStartNormalized + 0.001
      );
      setLoopEndNormalized(clampedValue);
    },
    [loopStartNormalized]
  );

  const handleRampTimeChange = useCallback((value: number) => {
    setRampTime(value);
  }, []);

  // Expose methods to parent via data prop
  if (data.registerMethods) {
    data.registerMethods({
      playNote: (midiNote: number) => handleNoteOn(midiNote),
      stopNote: (midiNote: number) => handleNoteOff(midiNote),
      getSampler: () => samplerRef.current,
    });
  }

  return (
    <div
      className='sampler-node'
      style={{
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '5px',
        width: '300px',
      }}
    >
      <Handle
        type='target'
        position={Position.Top}
        id='note-in'
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />

      <div style={{ marginBottom: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Sampler</h4>

        <div style={{ marginBottom: '8px' }}>
          <button
            onClick={async () => {
              await initAudio();
              const file = await fetchInitSample();
              if (file) loadSample(file);
            }}
            className='nodrag'
          >
            Load Default
          </button>
          <input
            type='file'
            accept='audio/*'
            onChange={handleFileChange}
            className='nodrag'
            style={{ marginLeft: '8px' }}
          />
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
        >
          <button
            onClick={toggleLoopEnabled}
            disabled={!isLoaded}
            className='nodrag'
          >
            {isLoopEnabled ? 'Disable Loop' : 'Enable Loop'}
          </button>
          <span style={{ marginLeft: '10px' }}>
            {isLoaded ? 'Sample Loaded' : 'No Sample'}
          </span>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>
            Loop Start: {loopStart.toFixed(2)}s
          </label>
          <input
            type='range'
            min={0}
            max={1}
            step={0.001}
            value={loopStartNormalized}
            onChange={(e) =>
              handleLoopStartNormalizedChange(parseFloat(e.target.value))
            }
            className='nodrag'
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>
            Loop End: {loopEnd.toFixed(2)}s
          </label>
          <input
            type='range'
            min={0}
            max={1}
            step={0.001}
            value={loopEndNormalized}
            onChange={(e) =>
              handleLoopEndNormalizedChange(parseFloat(e.target.value))
            }
            className='nodrag'
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px' }}>
            Ramp Time: {rampTime.toFixed(2)}s
          </label>
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={rampTime}
            onChange={(e) => handleRampTimeChange(parseFloat(e.target.value))}
            className='nodrag'
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ fontSize: '11px', marginTop: '5px' }}>
        <div>Active Voices: {activeVoices}</div>
        {isLoaded && samplerRef.current && (
          <div>Duration: {samplerRef.current.sampleDuration.toFixed(2)}s</div>
        )}
      </div>

      <Handle
        type='source'
        position={Position.Bottom}
        id='audio-out'
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default SamplerNode;
