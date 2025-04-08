import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { SingleSamplePlayer } from '@repo/audiolib';
import { type SingleSamplerProps } from '../node-types';

function SingleSamplerNode({
  positionAbsoluteX,
  positionAbsoluteY,
  data,
}: NodeProps<SingleSamplerProps>) {
  const x = `${Math.round(positionAbsoluteX)}px`;
  const y = `${Math.round(positionAbsoluteY)}px`;

  const [sampleDuration, setSampleDuration] = useState(0);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [rampDuration, setRampDuration] = useState(0);
  const [loop, setLoop] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [player, setPlayer] = useState<SingleSamplePlayer>();

  const init = () => {
    if (player) {
      console.log('Player already initialized');
      return;
    }
    console.log('Initializing player...');
    const props = data;
    const newPlayer = new SingleSamplePlayer(props);
    const bufferDuration = newPlayer.getSampleDuration();
    setPlayer(newPlayer);
    setSampleDuration(bufferDuration ?? 0);
    setLoopStart(0);
    setLoopEnd(bufferDuration ?? 0);
    setRampDuration(0);
    setLoop(false);
    setErrorMessage(null);
  };

  useEffect(() => {
    console.log('Mounted Useffect fired');
    init();

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
          max={sampleDuration}
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

export default SingleSamplerNode;
