import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import '../controls/webaudio-controls/webaudio-controls';

import {
  type SamplePlayer,
  type CustomEnvelope,
  type EnvelopeType,
  type Recorder,
  getInstance,
} from '@repo/audiolib';

import { createIcons } from '../../utils/icons';
import { SampleControls } from '../controls/SampleControls';
import { ExpandableHeader } from '../primitives/ExpandableHeader';
import { FileOperations } from '../controls/FileOperations';
import {
  VolumeControl,
  InputControls,
  LoopHoldControls,
} from '../controls/AudioControls';

import { EnvelopeSVG } from '../controls/envelope/EnvelopeSVG';

const { div, button } = van.tags;

export const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer | null = null;
  let currentRecorder: Recorder | null = null;

  // Attributes
  const expanded = attributes.attr('expanded', 'true');

  // Audio params
  const volume = van.state(0.75);
  const ampEnvelope = van.state<CustomEnvelope | null>(null);
  const pitchEnvelope = van.state<CustomEnvelope | null>(null);
  const filterEnvelope = van.state<CustomEnvelope | null>(null);

  // Pitch params
  // const transposition = van.state(0);

  // Loop params
  const loopStartSeconds = van.state(0);
  const loopEndSeconds = van.state(0);
  const loopRampSeconds = van.state(0.5);

  // Trim sample params
  const startPointSeconds = van.state(0);
  const endPointSeconds = van.state(0);

  // Sample Duration
  const sampleDurationSeconds = van.state(0);

  // Control states
  const keyboardEnabled = van.state(true);
  const midiEnabled = van.state(false);
  const loopEnabled = van.state(false);
  const holdEnabled = van.state(false);
  const loopLocked = van.state(false);
  const holdLocked = van.state(false);

  const icons = createIcons();

  // === Envelopes ===

  const chosenEnvelope: State<EnvelopeType> = van.state('amp-env');
  const envDimensions = van.state({ width: '100%', height: '200px' });

  let ampEnvInstance: EnvelopeSVG | null = null;
  let filterEnvInstance: EnvelopeSVG | null = null;
  let pitchEnvInstance: EnvelopeSVG | null = null;

  const createEnvelopes = (duration: number) => {
    if (
      sampleDurationSeconds.val &&
      ampEnvelope.val?.points.length &&
      filterEnvelope.val?.points.length &&
      pitchEnvelope.val?.points.length
    ) {
      if (ampEnvInstance) ampEnvInstance.cleanup();
      if (filterEnvInstance) filterEnvInstance.cleanup();
      if (pitchEnvInstance) pitchEnvInstance.cleanup();

      ampEnvInstance = EnvelopeSVG(
        'amp-env',
        ampEnvelope.val!.points, // todo: use state ?
        sampleDurationSeconds,
        handleEnvelopeChange,
        enableEnvelope,
        disableEnvelope,
        handleEnvelopeLoopChange,
        handleEnvelopeSyncChange,
        setEnvelopeTimeScale,
        envDimensions.val.width,
        envDimensions.val.height,
        { x: [0, 1], y: [0, 1] }, // snapToValues
        0.05, // snapThreshold
        true, // enabled
        true, // loop enabled
        true // multiColorPlayheads
      );

      filterEnvInstance = EnvelopeSVG(
        'filter-env',
        filterEnvelope.val!.points,
        sampleDurationSeconds,
        handleEnvelopeChange,
        enableEnvelope,
        disableEnvelope,
        handleEnvelopeLoopChange,
        handleEnvelopeSyncChange,
        setEnvelopeTimeScale,
        envDimensions.val.width,
        envDimensions.val.height,
        { x: [0, 1], y: [0] },
        0.025,
        false,
        true,
        true
      );
    }

    pitchEnvInstance = EnvelopeSVG(
      'pitch-env',
      pitchEnvelope.val!.points,
      sampleDurationSeconds,
      handleEnvelopeChange,
      enableEnvelope,
      disableEnvelope,
      handleEnvelopeLoopChange,
      handleEnvelopeSyncChange,
      setEnvelopeTimeScale,
      envDimensions.val.width,
      envDimensions.val.height,
      { x: [0, 1], y: [0.5] },
      0.05,
      true,
      true,
      true
    );
  };

  // Recording state
  const recordBtnState: State<'Record' | 'Armed' | 'Recording'> =
    van.state('Record');

  // Status
  const status = van.state('Not initialized');

  // Helper to avoid repetitive null checks
  const derive = (fn: () => void) => van.derive(() => samplePlayer && fn()); // .initialized ?

  attributes.mount(() => {
    const initializeAudio = async () => {
      try {
        const audiolib = getInstance();
        if (!audiolib.initialized) await audiolib.init();

        const polyphony = parseInt(attributes.attr('polyphony', '16').val);
        // Todo: remove dep on audiolib class, add destination master handling
        samplePlayer = audiolib.createSamplePlayer(undefined, polyphony);
        // connects automatically to audio destination
        console.log('polyphony', polyphony);
        if (!samplePlayer.initialized) {
          console.warn('Failed to create sample player');
          status.val = 'Failed to initialize';
          return;
        }

        // Setup envelopes
        ampEnvelope.val = samplePlayer.getEnvelope('amp-env');
        filterEnvelope.val = samplePlayer.getEnvelope('filter-env');
        pitchEnvelope.val = samplePlayer.getEnvelope('pitch-env');

        // createEnvelopes(sampleDurationSeconds.val);

        van.derive(() => {
          if (!samplePlayer) return;
          if (loopStartSeconds.val !== samplePlayer.loopStart) {
            if (loopRampSeconds.val === 0) {
              samplePlayer.scrollLoopPoints(
                loopStartSeconds.val,
                loopEndSeconds.val
              );
            } else {
              samplePlayer.setLoopStart(
                loopStartSeconds.val,
                loopRampSeconds.val
              );
            }
          }
        });

        van.derive(() => {
          if (!samplePlayer) return;
          if (loopRampSeconds.val === 0) return; // Todo: clarify

          if (loopEndSeconds.val !== samplePlayer.loopEnd) {
            samplePlayer.setLoopEnd(loopEndSeconds.val, loopRampSeconds.val);
          }
        });

        derive(() => {
          // if (samplePlayer?.isLoaded) {
          samplePlayer?.setSampleStartPoint(startPointSeconds.val);
        });

        derive(() => {
          // if (samplePlayer?.isLoaded) {
          samplePlayer?.setSampleEndPoint(endPointSeconds.val);
        });

        derive(() => {
          if (samplePlayer?.volume !== undefined) {
            samplePlayer.volume = volume.val;
          }
        });

        // Control states
        derive(() =>
          keyboardEnabled.val
            ? samplePlayer?.enableKeyboard()
            : samplePlayer?.disableKeyboard()
        );
        derive(() =>
          midiEnabled.val
            ? samplePlayer?.enableMIDI()
            : samplePlayer?.disableMIDI()
        );
        derive(() => {
          samplePlayer?.setHoldLocked(holdLocked.val);
        });
        derive(() => {
          samplePlayer?.setLoopLocked(loopLocked.val);
        });

        // === SAMPLE-PLAYER MESSAGES ===

        samplePlayer.onMessage('sample:loaded', (msg: any) =>
          onSampleLoaded(msg.durationSeconds)
        );

        samplePlayer.onMessage('sample-envelopes:trigger', (msg: any) => {
          ampEnvInstance?.triggerPlayAnimation(msg);
          filterEnvInstance?.triggerPlayAnimation(msg);
          pitchEnvInstance?.triggerPlayAnimation(msg);
        });

        samplePlayer.onMessage('voice:releasing', (msg: any) => {
          ampEnvInstance?.releaseAnimation(msg);
          filterEnvInstance?.releaseAnimation(msg);
          pitchEnvInstance?.releaseAnimation(msg);
        });

        samplePlayer.onMessage('voice:stopped', (msg: any) => {
          ampEnvInstance?.releaseAnimation(msg);
          filterEnvInstance?.releaseAnimation(msg);
          pitchEnvInstance?.releaseAnimation(msg);
        });

        samplePlayer.onMessage('sample:pitch-detected', (msg: any) => {
          status.val = `Sample Pitch Detected -> ${msg.pitch}`;
        });

        // === Other listeners (to be removed) === //

        // todo (later): Make KeyboardInputManager in audiolib handle caps robustly
        // and sampleplayer sendUpStreamMessage for loop & hold states
        // then remove these handlers
        document.addEventListener('keydown', (e) => {
          if (e.code === 'CapsLock') {
            const capsState = e.getModifierState('CapsLock');
            if (capsState !== loopEnabled.val && !loopLocked.val) {
              loopEnabled.val = capsState;
              status.val = capsState ? 'Loop Enabled' : 'Loop disabled';
            }
          }
        });

        document.addEventListener('keyup', (e) => {
          if (e.code === 'CapsLock') {
            const capsState = e.getModifierState('CapsLock');
            if (capsState !== loopEnabled.val && !loopLocked.val) {
              loopEnabled.val = capsState;
              status.val = capsState ? 'Loop Enabled' : 'Loop disabled';
            }
          }
        });

        // === END: Other listeners (to be removed) === //

        status.val = 'Ready';
      } catch (error) {
        console.error('Failed to initialize sampler:', error);
        status.val = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    };

    const keyboardSection = document.querySelector('.keyboard-section');
    if (keyboardSection) {
      keyboardSection.appendChild(keyboard);
    }

    initializeAudio();

    return () => {
      samplePlayer?.dispose();
    };
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
            if (!samplePlayer) return;

            const arrayBuffer = await file.arrayBuffer();

            if (!arrayBuffer) {
              console.warn(`Failed to retrieve uploaded arrayBuffer`);
              return;
            }

            const audiobuffer = await samplePlayer.loadSample(arrayBuffer);
            const durationSeconds = audiobuffer.duration;

            await new Promise((resolve) => setTimeout(resolve, 0));

            if (durationSeconds > 0) {
              // Update sample duration and reset ranges
              sampleDurationSeconds.val = durationSeconds;
              // loopStartSeconds.val = 0;
              // loopEndSeconds.val = durationSeconds;
              // startPointSeconds.val = 0;
              // endPointSeconds.val = durationSeconds;

              status.val = `Loaded: ${file.name}`;
            }
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

  function onSampleLoaded(duration: number) {
    const buffer = samplePlayer?.audiobuffer;
    sampleDurationSeconds.val = duration;

    createEnvelopes(duration);

    if (buffer instanceof AudioBuffer) {
      ampEnvInstance?.drawWaveform(buffer);
      filterEnvInstance?.drawWaveform(buffer);
      pitchEnvInstance?.drawWaveform(buffer);
    }
    status.val = `All voices loaded. Sample Duration: ${duration.toFixed(3)}`;
  }

  // Recording handlers
  const startRecording = async () => {
    if (!samplePlayer || recordBtnState.val === 'Recording') return;

    try {
      const recorderResult = await getInstance().createRecorder();
      if (!recorderResult) {
        status.val = 'Failed to create recorder';
        return;
      }

      currentRecorder = recorderResult;
      if (!currentRecorder) return;

      currentRecorder.connect(samplePlayer);

      await currentRecorder.start({
        useThreshold: true,
        startThreshold: -30,
        autoStop: true,
        stopThreshold: -40,
        silenceTimeoutMs: 1000,
      });

      // ! onMessage('record:armed' is not working, temp fix:
      recordBtnState.val = 'Armed';
      status.val = 'Listening...';

      // Listen for Recorder events
      currentRecorder.onMessage('record:armed', () => {
        recordBtnState.val = 'Armed';
        status.val = 'Listening...';
      });

      currentRecorder.onMessage('record:start', () => {
        recordBtnState.val = 'Recording';
        status.val = 'Recording...';
      });

      currentRecorder.onMessage('record:cancelled', () => {
        recordBtnState.val = 'Record';
        status.val = 'Recording cancelled';
      });

      currentRecorder.onMessage('record:stop', () => {
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
    if (!currentRecorder) return;

    try {
      recordBtnState.val = 'Record';
      await currentRecorder?.stop();

      recordBtnState.val = 'Record';
      status.val = 'Recording stopped';
    } catch (error) {
      console.error('Failed to stop recording:', error);
      status.val = `Stop error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  const enableEnvelope = (envType: EnvelopeType) => {
    if (!samplePlayer) return;
    samplePlayer.enableEnvelope(envType);
  };

  const disableEnvelope = (envType: EnvelopeType) => {
    if (!samplePlayer) return;
    samplePlayer.disableEnvelope(envType);
  };

  const setEnvelopeTimeScale = (envType: EnvelopeType, timeScale: number) => {
    if (!samplePlayer) return;
    samplePlayer.setEnvelopeTimeScale(envType, timeScale);
  };

  const handleEnvelopeChange = (
    envType: EnvelopeType,
    index: number,
    time: number,
    value: number
  ) => {
    if (!samplePlayer) return;

    if (index === -1) {
      samplePlayer.addEnvelopePoint(envType, time, value);
    } else if (time === -1 && value === -1) {
      samplePlayer.deleteEnvelopePoint(envType, index);
      // } else {
      //   const lastIndex = samplePlayer.getEnvelope(envType).points.length - 1;
      //   if (index === 0) loopStart.val = time;
      //   if (index === lastIndex) loopEnd.val = time;
    } else {
      samplePlayer.updateEnvelopePoint(envType, index, time, value);
    }
  };

  const handleEnvelopeLoopChange = (
    envType: EnvelopeType,
    enabled: boolean
  ) => {
    if (!samplePlayer) return;
    samplePlayer.setEnvelopeLoop(envType, enabled, 'normal');
  };

  const handleEnvelopeSyncChange = (envType: EnvelopeType, sync: boolean) => {
    if (!samplePlayer) return;
    samplePlayer.setEnvelopeSync(envType, sync);
  };

  // const knob = document.createElement('webaudio-knob') as HTMLElement;
  // knob.setAttribute('value', '50');
  // knob.setAttribute('min', '0');
  // knob.setAttribute('max', '100');
  // document.body.appendChild(knob);

  const keyboard = document.createElement('webaudio-keyboard') as any;
  keyboard.setAttribute('width', '300');
  keyboard.setAttribute('height', '60');
  keyboard.setAttribute('min', '37'); // C3 = 48
  keyboard.setAttribute('keys', '31'); // 2 octaves + fifth (corresponding to curr computer keyboard range) // todo: use same keymap

  // Add event listener for note events
  keyboard.addEventListener('pointer', (event: any) => {
    // // HAX to ignore keyevents, todo: modify source code to dispatch separate key, mouse & touch events
    // // (currentKey will be set if keyevent)
    // if ((event.target as any).currentKey !== -1) {
    //   return;
    // }
    const [noteState, noteNumber] = event.note;
    if (noteState === 1) {
      samplePlayer?.play(noteNumber);
    } else {
      samplePlayer?.release(noteNumber);
    }
  });

  const defaultStyle = `display: flex; flex-direction: column; max-width: 50vw; padding: 1rem;`;

  return div(
    { class: 'sampler-element', style: () => defaultStyle },

    ExpandableHeader(
      'Sampler',
      expanded,

      // () =>
      FileOperations(
        samplePlayer,
        status,
        recordBtnState,
        loadSample,
        startRecording,
        stopRecording
      )
    ),

    div(
      {
        class: 'controls',
        style: () =>
          expanded.val === 'true' ? '' : 'display: none; padding: 0.5rem;',
      },

      VolumeControl(volume),

      () =>
        ampEnvelope.val &&
        pitchEnvelope.val &&
        filterEnvelope.val &&
        sampleDurationSeconds.val
          ? div(
              { style: 'margin: 10px 0;' },
              div(
                {
                  style:
                    'display: flex; column-gap: 0.5rem; margin-left: 0.5rem;',
                },

                button(
                  {
                    style: () =>
                      'cursor: pointer; font-size: 0.9rem; margin-bottom: 5px; padding: 0.5rem;',
                    onclick: () => (chosenEnvelope.val = 'amp-env'),
                  },
                  'Amp Env'
                ),
                button(
                  {
                    style: () =>
                      'cursor: pointer; font-size: 0.9rem; margin-bottom: 5px; padding: 0.5rem;',
                    onclick: () => (chosenEnvelope.val = 'filter-env'),
                  },
                  'Filter Env'
                ),
                button(
                  {
                    style: () =>
                      'cursor: pointer; font-size: 0.9rem; margin-bottom: 5px; padding: 0.5rem;',
                    onclick: () => (chosenEnvelope.val = 'pitch-env'),
                  },
                  'Pitch Env'
                )
              ),

              div(
                {
                  style: () =>
                    `position: relative;  height: ${envDimensions.val.height}; width: ${envDimensions.val.width};`,
                },

                () =>
                  ampEnvInstance
                    ? div(
                        {
                          style: () =>
                            `position: absolute; padding: 0.5rem; visibility: ${chosenEnvelope.val === 'amp-env' ? 'visible' : 'hidden'}`,
                        },
                        ampEnvInstance.element
                      )
                    : div(),
                () =>
                  filterEnvInstance
                    ? div(
                        {
                          style: () =>
                            `position: absolute; padding: 0.5rem; visibility: ${chosenEnvelope.val === 'filter-env' ? 'visible' : 'hidden'}`,
                        },
                        filterEnvInstance.element
                      )
                    : div(),
                () =>
                  pitchEnvInstance
                    ? div(
                        {
                          style: () =>
                            `position: absolute; padding: 0.5rem; visibility: ${chosenEnvelope.val === 'pitch-env' ? 'visible' : 'hidden'}`,
                        },
                        pitchEnvInstance.element
                      )
                    : div()
              )
            )
          : div(),

      () =>
        sampleDurationSeconds.val &&
        SampleControls(
          loopStartSeconds,
          loopEndSeconds,
          loopRampSeconds,
          startPointSeconds,
          endPointSeconds,
          sampleDurationSeconds
        ),

      div(
        { style: 'display: flex; gap: 10px; flex-wrap: wrap;' },
        InputControls(keyboardEnabled, midiEnabled, icons.keys, icons.midi),
        LoopHoldControls(loopEnabled, loopLocked, holdLocked, icons)
      ),

      div({
        class: 'keyboard-section',
        style: 'width: 30vw; height: 10vh; margin: 1rem 0;',
      }),

      div(
        { style: 'font-size: 0.8rem; color: #666; margin-top: 0.5rem;' },
        () => `Status: ${status.val}`
      )
    )
  );
};

export const defineSampler = (elementName: string = 'sampler-element') => {
  define(elementName, SamplerElement, false);
};
