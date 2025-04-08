import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { getAudioContext, ensureAudioCtx } from '@repo/audiolib';
import { type SinkNode } from '../node-types';

const ensureCtx = async () => await ensureAudioCtx();

function SinkNode({
  positionAbsoluteX,
  positionAbsoluteY,
  data,
}: NodeProps<SinkNode>) {
  const [ctx, setCtx] = useState<AudioContext>(getAudioContext());
  const [destination, setDestination] = useState<AudioDestinationNode | null>(
    null
  );

  useEffect(() => {
    const audioCtx = async () => await ensureCtx();
    audioCtx().then((audioCtx) => {
      if (!audioCtx) {
        throw new Error('Audio context not available');
      } else {
        console.log('Audio context available');
        setCtx(audioCtx);
      }
    });
  }, []);

  useEffect(() => {
    if (ctx) {
      setDestination(destination);
    }
  }, [ctx]);

  useEffect(() => {
    if (ctx) {
      const destination = ctx.destination;
      setDestination(destination);
    }
  }, [ctx]);

  if (!ctx) {
    console.error('Audio context is not available');
    return null;
  }
  const x = `${Math.round(positionAbsoluteX)}px`;
  const y = `${Math.round(positionAbsoluteY)}px`;

  return (
    <div className='react-flow__node-default'>
      {data.label && <div>{data.label}</div>}

      <div>
        {x} {y}
      </div>

      <Handle type='source' position={Position.Bottom} />
    </div>
  );
}

export default SinkNode;
