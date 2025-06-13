import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import { createSamplePlayer, SamplePlayer, getInstance } from '@repo/audiolib';
import { createCheckbox, createSlider } from './utils/createInputEl';
import { UNICODES } from './utils/unicodes';
import { createSvgIcon } from './utils/svg-utils';
import midiSvgRaw from '../assets/icons/svg/svgrepo/midi-logo.svg?raw';
import keysSvgRaw from '../assets/icons/svg/svgrepo/computer-keyboard-2.svg?raw';
import loopOnSvgRaw from '../assets/icons/svg/svgrepo/loop-on.svg?raw';
import loopOffSvgRaw from '../assets/icons/svg/svgrepo/loop-off.svg?raw';
import listeningSvgRaw from '../assets/icons/svg/svgrepo/listening.svg?raw';
import recordSvgRaw from '../assets/icons/svg/phosphore/record.svg?raw';
import stopSvgRaw from '../assets/icons/svg/phosphore/stop.svg?raw';

// Todo: event dispatch

const { div, button } = van.tags;

const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer;
  let audioBuffer: AudioBuffer | null = null;

  const expanded = attributes.attr('expanded', 'true');

  // Audio parameters
  const volume = van.state(0.5);
  const attack = van.state(0.001);
  const release = van.state(0.3);

  // Loop parameters
  const loopStart = van.state(0);
  const loopEnd = van.state(0.99);
  const startOffset = van.state(0);
  const endOffset = van.state(1);
  const sampleDuration = van.state(1);

  // Control states
  const keyboardEnabled = van.state(true);
  const midiEnabled = van.state(false);
  const loopEnabled = van.state(false);
  const holdEnabled = van.state(false);
  const loopLocked = van.state(false);
  const holdLocked = van.state(false);

  // Recording state
  const recordBtnState: State<'Record' | 'Armed' | 'Recording'> =
    van.state('Record');

  // Status
  const status = van.state('Not initialized');

  // Helper to avoid repetitive null checks
  const derive = (fn: () => void) => van.derive(() => samplePlayer && fn());

  attributes.mount(() => {
    const initializeAudio = async () => {
      try {
        // Initialize audiolib
        const audiolib = getInstance();
        if (!audiolib.isReady) await audiolib.init();

        // Get polyphony from attribute or use default
        const polyphony = parseInt(attributes.attr('polyphony', '16').val);

        // Todo: remove dep on audiolib class, add destination master handling
        samplePlayer = audiolib.createSamplePlayer(undefined, polyphony);
        // samplePlayer = createSamplePlayer(undefined, polyphony);
        // console.info(samplePlayer)

        // Connect to audio destination
        // currently automatic connect

        if (!samplePlayer) {
          console.warn('Failed to create sample player');
          status.val = 'Failed to initialize';
          return;
        }

        // Reactive parameter binding
        derive(() => samplePlayer.setAttackTime(attack.val));
        derive(() => samplePlayer.setReleaseTime(release.val));
        derive(() => samplePlayer.setLoopStart(loopStart.val));
        derive(() => samplePlayer.setLoopEnd(loopEnd.val));
        derive(() => samplePlayer.setSampleStartOffset(startOffset.val));
        derive(() => samplePlayer.setSampleEndOffset(endOffset.val));
        derive(() => (samplePlayer.volume = volume.val));

        // Control states
        derive(() =>
          keyboardEnabled.val
            ? samplePlayer.enableKeyboard()
            : samplePlayer.disableKeyboard()
        );
        derive(() =>
          midiEnabled.val
            ? samplePlayer.enableMIDI()
            : samplePlayer.disableMIDI()
        );
        derive(() => {
          samplePlayer.setHoldLocked(holdLocked.val);
          if (holdLocked.val) samplePlayer.setLoopEnabled(true);
        });
        derive(() => {
          samplePlayer.setLoopLocked(loopLocked.val);
          if (loopLocked.val) samplePlayer.setLoopEnabled(true);
        });

        // Listen for SamplePlayer events
        samplePlayer.onMessage('loop:enabled', (msg: any) => {
          // console.log(`onMessage, loop:enabled: ${msg.enabled}`);
          loopEnabled.val = msg.enabled;
          status.val = `Loop ${msg.enabled ? 'enabled' : 'disabled'}`;
        });

        // TODO: Make KeyboardInputManager in audiolib handle caps robustly and sampleplayer.sendUpStreamMessage
        // then remove these handlers if works
        document.addEventListener('keydown', (e) => {
          if (e.code === 'CapsLock') {
            const capsState = e.getModifierState('CapsLock');
            if (capsState !== loopEnabled.val) loopEnabled.val = capsState;
          }
        });
        document.addEventListener('keyup', (e) => {
          if (e.code === 'CapsLock') {
            const capsState = e.getModifierState('CapsLock');
            if (capsState !== loopEnabled.val) loopEnabled.val = capsState;
          }
        });
        // todo: add listeners for other messages and type them

        // todo: Dispatch custom event to notify listeners that the sampler is initialized
        status.val = 'Ready';
      } catch (error) {
        console.error('Failed to initialize sampler:', error);
        status.val = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    };

    initializeAudio();

    return () => samplePlayer?.dispose();
  });

  // File loading handler
  const loadSample = async () => {
    if (!samplePlayer) {
      status.val = 'Sampler not initialized';
      return;
    }

    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/*';

      fileInput.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (files && files.length > 0) {
          const file = files[0];
          status.val = `Loading: ${file.name}...`;

          try {
            const arrayBuffer = await file.arrayBuffer();

            if (!arrayBuffer) {
              console.warn(`Failed to retrieve uploaded arrayBuffer`);
              return;
            }

            await samplePlayer.loadSample(arrayBuffer);

            // Update sample duration and reset ranges
            const newDuration = samplePlayer.sampleDuration; // (maybe update via message instead for consistency)
            sampleDuration.val = newDuration;
            loopStart.val = 0;
            loopEnd.val = newDuration;
            startOffset.val = 0;
            endOffset.val = newDuration;

            status.val = `Loaded: ${file.name}`;
          } catch (error) {
            console.error('Failed to load sample:', error);
            status.val = `Error loading: ${error instanceof Error ? error.message : String(error)}`;
          }
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('Failed to load sample:', error);
      status.val = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  // Recording handlers
  const startRecording = async () => {
    if (!samplePlayer || recordBtnState.val === 'Recording') return;

    try {
      const recorder = await getInstance().createRecorder();
      if (!recorder) {
        status.val = 'Failed to create recorder';
        return;
      }

      recorder.connect(samplePlayer);

      await recorder.start({
        useThreshold: true,
        startThreshold: -30,
        autoStop: true,
        stopThreshold: -40,
        silenceTimeoutMs: 1000,
      });

      //! onMessage('record:armed' is not working, temp fix:
      recordBtnState.val = 'Armed';
      status.val = 'Listening...';

      // Listen for Recorder events
      recorder.onMessage('record:armed', () => {
        recordBtnState.val = 'Armed';
        status.val = 'Listening...';
      });

      recorder.onMessage('record:start', () => {
        recordBtnState.val = 'Recording';
        status.val = 'Recording...';
      });

      recorder.onMessage('record:cancelled', () => {
        recordBtnState.val = 'Record';
        status.val = 'Recording cancelled';
      });

      recorder.onMessage('record:stop', () => {
        recordBtnState.val = 'Record';
        status.val = 'Recording completed';
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      status.val = `Recording error: ${error instanceof Error ? error.message : String(error)}`;
      recordBtnState.val = 'Record';
    }
  };

  const stopRecording = async () => {
    if (!recordBtnState.val) return;

    try {
      // Stop recording logic would go here
      recordBtnState.val = 'Record';
      status.val = 'Recording stopped';
    } catch (error) {
      console.error('Failed to stop recording:', error);
      status.val = `Stop error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  const defaultStyle = `display: flex; flex-direction: column; padding: 1rem`;
  const minimizedHeaderStyle = `display: flex; flex-direction: row; column-gap: 1rem;`;
  const expandedHeaderStyle = minimizedHeaderStyle; // The same for now, easy to up
  const buttonStyle = `padding: 0.2rem 0.5rem; margin: 0.1rem 0; cursor: pointer`;
  const statusStyle = `font-size: 0.8rem; color: #666; margin-top: 0.5rem`;

  const midiSvg = createSvgIcon(
    midiSvgRaw,
    { width: '2rem', height: '2rem' },
    'white',
    'MIDI'
  );

  const keysSvg = createSvgIcon(
    keysSvgRaw,
    { width: '2rem', height: '2rem' },
    'white',
    'Keyboard'
  );

  const loopOnSvg = createSvgIcon(
    loopOnSvgRaw,
    { width: '2rem', height: '2rem' },
    'white',
    'Loop'
  );

  const loopOffSvg = createSvgIcon(
    loopOffSvgRaw,
    { width: '2rem', height: '2rem' },
    'white',
    'Loop Off'
  );

  const startRecordingSvg = createSvgIcon(
    recordSvgRaw,
    { width: '2rem', height: '2rem' },
    'currentColor',
    'Rec'
  );

  const recordArmedSvg = createSvgIcon(
    listeningSvgRaw,
    { width: '2rem', height: '2rem' },
    'white',
    'ARMED'
  );

  const stopRecordingSvg = createSvgIcon(
    stopSvgRaw,
    { width: '2rem', height: '2rem' },
    'currentColor',
    'Stop'
  );

  return div(
    { class: 'sampler-element', style: () => defaultStyle },

    // Expandable Header

    div(
      {
        class: 'header',
        style: () =>
          expanded.val === 'true' ? expandedHeaderStyle : minimizedHeaderStyle,
        onclick: () =>
          (expanded.val = expanded.val === 'true' ? 'false' : 'true'),
      },
      () => (expanded.val === 'true' ? '▼ Sampler' : '▶ Sampler'),

      // Sample loading and recording buttons

      div(
        { style: 'display: flex; gap: 10px; margin-bottom: 1rem;' },
        button(
          {
            style: buttonStyle,
            onclick: (e) => {
              e.stopPropagation();
              loadSample();
            },
          },
          'Upload'
        ),
        button(
          {
            // style: () =>
            //   `${buttonStyle} ${recorderState.val ? 'background-color: #ff4444; color: white' : ''}`,
            onclick: (e) => {
              e.stopPropagation();
              recordBtnState.val === 'Recording' ||
              recordBtnState.val === 'Armed'
                ? stopRecording()
                : startRecording();
            },
          },
          () => recordBtnState.val || 'Record'
        )
      )
    ),

    // Playback Controls

    div(
      {
        class: 'controls',
        style: () => (expanded.val === 'true' ? '' : 'display: none'),
      },

      // Sliders

      createSlider('Volume', volume, 0, 1, 0.01),
      createSlider('Attack', attack, 0, 1, 0.001, 's', 3),
      createSlider('Release', release, 0, 2, 0.01, 's', 2),

      createSlider(
        'Loop Start',
        loopStart,
        0,
        sampleDuration.val,
        0.001,
        's',
        3
      ),

      createSlider('Loop End', loopEnd, 0, sampleDuration.val, 0.001, 's', 3),

      createSlider(
        'Start Offset',
        startOffset,
        0,
        sampleDuration.val,
        0.001,
        's',
        3
      ),

      createSlider(
        'End Offset',
        endOffset,
        0,
        sampleDuration.val,
        0.001,
        's',
        3
      ),

      // Checkboxes

      div(
        { style: 'display: flex; gap: 10px; flex-wrap: wrap;' },

        // Enable input handlers
        createCheckbox(keysSvg, keyboardEnabled),
        createCheckbox(midiSvg, midiEnabled),

        // Loop and hold
        createCheckbox(
          () => (loopEnabled.val || loopLocked.val ? loopOnSvg : loopOffSvg),
          loopLocked,
          {
            unchecked: UNICODES.unlocked,
            checked: UNICODES.locked,
          }
        ),
        createCheckbox('Hold', holdLocked, {
          unchecked: UNICODES.unlocked,
          checked: UNICODES.locked,
        })
      ),

      // Status display
      div({ style: statusStyle }, () => `Status: ${status.val}`)
    )
  );
};

export const defineSampler = (elementName: string = 'sampler-element') => {
  define(elementName, SamplerElement, false);
};
