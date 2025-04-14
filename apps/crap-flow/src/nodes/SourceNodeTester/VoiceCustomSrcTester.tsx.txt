import React, { useState, useRef, useEffect } from 'react';
import { VoiceCustomSrc, SourceNode, ensureAudioCtx } from '@repo/audiolib';

import KeyboardController from '../../input/KeyboardController';

const VoiceCustomSrcTester = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const voiceRef = useRef<VoiceCustomSrc | null>(null);

  const initAudio = async () => {
    const context = await ensureAudioCtx();
    setAudioContext(context);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioContext || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

    setAudioBuffer(decodedBuffer);
    setLoopEnd(decodedBuffer.duration);
  };

  const playAudio = async (midiNote: number, velocity: number = 1) => {
    if (!audioContext || !audioBuffer) return;

    if (voiceRef.current) {
      voiceRef.current.triggerRelease();
      voiceRef.current = null;
    }

    const sourceNode = await SourceNode.create(audioContext, {
      buffer: audioBuffer,
    });

    sourceNode.connect(audioContext.destination);

    sourceNode.loop.value = loopEnabled ? 1 : 0;
    sourceNode.loopStart.value = loopStart;
    sourceNode.loopEnd.value = loopEnd;
    sourceNode.playbackRate.value = playbackRate;

    sourceNode.playNote(midiNote, velocity);
    voiceRef.current = sourceNode;
    setIsPlaying(true);

    sourceNode.addEventListener('ended', () => {
      setIsPlaying(false);
    });
  };

  // Stop audio
  const stopAudio = () => {
    if (voiceRef.current) {
      voiceRef.current.stop();
      voiceRef.current = null;
      setIsPlaying(false);
    }
  };

  const [rampDuration, setRampDuration] = useState(0.1);

  useEffect(() => {
    if (voiceRef.current) {
      const now = audioContext?.currentTime || 0;
      const node = voiceRef.current;

      voiceRef.current.setLoopEnabled(loopEnabled ? true : false);

      voiceRef.current.activeSrc?.loopStart.cancelScheduledValues(now);
      voiceRef.current.nextSrc.loopStart.cancelScheduledValues(now);

      voiceRef.current.activeSrc?.loopStart.setValueAtTime(
        voiceRef.current.activeSrc?.loopStart.value,
        now
      );
      voiceRef.current.activeSrc?.loopStart.linearRampToValueAtTime(
        loopStart,
        now + rampDuration
      );
      voiceRef.current.nextSrc.loopEnd.cancelScheduledValues(now);
      voiceRef.current.nextSrc.loopEnd.setValueAtTime(
        voiceRef.current.nextSrc.loopEnd.value,
        now
      );
      voiceRef.current.activeSrc?.loopEnd.linearRampToValueAtTime(
        loopEnd,
        now + rampDuration
      );

      voiceRef.current.activeSrc?.playbackRate.cancelScheduledValues(now);
      voiceRef.current.activeSrc?.playbackRate.setValueAtTime(
        voiceRef.current.activeSrc?.playbackRate.value,
        now
      );
      voiceRef.current.activeSrc?.playbackRate.linearRampToValueAtTime(
        playbackRate,
        now + rampDuration
      );

      voiceRef.current.nextSrc.playbackRate.cancelScheduledValues(now);
      voiceRef.current.nextSrc.playbackRate.setValueAtTime(
        voiceRef.current.nextSrc.playbackRate.value,
        now
      );
      voiceRef.current.nextSrc.playbackRate.linearRampToValueAtTime(
        playbackRate,
        now + rampDuration
      );
    }
  }, [
    loopEnabled,
    loopStart,
    loopEnd,
    playbackRate,
    rampDuration,
    audioContext,
  ]);

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>SourceNode Tester</h2>

      {/* Keyboard Controller */}
      {audioContext && (
        <KeyboardController
          onNoteOn={(midiNote: number, velocity: number = 1) => {
            console.log('Note On:', midiNote, 'Velocity:', velocity);
            playAudio(midiNote, velocity);
          }}
          onNoteOff={() => {
            console.log('Note Off');
            stopAudio();
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

export default VoiceCustomSrcTester;
