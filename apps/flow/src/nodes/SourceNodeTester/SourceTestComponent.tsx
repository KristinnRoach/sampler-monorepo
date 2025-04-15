import React, { useState, useEffect, useCallback } from 'react';
import { samplelib, audiolib } from '@repo/audiolib';

import KeyboardController from '../../input/KeyboardController';

const testWithSynthAudio = async () => {
  try {
    // Create a simple sine wave buffer (1 second, 440Hz)
    const sampleRate = audiolib.audioContext?.sampleRate || 48000;
    const buffer = audiolib.audioContext?.createBuffer(
      2, // stereo
      sampleRate, // 1 second
      sampleRate
    );

    console.debug(`context sampleRate: ${sampleRate}`);

    // Fill with a loud sine wave
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer?.getChannelData(channel);
      if (channelData) {
        for (let i = 0; i < channelData.length; i++) {
          // 440Hz sine wave at 0.8 amplitude (quite loud)
          channelData[i] = 0.8 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
        }
      }
    }

    if (buffer) {
      // Log the values to confirm non-zero data
      console.log('Synthetic buffer created:', {
        first10Samples: Array.from(buffer.getChannelData(0).slice(0, 10)),
        nonZeroCheck: buffer.getChannelData(0).some((v) => v !== 0),
      });

      // Store and use this test buffer
      const storedId = await samplelib.storeAudioSample(
        'test-sine', // id
        'test-sine', // url
        buffer // buffer
      );

      await audiolib.refreshLatestSample();

      // Try playing using a simple buffer source
      const source = audiolib.audioContext?.createBufferSource();
      if (source && audiolib.audioContext) {
        source.buffer = buffer;
        source.connect(audiolib.audioContext.destination);
        source.start();
        console.log('Playing test tone with BufferSourceNode');
      }

      // Try with your custom source node
      const sourceNode = await audiolib.createSourceNode();
      if (sourceNode) {
        sourceNode.playNote(60, 1);
        console.log('Playing test tone with your SourceNode');
      }
    }
  } catch (error) {
    console.error('Error creating synthetic audio:', error);
  }
};

