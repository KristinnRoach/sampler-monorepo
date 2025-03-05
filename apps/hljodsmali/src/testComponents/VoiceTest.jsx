import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import KeyboardController from '../input/KeyboardController';
import { VoiceManager } from '@repo/audiolib';

const VoiceTest = () => {
  const [voiceId, setVoiceId] = createSignal(null);
  const [selectedFile, setSelectedFile] = createSignal(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [loopStart, setLoopStart] = createSignal(0);
  const [loopEnd, setLoopEnd] = createSignal(0);
  const [interpolationTime, setInterpolationTime] = createSignal(0.5);
  const [status, setStatus] = createSignal('');
  const [isPreloaded, setIsPreloaded] = createSignal(false);

  let voiceManager = new VoiceManager();

  onMount(() => {
    voiceManager.init();
    // const id = voiceManager.createVoice(); // TODO: Make VoiceManager manage voiceId's
    // setVoiceId(id);

    // Subscribe to loop points interpolated event
    //   voiceManager.on(id, 'loopPointsInterpolated', (detail) => {
    //     setStatus(`Loop points interpolated: ${JSON.stringify(detail)}`);
    //     setTimeout(() => setStatus(''), 100);
    //   });
    // });

    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('keydown', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });
  });

  onCleanup(() => {
    if (voiceId()) {
      voiceManager.dispose();
    }
  });

  const initAudioContext = () => {
    if (voiceManager._audioContext?.state === 'suspended') {
      // Resume context immediately at user interaction, not right before playing
      voiceManager._audioContext.resume();
    }
  };

  const handleLoadAudio = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    voiceManager.resume();

    try {
      setStatus('Loading audio...');

      // // Read file as ArrayBuffer
      // const fileReader = new FileReader();
      // const filePromise = new Promise((resolve, reject) => {
      //   fileReader.onload = () => resolve(fileReader.result);
      //   fileReader.onerror = () => reject(fileReader.error);
      // });
      // fileReader.readAsArrayBuffer(file);
      // const arrayBuffer = await filePromise;

      // // Decode audio data and set it to the voice
      // const buffer = await voiceManager.loadAudioFile(arrayBuffer);

      try {
        const buffer = await voiceManager.loadAudioFile(file); // TODO: FIX
      } catch (error) {
        console.error('Error loading audio file:', error);
      }

      voiceManager.setBuffer(voiceId(), buffer);

      setStatus('Audio loaded successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus(`Error loading audio: ${error.message}`);
    }
  };

  function handlePlay(midiNote) {
    if (voiceManager.play(voiceId(), midiNote)) {
      setIsPlaying(true);
    }
    // console.log('ctx base latency: ', voiceApi._audioContext.baseLatency);
    // console.log('ctx output latency: ', voiceApi._audioContext.outputLatency);
  }

  function handleStop() {
    if (voiceManager.stop(voiceId())) {
      setIsPlaying(false);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && !e.repeat) {
      if (!isPlaying()) {
        handlePlay();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      if (isPlaying()) {
        handleStop();
      }
    }
  });

  const handleParamChange = (value, param) => {
    if (param === 'loopStart') {
      if (value > loopEnd() - 0.0001) {
        return;
      }
      setLoopStart(value);
    } else if (param === 'loopEnd') {
      if (value < loopStart() + 0.0001) {
        return;
      }
      setLoopEnd(value);
    } else if (param === 'interpolationTime') {
      setInterpolationTime(value);
    }

    const start = parseFloat(loopStart());
    const end = parseFloat(loopEnd());
    const interpTime = parseFloat(interpolationTime());

    if (voiceManager.setLoopPoints(voiceId(), start, end, interpTime)) {
      setStatus(
        `Loop points set: ${start}s to ${end}s with ${interpTime}s interpolation`
      );
      setTimeout(() => setStatus(''), 3000);
    }
  };

  handleParamChange(0, 'loopStart');
  handleParamChange(0.5, 'loopEnd');
  handleParamChange(0.5, 'interpolationTime');

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
          <button onClick={handlePlay} disabled={isPlaying()}>
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

          {/* <button onClick={handleSetLoopPoints}>Set Loop Points</button> */}
        </div>
      </div>

      {status() && <div class='message'>{status()}</div>}

      <div class='info'>
        <p>Voice ID: {voiceId()}</p>
        <p>Status: {isPlaying() ? 'Playing' : 'Stopped'}</p>
        {selectedFile() && <p>Loaded file: {selectedFile().name}</p>}
      </div>
    </div>
  );
};

export default VoiceTest;
