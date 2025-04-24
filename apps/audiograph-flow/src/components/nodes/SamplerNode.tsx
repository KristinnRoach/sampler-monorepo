import { Handle, Position, NodeProps } from 'reactflow';
import { useCallback, useEffect, useRef, useState } from 'react';
import { audiolib } from '@repo/audiolib';

const SamplerNode = ({ id, data }: NodeProps) => {
  const [isInitialized, setInitialized] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const samplerRef = useRef<any>(null);

  // Initialize the sampler
  useEffect(() => {
    const initSampler = async () => {
      if (isInitialized) return;

      try {
        const ctx = await audiolib.ensureAudioCtx();
        samplerRef.current = audiolib.createSampler();

        if (samplerRef.current) {
          // Connect to destination
          samplerRef.current.connect(ctx.destination);
          setInitialized(true);

          // Register methods for the flow
          if (data.registerMethods) {
            data.registerMethods({
              playNote: (note: number, velocity = 100) => {
                console.log('SamplerNode playNote:', note, velocity);
                samplerRef.current?.playNote(note, velocity);
              },
              stopNote: (note: number) => {
                console.log('SamplerNode stopNote:', note);
                samplerRef.current?.stopNote(note);
              },
              getSampler: () => samplerRef.current,
            });
          }

          // Load a default sample
          const response = await fetch('/initsample.wav');
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          await samplerRef.current.loadSample(audioBuffer);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to initialize sampler:', error);
      }
    };

    initSampler();

    return () => {
      if (samplerRef.current) {
        samplerRef.current.disconnect();
        samplerRef.current = null;
      }
    };
  }, [data.registerMethods, isInitialized]);

  return (
    <div className='sampler-node'>
      <Handle type='target' position={Position.Top} id='note-in' />
      <div>
        <h3>Sampler</h3>
        <div>Status: {isLoaded ? 'Ready' : 'Loading...'}</div>
      </div>
      <Handle type='source' position={Position.Bottom} id='audio-out' />
    </div>
  );
};

export default SamplerNode;
