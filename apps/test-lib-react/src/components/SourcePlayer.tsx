import { useRef, useState } from 'react';
import KeyboardController from '../input/KeyboardController';
import { audiolib, SourceNode } from '@repo/audiolib';

const SourcePlayer = () => {
  // const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [rampTime, setRampTime] = useState(0.2);
  const playerRef = useRef<SourceNode | undefined>(null);

  const [isInitialized, setInitialized] = useState(false);

  // Initialize audio on first user interaction
  const initAudio = async () => {
    try {
      if (!isInitialized) {
        await audiolib.init();
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

    const ctx = await audiolib.ensureAudioCtx();
    if (!ctx) return;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    audiolib.loadBuffer(audioBuffer);
    // playerRef.current = await audiolib.createSourceNode();
    // if (!playerRef.current) return;

    // await playerRef.current.loadBuffer(audioBuffer, audioBuffer.sampleRate);

    // playerRef.current.addListener('ended', () => {
    //   // setIsPlaying(false);
    // });

    setLoopEnd(audioBuffer.duration); // Set default loopEnd to the duration of the audio
    setIsLoaded(true);
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadSample(file);
    }
  };

  const handleNoteOn = (midiNote: number) => {
    audiolib.playNote(midiNote);

    // if (playerRef.current) {
    //   playerRef.current.play({ midiNote });
    //   setIsPlaying(true);
    // }
  };

  const handleNoteOff = (midiNote: number) => {
    audiolib.stopNote(midiNote);
    // if (playerRef.current) {
    //   playerRef.current.stop(midiNote);
    //   setIsPlaying(false);
    // }
  };

  const toggleLoopEnabled = () => {
    const newLoopState = !isLoopEnabled;
    setIsLoopEnabled(newLoopState);
    playerRef.current?.setLoopEnabled(newLoopState);
  };

  const handleLoopStartChange = (value: number) => {
    setLoopStart(value);
    playerRef.current?.setLoopStart(value);
  };

  const handleLoopEndChange = (value: number) => {
    setLoopEnd(value);
    playerRef.current?.setLoopEnd(value);
  };

  const handleRampTimeChange = (value: number) => {
    setRampTime(value);
    playerRef.current?.setRampTime(value);
  };

  return (
    <div className='source-player-component'>
      <h2>SourcePlayer Test</h2>
      <KeyboardController onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />

      <div>
        <input type='file' accept='audio/*' onChange={handleFileChange} />

        {/* <button onClick={clickPlay} disabled={!isLoaded}>
          {isPlaying ? 'Stop' : 'Play'}
        </button> */}

        <button onClick={toggleLoopEnabled} disabled={!isLoaded}>
          {isLoopEnabled ? 'Disable Loop' : 'Enable Loop'}
        </button>
      </div>

      <div>
        <label>
          Loop Start:
          <input
            type='range'
            min={0}
            max={loopEnd}
            step={0.01}
            value={loopStart}
            onChange={(e) => handleLoopStartChange(parseFloat(e.target.value))}
          />
          {loopStart.toFixed(2)}s
        </label>
      </div>

      <div>
        <label>
          Loop End:
          <input
            type='range'
            min={loopStart}
            max={playerRef.current?.duration || 10}
            step={0.01}
            value={loopEnd}
            onChange={(e) => handleLoopEndChange(parseFloat(e.target.value))}
          />
          {loopEnd.toFixed(2)}s
        </label>
      </div>

      <div>
        <label>
          Ramp Time:
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={rampTime}
            onChange={(e) => handleRampTimeChange(parseFloat(e.target.value))}
          />
          {rampTime.toFixed(2)}s
        </label>
      </div>

      <p>{isLoaded ? 'Ready to play!' : 'Click "Load Test Sound" to start'}</p>
    </div>
  );
};

export default SourcePlayer;