function testAudio(buffer?: AudioBuffer) {
  console.debug('testAudio() called');
  const audioContext = audiolib.audioContext;
  if (!audioContext) return;

  if (buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
    setTimeout(() => source.stop(), 1000);
    return;
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 440;
  gainNode.gain.value = 0.5;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  setTimeout(() => oscillator.stop(), 1000);
}

const testWithDefaultAudio = async () => {
  console.debug('testWithDefaultAudio() called');
  try {
    // Create a simple sine wave buffer
    const sampleRate = audiolib.audioContext?.sampleRate || 44100;
    const lengthInSeconds = 2;
    const buffer = audiolib.audioContext?.createBuffer(
      2, // stereo
      sampleRate * lengthInSeconds,
      sampleRate
    );

    console.debug('testWithDefaultAudio() buffer created', {
      auBuff: buffer,
      length: buffer?.length,
      sampleRate: buffer?.sampleRate,
      duration: buffer?.duration,
    });

    // Fill with a simple sine wave
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer?.getChannelData(channel);
      if (channelData) {
        for (let i = 0; i < channelData.length; i++) {
          // 440Hz sine wave
          channelData[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
        }
      }
    }
    console.debug(
      'testWithDefaultAudio() buffer filled with sine wave, first 10 samples:',
      {
        channel0: buffer?.getChannelData(0).slice(0, 10),
        channel1: buffer?.getChannelData(1).slice(0, 10),
      }
    );
    // Check if buffer has any non-zero content
    const firstChannel = buffer?.getChannelData(0);
    const hasSound = firstChannel?.some((sample) => sample !== 0);
    if (!hasSound) {
      console.warn('AudioBuffer appears to be silent - all samples are zero');
    } else {
      console.debug('AudioBuffer has sound');
    }

    if (buffer) {
      // Store and use this test buffer
      const storedId = await samplelib.storeAudioSample(
        'test-sine', // id
        'test-sine', // url
        buffer // buffer
      );
      console.debug(`Stored test sine wave, ID: ${storedId}`);
      await audiolib.refreshLatestSample();

      // Play the test audio
      const source = audiolib.audioContext?.createBufferSource();
      if (source && audiolib.audioContext) {
        source.buffer = buffer;
        source.connect(audiolib.audioContext.destination);
        source.start();
        setTimeout(() => source.stop(), 1000);
      }
    }
  } catch (error) {
    console.error('Error creating test audio:', error);
  }
};

const SourceTestComponent = () => {
  const [volume, setVolume] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  // const [sampleId, setSampleId] = useState<string | null>(null);

  useEffect(() => {
    console.debug('App.tsx: Mounted');
    try {
      audiolib.init().then(() => console.debug('Audiolib initialized'));
    } catch (error) {
      console.error('Error initializing Audiolib:', error);
    }
  }, []);

  // const handleFileUpload = useCallback(
  //   async (e: React.ChangeEvent<HTMLInputElement>) => {
  //     if (!e.target.files || e.target.files.length === 0) return;

  //     const file = e.target.files[0];
  //     console.debug(`File uploaded: ${file.name}`);

  //     const arrayBuffer = await file.arrayBuffer(); // todo: allow passing array buffer directly
  //     console.debug(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);

  //     const audioBuffer =
  //       await audiolib.audioContext?.decodeAudioData(arrayBuffer);
  //     if (!audioBuffer) return;
  //     console.debug(`AudioBuffer duration: ${audioBuffer.duration} seconds`);

  //     // todo: add "name" to samplelib (passing name instead of url now)
  //     const storedId = await samplelib.storeAudioSample(
  //       file.name, // id
  //       file.name, // url
  //       audioBuffer // buffer
  //     );
  //     console.debug(`Stored sample ID: ${storedId}`);

  //     // setSampleId(storedId);
  //     await audiolib.refreshLatestSample();

  //     testAudio(audioBuffer);
  //   },
  //   []
  // );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      console.debug(`File uploaded: ${file.name}`);

      try {
        const arrayBuffer = await file.arrayBuffer();
        console.debug(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);

        // Make sure context is running
        if (audiolib.audioContext?.state !== 'running') {
          await audiolib.audioContext?.resume();
        }

        // Check if arrayBuffer is valid before decoding
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          console.error('Empty arrayBuffer');
          return;
        }

        const audioBuffer =
          await audiolib.audioContext?.decodeAudioData(arrayBuffer);

        // Validate the audioBuffer
        if (!audioBuffer || audioBuffer.length === 0) {
          console.error('Failed to decode audio data - empty buffer');
          return;
        }

        // Check if buffer contains non-zero data
        const channel0 = audioBuffer.getChannelData(0);
        const hasNonZero = channel0.some((val) => val !== 0);
        console.debug(`AudioBuffer non-zero check: ${hasNonZero}`);

        // todo: add "name" to samplelib (passing name instead of url now)
        const storedId = await samplelib.storeAudioSample(
          file.name, // id
          file.name, // url
          audioBuffer // buffer
        );
        console.debug(`Stored sample ID: ${storedId}`);

        // setSampleId(storedId);
        await audiolib.refreshLatestSample();

        //testAudio(audioBuffer);
      } catch (error) {
        console.error('Error processing audio file:', error);
      }
    },
    []
  );

  const playNote = useCallback(
    async (midiNote: number, velocity: number = 1) => {
      await audiolib.createSourceNode().then((src) => {
        // audiolib.testPlayUsingAudioBufferSourceNode();
        if (!src) return;
        console.debug('playNote() --> SourceNode created');
        src.playNote(midiNote, velocity);
        setIsPlaying(true);
      });
    },
    [audiolib]
  );

  // Stop audio
  const stopAudio = () => {
    audiolib.sourceNodes.forEach((src) => {
      if (src.isPlaying) src.stop();
    });
    setIsPlaying(false);
  };

  const [rampDuration, setRampDuration] = useState(0.1);

  useEffect(() => {
    audiolib.sourceNodes.forEach((src) => {
      src.loop.value = loopEnabled ? 1 : 0;

      src.loopStart.cancelScheduledValues(0);
      src.loopStart.setValueAtTime(src.loopStart.value, 0);
      src.loopStart.linearRampToValueAtTime(loopStart, 0 + rampDuration);

      src.loopEnd.cancelScheduledValues(0);
      src.loopEnd.setValueAtTime(src.loopEnd.value, 0);
      src.loopEnd.linearRampToValueAtTime(loopEnd, 0 + rampDuration);

      src.playbackRate.cancelScheduledValues(0);
      src.playbackRate.setValueAtTime(src.playbackRate.value, 0);
      src.playbackRate.linearRampToValueAtTime(playbackRate, 0 + rampDuration);
    });
  }, [loopEnabled, loopStart, loopEnd, playbackRate, rampDuration]);

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>SourceNode Tester</h2>

      {/* Keyboard Controller */}
      {audiolib && (
        <KeyboardController
          onNoteOn={(midiNote: number, velocity: number = 1) => {
            playNote(midiNote, velocity);
          }}
          onNoteOff={() => {
            stopAudio();
          }}
        />
      )}

      {/* Audio Context Initialization
      {!audioContext && (
        <button
          onClick={initAudio}
          className='bg-blue-500 text-white p-2 rounded mb-4'
        >
          Initialize Audio
        </button>
      )} */}

      {/* File Upload */}
      {audiolib && (
        <div className='mb-4'>
          <button
            className='bg-blue-500 text-white p-2 rounded mb-4'
            onClick={async () => testWithSynthAudio()}
          >
            {/* onClick={() => testWithDefaultAudio} */}
            Test With Default Audio
          </button>
          <button onClick={() => testAudio}>check if any sound</button>
          <input
            type='file'
            accept='audio/*'
            onChange={handleFileUpload}
            className='mb-2'
          />
          {/* Playback Controls */}
          <div className='space-y-4'>
            <div className='flex space-x-2'>
              <button
                onClick={() => playNote(60, 1)}
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
                <label className='block'>Loop End: {loopEnd.toFixed(2)}s</label>
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
        </div>
      )}
    </div>
  );
};

export default SourceTestComponent;
