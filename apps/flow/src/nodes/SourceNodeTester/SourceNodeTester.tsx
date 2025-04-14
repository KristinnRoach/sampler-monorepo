import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SourceWorkletNode,
  ensureAudioCtx,
  createSourceNode,
} from '@repo/audiolib';

import KeyboardController from '../../input/KeyboardController';

const SourceNodeTester = (props: any = {}) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioData, setAudioData] = useState<Float32Array[] | null>(null);
  const [destination, setDestination] = useState<AudioNode>(
    props.destination || null
  );

  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const sourceNodeRef = useRef<SourceWorkletNode | null>(null);
  const [src, setSrc] = useState<SourceWorkletNode | null>(null);
  // sourceNodeRef should have useState as well? To have a stable state to use in dep arrays? Better ways that don't require two variables/references?

  useEffect(() => {
    sourceNodeRef.current = src;
  }, [src]);

  const [isFlag, setFlag] = useState<boolean>(false);
  const isFlagRef = useRef(isFlag);

  useEffect(() => {
    // test for practice
    isFlagRef.current = isFlag;
    console.debug({ state: isFlag }, { ref: isFlagRef.current });
  }, [isFlag]);

  // empty deps arr
  useEffect(() => {
    return () => {
      gainNode?.disconnect();
      setGainNode(null);
      sourceNodeRef.current?.dispose();
      sourceNodeRef.current = null;
      setSrc(null);
      setAudioContext(null);
      setAudioData(null);
    };
  }, []);

  const createSource = useCallback(async () => {
    if (isFlag) return;

    if (src !== null) {
      src?.dispose();
      setSrc(null);
    }

    if (!gainNode || !(audioContext?.state === 'running') || !destination) {
      console.warn({ gainNode, destination }, { audioContext });
      return;
    }

    const sourceNode = (await createSourceNode({
      // await createNodeAsync({ ... // SourceWorkletNode.createNonAsync({ // understand why no work and choose approach
      audioContext: audioContext,
      processorName: 'source-processor',
      workletOptions: {
        buffer: audioData, // should be cached ofcourse
        sampleRate: audioContext.sampleRate,
      },
    })) as SourceWorkletNode;

    sourceNode.connect(gainNode).connect(destination);
    setSrc(sourceNode);
  }, [gainNode, audioContext, destination, audioData, isFlag]);

  const handleOnEnded = useCallback(async () => {
    await createSource();
  }, [createSource]);

  useEffect(() => {
    if (!audioData || !audioContext) return;

    setFlag(true); // Quick (unnecessary) test for logging/learning react behaviour
    createSource().finally(() => setFlag(false));
  }, [audioData, audioContext, isFlag, isPlaying, createSource]);

  useEffect(() => {
    console.debug(
      { audioContext },
      { gainNode },
      { destination },
      { src: sourceNodeRef.current },
      { audioData }
    );
  }, [audioContext, gainNode, destination, sourceNodeRef.current, audioData]);

  // useEffect(() => {
  //   if (audioContext) {
  //     audioContext.resume().then(() => {
  //       console.log('Audio context resumed');
  //     });
  //   }
  // }, [audioContext]);

  const initAudio = async () => {
    const context = await ensureAudioCtx();
    setAudioContext(context);
    if (!context) console.error('src tester initAudio: audio ctx falsy');

    // if (!destination)
    setDestination(context.destination);

    if (!gainNode) {
      const gain = context.createGain();
      gain.gain.value = 0;
      setGainNode(gain);
    }
    gainNode?.connect(destination);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioContext || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const arrayBuffer = await file.arrayBuffer();

    // check if forgot to decode in idb -> source worklet flow
    const audioBuffer = await audioContext?.decodeAudioData(arrayBuffer);

    // Now extract the channel data (already as Float32Arrays)
    const numChannels = audioBuffer.numberOfChannels;
    const data = []; // just needs to be array, already 32bit duh // as Float32Array[];

    // Extract the channel data (already is Float32Arrays)
    for (let i = 0; i < numChannels; i++) {
      data.push(audioBuffer.getChannelData(i));
    }

    setAudioData(data);

    // temp data, to be replaced with subscribed event updates
    setLoopEnd(1); // todo: compare samples vs time for this
    setLoopStart(0);
    setLoopEnabled(false);
  };

  const playAudio = useCallback(
    async (midiNote: number, velocity: number = 1) => {
      if (!audioContext || !audioData) return;
      // if (sourceNodeRef.current?.isPlaying) return;
      if (!sourceNodeRef.current) return;

      sourceNodeRef.current.playNote(midiNote, velocity);

      setIsPlaying(true);

      sourceNodeRef.current.addEventListener('onended', () => {
        handleOnEnded;
        setIsPlaying(false);
      });
    },
    [audioContext, audioData]
  );

  // Stop audio
  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
      setIsPlaying(false);
    }
  };

  const [rampDuration, setRampDuration] = useState(0.1);

  useEffect(() => {
    if (sourceNodeRef.current) {
      const now = audioContext?.currentTime || 0;
      const node = sourceNodeRef.current;

      node.loop.value = loopEnabled ? 1 : 0;

      node.loopStart.cancelScheduledValues(now);
      node.loopStart.setValueAtTime(node.loopStart.value, now);
      node.loopStart.linearRampToValueAtTime(loopStart, now + rampDuration);

      node.loopEnd.cancelScheduledValues(now);
      node.loopEnd.setValueAtTime(node.loopEnd.value, now);
      node.loopEnd.linearRampToValueAtTime(loopEnd, now + rampDuration);

      node.playbackRate.cancelScheduledValues(now);
      node.playbackRate.setValueAtTime(node.playbackRate.value, now);
      node.playbackRate.linearRampToValueAtTime(
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

  useEffect(() => {
    gainNode?.gain.setTargetAtTime(volume, audioContext?.currentTime ?? 0, 0.1);
  }, [volume, gainNode]);

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>SourceNode Tester</h2>

      {/* Keyboard Controller */}
      {audioContext && (
        <KeyboardController
          onNoteOn={(midiNote: number, velocity: number = 1) => {
            // console.log('Note On:', midiNote, 'Velocity:', velocity);
            playAudio(midiNote, velocity);
          }}
          onNoteOff={() => {
            // console.log('Note Off');
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
          {audioData && (
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
                    max={2} // buffer.duration} // floatarr.length
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
                    max={2} // buffer.duration} // floatarr.length
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

                <div>
                  <label className='block'>Volume: {volume.toFixed(2)}</label>

                  <input
                    type='range'
                    value={volume}
                    min={0}
                    max={1}
                    step={0.05}
                    defaultValue={0}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className='w-full'
                  />
                </div>
              </div>

              {/* File Info 
              <div className='text-sm text-gray-700'>
                <p>Duration: {audioData.duration.toFixed(2)}s</p>
                <p>Channels: {audioData.numberOfChannels}</p>
                <p>Sample Rate: {audioData.sampleRate}Hz</p>
              </div>
              */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SourceNodeTester;
