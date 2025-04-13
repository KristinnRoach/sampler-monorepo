import React, { useEffect, useRef, useState } from 'react';
import { SourcePool } from '@repo/audiolib';
import KeyboardController from '../../input/KeyboardController';

const PoolPlayerV2 = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [rampDuration, setRampDuration] = useState(0.1);

  const poolRef = useRef<SourcePool | null>(null);

  // const initAudio = async () => {
  //   const context = new AudioContext();
  //   setAudioContext(context);

  //   // Create the pool but don't set a buffer yet
  //   const pool = new SourcePool(context, {
  //     polyphony: 8,
  //   });
  //   pool.connect(context.destination);
  //   poolRef.current = pool;
  // };

  const initAudio = async () => {
    const context = new AudioContext();
    setAudioContext(context);

    // Create the pool and properly await its initialization
    const pool = await SourcePool.create(context, {
      polyphony: 8,
    });
    pool.connect(context.destination);
    poolRef.current = pool;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioContext || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

    setAudioBuffer(decodedBuffer);
    setLoopEnd(decodedBuffer.duration);

    if (poolRef.current) {
      poolRef.current.setBuffer(decodedBuffer);
    }
  };

  const playAudio = async (midiNote: number, velocity: number = 1) => {
    if (!audioContext || !audioBuffer || !poolRef.current) return;

    poolRef.current.playNote(midiNote, velocity);
    setIsPlaying(true);
  };

  const stopAudio = () => {
    // This is probably where the error is happening
    setIsPlaying(false);
  };

  // Update parameters when sliders change
  useEffect(() => {
    if (poolRef.current && audioContext) {
      const now = audioContext.currentTime;

      poolRef.current.setLoopEnabled(loopEnabled);

      // Update parameters with ramping
      if (audioBuffer) {
        poolRef.current.setLoopParameters(
          loopStart,
          loopEnd,
          playbackRate,
          now,
          rampDuration
        );
      }
    }
  }, [
    loopEnabled,
    loopStart,
    loopEnd,
    playbackRate,
    rampDuration,
    audioContext,
    audioBuffer,
  ]);

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>SourcePool Tester</h2>

      {/* Keyboard Controller */}
      {audioContext && audioBuffer && (
        <KeyboardController
          onNoteOn={(midiNote: number, velocity: number = 1) => {
            console.log('Note On:', midiNote, 'Velocity:', velocity);
            playAudio(midiNote, velocity);
          }}
          onNoteOff={(midiNote: number) => {
            console.log('Note Off:', midiNote);
            // The error is likely here - we need to modify how we stop notes
            if (poolRef.current) {
              poolRef.current.stopNote(midiNote);
            }
          }}
        />
      )}

      {/* Audio Context Initialization */}
      {!audioContext && (
        <button
          onClick={initAudio}
          className='bg-blue-500 text-white p-2 rounded mb-4'
        >
          Initialize Audio
        </button>
      )}

      {/* File Upload */}
      {audioContext && (
        <div className='mb-4'>
          <input
            type='file'
            accept='audio/*'
            onChange={handleFileUpload}
            className='mb-2'
          />

          {/* Playback Controls */}
          {audioBuffer && (
            <div className='space-y-4'>
              <div className='flex space-x-2'>
                <button
                  onClick={() => playAudio(60, 1)}
                  disabled={isPlaying}
                  className='bg-green-500 text-white p-2 rounded disabled:bg-gray-400'
                >
                  Play
                </button>
                <button
                  onClick={stopAudio}
                  disabled={!isPlaying}
                  className='bg-red-500 text-white p-2 rounded disabled:bg-gray-400'
                >
                  Stop
                </button>
              </div>

              {/* Loop Controls */}
              <div className='space-y-2'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={loopEnabled}
                    onChange={(e) => setLoopEnabled(e.target.checked)}
                    className='mr-2'
                  />
                  <label>Loop Enabled</label>
                </div>

                <div>
                  <label className='block'>
                    Loop Start: {loopStart.toFixed(2)}s
                  </label>
                  <input
                    type='range'
                    min='0'
                    max={audioBuffer.duration}
                    step='0.005'
                    value={loopStart}
                    onChange={(e) => setLoopStart(Number(e.target.value))}
                    className='w-full'
                  />
                </div>

                <div>
                  <label className='block'>
                    Loop End: {loopEnd.toFixed(2)}s
                  </label>
                  <input
                    type='range'
                    min='0'
                    max={audioBuffer.duration}
                    step='0.005'
                    value={loopEnd}
                    onChange={(e) => setLoopEnd(Number(e.target.value))}
                    className='w-full'
                  />
                </div>

                <div>
                  <label className='block'>
                    Playback Rate: {playbackRate.toFixed(2)}x
                  </label>
                  <input
                    type='range'
                    min='0.1'
                    max='4'
                    step='0.01'
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className='w-full'
                  />
                </div>

                <div>
                  <label className='block'>
                    Ramp Duration: {rampDuration.toFixed(2)}s
                  </label>
                  <input
                    type='range'
                    min='0'
                    max='2'
                    step='0.01'
                    value={rampDuration}
                    onChange={(e) => setRampDuration(Number(e.target.value))}
                    className='w-full'
                  />
                </div>
              </div>

              {/* File Info */}
              <div className='text-sm text-gray-700'>
                <p>Duration: {audioBuffer.duration.toFixed(2)}s</p>
                <p>Channels: {audioBuffer.numberOfChannels}</p>
                <p>Sample Rate: {audioBuffer.sampleRate}Hz</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PoolPlayerV2;
