import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import KeyboardController from '../input/KeyboardController';
import { VoiceManager } from '@repo/audiolib';

const VoiceTest = () => {
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [loopStart, setLoopStart] = createSignal(0);
  const [loopEnd, setLoopEnd] = createSignal(0.5);
  const [interpolationTime, setInterpolationTime] = createSignal(0.5);
  const [status, setStatus] = createSignal('');
  const [selectedFile, setSelectedFile] = createSignal(null);

  let voiceManager = new VoiceManager();

  onMount(() => {
    voiceManager.init();

    // // Subscribe to loop points interpolated event using the default voice
    // const voiceId = voiceManager.getCurrentVoiceId();
    // if (voiceId) {
    //   voiceManager.on('loopPointsInterpolated', (detail) => {
    //     setStatus(`Loop points interpolated: ${JSON.stringify(detail)}`);
    //     setTimeout(() => setStatus(''), 1000);
    //   });
    // }

    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('keydown', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });

    // Set initial loop points
    // updateLoopPoint();
  });

  onCleanup(() => {
    voiceManager.dispose();
  });

  const initAudioContext = () => {
    if (voiceManager._audioContext?.state === 'suspended') {
      // Resume context immediately at user interaction
      voiceManager._audioContext.resume();
    }
  };

  const handleLoadAudio = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    const isAudioRunning = await voiceManager.ensureAudioContext();

    if (!isAudioRunning) {
      setStatus('Failed to start audio context');
      return;
    }

    try {
      setStatus('Loading audio...');

      // Read file as ArrayBuffer
      const fileReader = new FileReader();
      const filePromise = new Promise((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = () => reject(fileReader.error);
      });
      fileReader.readAsArrayBuffer(file);
      const arrayBuffer = await filePromise;

      // Use the improved loadAudioFile method
      const buffer = await voiceManager.loadAudioFile(
        arrayBuffer,
        true,
        file.name
      );

      // Set the buffer using the default voice
      voiceManager.setBuffer(buffer);

      // Update loop points after loading new audio
      updateLoopPoint();

      setStatus('Audio loaded successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus(`Error loading audio: ${error.message}`);
    }
  };

  function handlePlay(midiNote) {
    // Play using the default voice
    if (voiceManager.play(midiNote)) {
      setIsPlaying(true);
    }
  }

  function handleStop() {
    // Stop the default voice
    if (voiceManager.stop()) {
      setIsPlaying(false);
    }
  }

  // TODO: Update to MILLISECONDS ? Decide on lib API for consistency
  const handleParamChange = (value, param) => {
    if (param === 'loopStart') {
      if (value > loopEnd() - 0.0001) {
        return;
      }
      setLoopStart(value);
      updateLoopPoint(param);
      return;
    }

    if (param === 'loopEnd') {
      if (value < loopStart() + 0.0001) {
        return;
      }
      setLoopEnd(value);
      updateLoopPoint(param);
      return;
    }

    if (param === 'interpolationTime') {
      setInterpolationTime(value);
    }

    // updateLoopPoint(param);
  };

  const updateLoopPoint = (param) => {
    const targetValue =
      param === 'loopEnd' ? parseFloat(loopEnd()) : parseFloat(loopStart());
    const interpTime = parseFloat(interpolationTime());

    if (voiceManager.setLoopPoint(targetValue, param, interpTime)) {
      setStatus(
        `Loop point updated: ${param}s, target value: ${targetValue}s with ${interpTime}<SEC OR MILLI??> interpolation`
      );
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div
      class='voice-test'
      style={{
        margin: '0 auto',
        width: '100vw',
        padding: '1rem',
      }}
    >
      <KeyboardController onNoteOn={handlePlay} onNoteOff={handleStop} />
      <h2>Voice API Test</h2>

      <div class='control-panel'>
        <div class='input-group'>
          <label>Load audio file:</label>
          <input type='file' accept='audio/*' onChange={handleLoadAudio} />
        </div>

        <div class='playback-controls'>
          <button onClick={() => handlePlay()} disabled={isPlaying()}>
            Play
          </button>
          <button onClick={handleStop} disabled={!isPlaying()}>
            Stop
          </button>
        </div>

        <div class='loop-controls'>
          <div class='input-group'>
            <label>Loop Start (seconds):</label>
            <input
              type='range'
              min='0'
              max={loopEnd()}
              step='0.0005'
              value={loopStart()}
              onInput={(e) => handleParamChange(e.target.value, 'loopStart')}
            />
          </div>

          <div class='input-group'>
            <label>Loop End (seconds):</label>
            <input
              type='range'
              min={loopStart()}
              max='0.5'
              step='0.0005'
              value={loopEnd()}
              onInput={(e) => handleParamChange(e.target.value, 'loopEnd')}
            />
          </div>

          <div class='input-group'>
            <label>Interpolation Time (seconds):</label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.0005'
              value={interpolationTime()}
              onInput={(e) =>
                handleParamChange(e.target.value, 'interpolationTime')
              }
            />
          </div>
        </div>
      </div>

      {status() && <div class='message'>{status()}</div>}

      <div class='info'>
        <p>Status: {isPlaying() ? 'Playing' : 'Stopped'}</p>
        {selectedFile() && <p>Loaded file: {selectedFile().name}</p>}
      </div>
    </div>
  );
};

export default VoiceTest;
