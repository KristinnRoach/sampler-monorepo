import React, { useState, useEffect, useRef } from 'react';
import { SourceNodePool } from '@repo/audiolib'; // SourceNode,

const SourcePoolTester: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const poolRef = useRef<SourceNodePool | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    // Initialize AudioContext on component mount
    const initAudio = async () => {
      const context = new AudioContext();
      audioContextRef.current = context;

      // Create a source node pool with the default poolSize of 8
      const pool = new SourceNodePool(context, context.destination);
      poolRef.current = pool;

      // Create a simple buffer for testing
      const sampleRate = context.sampleRate;
      const buffer = context.createBuffer(1, sampleRate, sampleRate);

      // Fill buffer with a simple sine wave
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin((440 * 2 * Math.PI * i) / sampleRate);
      }

      audioBufferRef.current = buffer;

      // Initialize the pool with our buffer (this creates the SourceNode instances)
      await pool.init(buffer);
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handlePlay = () => {
    if (poolRef.current && audioBufferRef.current) {
      const sourceNode = poolRef.current.play({
        playbackRate: 1.5,
        loopStart: 0.1,
        loopEnd: 0.5,
        loop: true,
      });

      if (sourceNode) {
        setIsPlaying(true);

        // Display available nodes count
        console.log(
          `Available nodes: ${poolRef.current.availableCount}/${poolRef.current.size}`
        );
      }
    }
  };

  return (
    <div className='source-pool-tester'>
      <h2>Audio Source Pool Tester</h2>
      <button
        onClick={handlePlay}
        disabled={!poolRef.current || poolRef.current.availableCount === 0}
      >
        Play Audio
      </button>

      {poolRef.current && (
        <div className='pool-stats'>
          <p>
            Available nodes: {poolRef.current.availableCount} of{' '}
            {poolRef.current.size}
          </p>
        </div>
      )}

      {isPlaying && (
        <p>
          Audio is playing with playbackRate: 1.5, loopStart: 0.1, loopEnd: 0.5,
          loop: true
        </p>
      )}
    </div>
  );
};

export default SourcePoolTester;
