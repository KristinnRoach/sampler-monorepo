import getDefaultPlayer from './defaultSSPlayer';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type SamplePlayerNode } from './types';
import { useEffect, useState } from 'react';
import { type SingleSamplePlayer } from '@repo/audiolib';

// Use a simpler approach with a default audio buffer
function SamplePlayerNode({
  positionAbsoluteX,
  positionAbsoluteY,
  data,
}: NodeProps<SamplePlayerNode>) {
  const x = `${Math.round(positionAbsoluteX)}px`;
  const y = `${Math.round(positionAbsoluteY)}px`;

  const [bufferDuration, setBufferDuration] = useState(0);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [rampDuration, setRampDuration] = useState(0);
  const [loop, setLoop] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [player, setPlayer] = useState<SingleSamplePlayer>();

  useEffect(() => {
    // Create a simple sine wave audio buffer instead of loading from file
    const createSineWaveBuffer = () => {
      // Create an audio context
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create a 2 second buffer at the sample rate of the AudioContext
      const sampleRate = audioCtx.sampleRate;
      const duration = 2; // in seconds
      const bufferSize = sampleRate * duration;
      const audioBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);

      // Fill the buffer with a simple sine wave
      const bufferData = audioBuffer.getChannelData(0);
      const frequency = 440; // A4 note in Hz

      for (let i = 0; i < bufferSize; i++) {
        // Generate a sine wave
        bufferData[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
      }

      console.log('Created sine wave buffer, duration:', audioBuffer.duration);
      return audioBuffer;
    };

    // Initialize player with synthetic audio buffer
    getDefaultPlayer()
      .then((player) => {
        try {
          const audioBuffer = createSineWaveBuffer();
          player.setSampleBuffer(audioBuffer);

          setBufferDuration(audioBuffer.duration);
          setLoopStart(0);
          setLoopEnd(audioBuffer.duration);
          setRampDuration(0);
          setLoop(false);
          setPlayer(player);
          setErrorMessage(null);

          console.log('Player initialized successfully with synthetic buffer');
        } catch (error) {
          console.error('Failed to initialize player:', error);
          setErrorMessage(
            `Failed to initialize player: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      })
      .catch((error) => {
        console.error('Failed to get default player:', error);
        setErrorMessage(
          `Failed to get default player: ${error instanceof Error ? error.message : String(error)}`
        );
      });

    return () => {
      player?.dispose();
    };
  }, []);

  useEffect(() => {
    if (player) {
      player.setLoopPoint('loopStart', loopStart, rampDuration);
    }
  }, [loopStart, player, rampDuration]);

  useEffect(() => {
    if (player) {
      player.setLoopPoint('loopEnd', loopEnd, rampDuration);
    }
  }, [loopEnd, player, rampDuration]);

  useEffect(() => {
    if (player) {
      player.setLoopEnabled(loop);
    }
  }, [player, loop]);

  return (
    <div className='react-flow__node-default'>
      {data.name && <div>{data.name}</div>}

      {/* Show error message if there is one */}
      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '10px' }}>{errorMessage}</div>
      )}

      <label className='drag-handle'>
        <p>Loop Start</p>
        <input
          className='nodrag'
          type='range'
          step='0.001'
          min='0'
          max={loopEnd}
          value={loopStart}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setLoopStart(value);
          }}
        />
        <p>Loop End</p>
        <input
          className='nodrag'
          type='range'
          step='0.001'
          min={loopStart}
          max={bufferDuration}
          value={loopEnd}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setLoopEnd(value);
          }}
        />
        <p>Ramp Duration</p>
        <input
          className='nodrag'
          type='range'
          min='0'
          max='1'
          step='0.001'
          value={rampDuration}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setRampDuration(value);
          }}
        />
        <p>Loop</p>
        <input
          className='nodrag'
          type='checkbox'
          checked={loop}
          onChange={(e) => {
            const value = e.target.checked;
            setLoop(value);
          }}
        />

        <p>Using synthetic sine wave (440Hz)</p>
      </label>

      <div>
        {x} {y}
      </div>

      <Handle type='source' position={Position.Bottom} />
    </div>
  );
}

export default SamplePlayerNode;
