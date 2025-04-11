import React, { useState, useEffect, useRef } from 'react';
import { SourceNodePool, ensureAudioCtx, SourceNode } from '@repo/audiolib';

const SourcePoolTester: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingNodes, setPlayingNodes] = useState<number>(0);
  const [availableNodes, setAvailableNodes] = useState<number>(0);
  const [totalNodes, setTotalNodes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  console.log(isPlaying); // dummy just to avoid ts error for now

  // UI Controls
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(1);

  // Refs to maintain state across renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const poolRef = useRef<SourceNodePool | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const activeNodesRef = useRef<Set<SourceNode>>(new Set());

  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create audio context
        const context = await ensureAudioCtx();
        if (!context) {
          throw new Error('Failed to create AudioContext');
        }
        audioContextRef.current = context;

        // Create oscillator buffer for testing
        const sampleRate = context.sampleRate;
        const duration = 2; // 2 seconds
        const buffer = context.createBuffer(
          1,
          duration * sampleRate,
          sampleRate
        );

        // Fill with a sine wave
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++) {
          // Create a combined tone with fade-in/fade-out to avoid clicks
          const fadeTime = 0.05; // 50ms fade
          const fadeInSamples = fadeTime * sampleRate;
          const fadeOutSamples = fadeTime * sampleRate;

          // Basic amplitude envelope
          let amplitude = 1.0;
          if (i < fadeInSamples) {
            amplitude = i / fadeInSamples;
          } else if (i > channelData.length - fadeOutSamples) {
            amplitude = (channelData.length - i) / fadeOutSamples;
          }

          // Combined tone (440Hz + 880Hz)
          channelData[i] =
            amplitude *
            (0.7 * Math.sin((440 * 2 * Math.PI * i) / sampleRate) +
              0.3 * Math.sin((880 * 2 * Math.PI * i) / sampleRate));
        }

        audioBufferRef.current = buffer;
        setLoopEnd(duration);

        const pool = new SourceNodePool(context, context.destination, 8);
        poolRef.current = pool;
        await pool.init(buffer);

        setIsInitialized(true);
        setTotalNodes(pool.size);
        setAvailableNodes(pool.availableCount);

        console.log(`Pool initialized with ${pool.size} nodes`);
      } catch (err: unknown) {
        console.error('Initialization error:', err);
        setError('Failed to initialize audio');
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update available nodes count every 500ms
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      if (poolRef.current) {
        setAvailableNodes(poolRef.current.availableCount);
        setPlayingNodes(poolRef.current.size - poolRef.current.availableCount);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isInitialized]);

  const handlePlay = () => {
    if (!poolRef.current || !audioBufferRef.current) {
      setError('Audio not initialized yet');
      return;
    }

    try {
      const sourceNode = poolRef.current.play({
        playbackRate: playbackRate,
        loopStart: loopStart,
        loopEnd: loopEnd,
        loop: loopEnabled,
      });

      if (sourceNode) {
        // Track this node
        activeNodesRef.current.add(sourceNode);
        setIsPlaying(true);

        // If not looping, remove from tracking when it ends
        if (!loopEnabled) {
          sourceNode.addEventListener('ended', () => {
            activeNodesRef.current.delete(sourceNode);
            if (activeNodesRef.current.size === 0) {
              setIsPlaying(false);
            }
          });
        }

        // Update counts immediately
        setAvailableNodes(poolRef.current.availableCount);
        setPlayingNodes(poolRef.current.size - poolRef.current.availableCount);

        console.log(
          `Played sound. Available nodes: ${poolRef.current.availableCount}/${poolRef.current.size}`
        );
      } else {
        setError('No available nodes in the pool');
      }
    } catch {
      console.error('Error playing sound:');
      setError('Failed to play sound');
    }
  };

  const handleStopAll = () => {
    if (!poolRef.current) return;

    poolRef.current.stopAll();
    activeNodesRef.current.clear();
    setIsPlaying(false);
  };

  const handleExpandPool = async () => {
    if (!poolRef.current) return;

    try {
      await poolRef.current.expandPool(4);
      setTotalNodes(poolRef.current.size);
      setAvailableNodes(poolRef.current.availableCount);
    } catch {
      console.error('Error expanding pool:');
      setError('Failed to expand pool');
    }
  };

  return (
    <div className='p-4 max-w-md mx-auto bg-white rounded-xl shadow-md'>
      <h2 className='text-xl font-bold mb-4'>Audio Source Pool Tester</h2>

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          <p>{error}</p>
          <button onClick={() => setError(null)} className='text-sm underline'>
            Dismiss
          </button>
        </div>
      )}

      {!isInitialized ? (
        <div className='text-center py-4'>
          <p>Initializing audio system...</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {/* Pool Stats */}
          <div className='bg-gray-100 p-3 rounded'>
            <h3 className='font-semibold'>Pool Status:</h3>
            <div className='grid grid-cols-2 gap-2 text-sm mt-2'>
              <div>Total Nodes:</div>
              <div>{totalNodes}</div>
              <div>Available:</div>
              <div>{availableNodes}</div>
              <div>Playing:</div>
              <div>{playingNodes}</div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className='space-y-3'>
            <div>
              <label className='block text-sm font-medium'>
                Playback Rate: {playbackRate.toFixed(2)}x
              </label>
              <input
                type='range'
                min='0.5'
                max='2'
                step='0.01'
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className='w-full'
              />
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                id='loop-toggle'
                checked={loopEnabled}
                onChange={(e) => setLoopEnabled(e.target.checked)}
                className='mr-2'
              />
              <label htmlFor='loop-toggle' className='text-sm font-medium'>
                Loop Enabled
              </label>
            </div>

            {loopEnabled && (
              <>
                <div>
                  <label className='block text-sm font-medium'>
                    Loop Start: {loopStart.toFixed(2)}s
                  </label>
                  <input
                    type='range'
                    min='0'
                    max={audioBufferRef.current?.duration || 1}
                    step='0.01'
                    value={loopStart}
                    onChange={(e) => setLoopStart(Number(e.target.value))}
                    className='w-full'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium'>
                    Loop End: {loopEnd.toFixed(2)}s
                  </label>
                  <input
                    type='range'
                    min='0'
                    max={audioBufferRef.current?.duration || 1}
                    step='0.01'
                    value={loopEnd}
                    onChange={(e) => setLoopEnd(Number(e.target.value))}
                    className='w-full'
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-2'>
            <button
              onClick={handlePlay}
              disabled={availableNodes === 0}
              className='flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-400'
            >
              Play Sound
            </button>

            <button
              onClick={handleStopAll}
              disabled={playingNodes === 0}
              className='flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded disabled:bg-gray-400'
            >
              Stop All
            </button>
          </div>

          <button
            onClick={handleExpandPool}
            className='w-full bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded'
          >
            Add More Nodes (+4)
          </button>
        </div>
      )}
    </div>
  );
};

export default SourcePoolTester;
