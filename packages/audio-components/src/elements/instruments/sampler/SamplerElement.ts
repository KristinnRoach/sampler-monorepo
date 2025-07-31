import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';

import '../../controls/webaudio-controls/webaudio-keyboard';
import {
  keyboardEnabledInstruments,
  enableComputerKeyboard,
  disableComputerKeyboard,
  pressedKeys,
} from '../../../shared/keyboard/keyboard-state';

import {
  SamplePlayer,
  type CustomEnvelope,
  type EnvelopeType,
  type Recorder,
  createSamplePlayer,
  createAudioRecorder,
} from '@repo/audiolib';

import { createIcons } from '../../../shared/utils/icons';
import { SampleControls } from '../../controls/SampleControls';
import { ExpandableHeader } from '../../primitives/ExpandableHeader';
import { FileOperations } from '../../controls/FileOperations';
import { InputControls, LoopHoldControls } from '../../controls/checkboxes';
import { createLabeledKnob } from '../../primitives/createKnob';
import { Toggle } from '../../primitives/VanToggle';

import { EnvelopeSVG } from '../../controls/envelope/EnvelopeSVG';
import KeyMaps from '@/shared/keyboard/keyboard-keymaps';

const { div, button, label } = van.tags;

export const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer | null = null;
  let currentRecorder: Recorder | null = null;

  // Attributes
  const expanded = attributes.attr('expanded', 'true');

  // Audio params
  const volume = van.state(0.75);

  const dryWetMix = van.state({ dry: 1, wet: 0 });

  const hpfHz = van.state(40);
  const lpfHz = van.state(18000);

  const glideTime = van.state(0);
  const reverbAmount = van.state(0.0);
  const drive = van.state(0.0);
  const clipping = van.state(0.0);
  const feedbackAmount = van.state(0.0);
  const feedbackDecayTime = van.state(10);
  const feedbackPitch = van.state(0.5);
  const feedbackMode = van.state(true); // true = monophonic, false = polyphonic

  const ampEnvelope = van.state<CustomEnvelope | null>(null);
  const pitchEnvelope = van.state<CustomEnvelope | null>(null);
  const filterEnvelope = van.state<CustomEnvelope | null>(null);

  const pitchLFORate = van.state<number>(0);
  const pitchLFODepth = van.state<number>(0);
  const gainLFORate = van.state<number>(0);
  const gainLFODepth = van.state<number>(0);

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
  const currentKeymap = van.state(KeyMaps.default); // major // minor // pentatonic // default
  const keyboardEnabled = van.state(true);
  const midiEnabled = van.state(true);
  const loopEnabled = van.state(false);
  const holdEnabled = van.state(false);
  const loopLocked = van.state(false);
  const holdLocked = van.state(false);

  const icons = createIcons();

  // === KEYEVENT HANDLERS ===

  // TODO: Time latency diff from handling this here versus inside audiolib!

  let spacePressed = false;

  const keyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;

    // Always update base states
    const baseLoopEnabled = e.getModifierState('CapsLock');
    const baseHoldEnabled = e.shiftKey;

    // Track Space key specifically
    if (e.code === 'Space') {
      spacePressed = true;
    }

    // Calculate final state: base XOR space override
    loopEnabled.val = baseLoopEnabled !== spacePressed;
    holdEnabled.val = baseHoldEnabled !== spacePressed;

    const midiNote = currentKeymap.val[e.code];

    if (
      e.repeat ||
      !midiNote ||
      !keyboardEnabled.val ||
      !samplePlayer ||
      !keyboardEnabledInstruments.has(samplePlayer.nodeId)
    ) {
      return;
    }

    pressedKeys.add(e.code);
    samplePlayer?.play(midiNote);
  };

  const keyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      spacePressed = false;
      // Recalculate state when Space is released
      loopEnabled.val = e.getModifierState('CapsLock');
      holdEnabled.val = e.shiftKey;
    }

    const midiNote = currentKeymap.val[e.code];

    if (
      !midiNote ||
      !keyboardEnabled.val ||
      !samplePlayer ||
      !keyboardEnabledInstruments.has(samplePlayer.nodeId)
    ) {
      return;
    }

    samplePlayer!.release(midiNote);
    pressedKeys.delete(e.code);
  };

  // === Envelopes ===

  const chosenEnvelope: State<EnvelopeType> = van.state('amp-env');
  const envDimensions = van.state({ width: '100%', height: '200px' });

  let ampEnvInstance: EnvelopeSVG | null = null;
  let filterEnvInstance: EnvelopeSVG | null = null;
  let pitchEnvInstance: EnvelopeSVG | null = null;

  const createEnvelopes = () => {
    if (!samplePlayer) return;

    // Clean up previous instances
    if (ampEnvInstance) ampEnvInstance.cleanup();
    if (filterEnvInstance) filterEnvInstance.cleanup();
    if (pitchEnvInstance) pitchEnvInstance.cleanup();

    ampEnvelope.val = samplePlayer.getEnvelope('amp-env');
    filterEnvelope.val = samplePlayer.getEnvelope('filter-env');
    pitchEnvelope.val = samplePlayer.getEnvelope('pitch-env');

    ampEnvInstance = EnvelopeSVG(
      samplePlayer,
      'amp-env',
      envDimensions.val.width,
      envDimensions.val.height
    );

    filterEnvInstance = EnvelopeSVG(
      samplePlayer,
      'filter-env',
      envDimensions.val.width,
      envDimensions.val.height
    );

    pitchEnvInstance = EnvelopeSVG(
      samplePlayer,
      'pitch-env',
      envDimensions.val.width,
      envDimensions.val.height
    );
  };

  const drawWaveform = (buffer: AudioBuffer) => {
    ampEnvInstance?.drawWaveform(buffer);
    filterEnvInstance?.drawWaveform(buffer);
    pitchEnvInstance?.drawWaveform(buffer);
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
        const polyphony = parseInt(attributes.attr('polyphony', '16').val);
        samplePlayer = await createSamplePlayer(undefined, polyphony);

        samplePlayer.connect(samplePlayer.context.destination);
        // connects automatically to audio destination

        if (!samplePlayer.initialized) {
          console.warn('Failed to create sample player');
          status.val = 'Failed to initialize';
          return;
        }

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
          samplePlayer?.setSampleStartPoint(startPointSeconds.val);
        });

        derive(() => {
          if (samplePlayer?.isLoaded) {
            samplePlayer?.setSampleEndPoint(endPointSeconds.val);
          }
        });

        derive(() => {
          if (samplePlayer?.volume !== undefined) {
            samplePlayer.volume = volume.val;
          }
        });

        derive(() => {
          if (!samplePlayer?.initialized) return;
          samplePlayer.setGlideTime(glideTime.val);
        });

        derive(() => {
          if (!samplePlayer?.initialized) return;
          samplePlayer.setLoopEnabled(loopEnabled.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          samplePlayer.setHoldEnabled(holdEnabled.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          samplePlayer.setDryWetMix(dryWetMix.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          samplePlayer.setHpfCutoff(hpfHz.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          samplePlayer.setLpfCutoff(lpfHz.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          // samplePlayer.setReverbSend(reverbAmount.val);
          samplePlayer.setReverbAmount(reverbAmount.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          samplePlayer.setFeedbackAmount(feedbackAmount.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          samplePlayer.outputBus.setDrive(drive.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          samplePlayer.outputBus.setClippingMacro(clipping.val);
        });

        derive(() => {
          if (!samplePlayer?.initialized) return;
          samplePlayer.setFeedbackDecay(feedbackDecayTime.val);
        });

        derive(() => {
          if (!samplePlayer?.initialized) return;
          samplePlayer.setFeedbackPitchScale(feedbackPitch.val);
        });

        derive(() => {
          if (
            !samplePlayer?.outputBus.getNode('harmonic-feedback')?.initialized
          )
            return;
          const mode = feedbackMode.val === true ? 'monophonic' : 'polyphonic';
          samplePlayer.setFeedbackMode(mode);
        });

        derive(() => {
          if (!samplePlayer) return;
          // Scale 0-1 to 0.1-10 Hz
          const freqHz = gainLFORate.val * 100 + 0.1;
          samplePlayer.gainLFO?.setFrequency(freqHz);
        });

        derive(() => {
          if (!samplePlayer) return;
          samplePlayer.gainLFO?.setDepth(gainLFODepth.val);
        });

        derive(() => {
          if (!samplePlayer) return;
          // Scale 0-1 to 0.1-10 Hz
          const freqHz = pitchLFORate.val * 100 + 0.1;
          samplePlayer.pitchLFO?.setFrequency(freqHz);
        });

        derive(() => {
          if (!samplePlayer) return;

          const scaledDepth = pitchLFODepth.val / 10;
          samplePlayer.pitchLFO?.setDepth(scaledDepth);
        });

        // Control states
        derive(() =>
          keyboardEnabled.val
            ? samplePlayer && enableComputerKeyboard(samplePlayer.nodeId)
            : samplePlayer && disableComputerKeyboard(samplePlayer.nodeId)
        );
        // derive(() =>
        // todo: fix LibInstrument to allow this, temp solution below
        //   midiEnabled.val
        //     ? samplePlayer?.enableMIDI()
        //     : samplePlayer?.disableMIDI()
        // );

        derive(() => {
          if (midiEnabled.val) {
            // Check if method exists before calling
            if (
              samplePlayer &&
              'enableMIDI' in samplePlayer &&
              typeof samplePlayer.enableMIDI === 'function'
            ) {
              samplePlayer.enableMIDI();
            }
          } else {
            if (
              samplePlayer &&
              'disableMIDI' in samplePlayer &&
              typeof samplePlayer.disableMIDI === 'function'
            ) {
              samplePlayer.disableMIDI();
            }
          }
        });
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

        samplePlayer.onMessage('sample:pitch-detected', (msg: any) => {
          status.val = `Sample Pitch Detected -> ${msg.pitch}`;
        });

        // Enable computer keyboard

        document.addEventListener('keydown', keyDown);
        document.addEventListener('keyup', keyUp);

        addEventListener(
          'click',
          () => samplePlayer && enableComputerKeyboard(samplePlayer.nodeId)
        );

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
      document.removeEventListener('keydown', keyDown);
      document.removeEventListener('keyup', keyUp);
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
            const durationSeconds = audiobuffer?.duration;

            await new Promise((resolve) => setTimeout(resolve, 0));

            if (durationSeconds && durationSeconds > 0) {
              sampleDurationSeconds.val = durationSeconds;
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

    createEnvelopes();
    if (buffer instanceof AudioBuffer) drawWaveform(buffer);

    status.val = `All voices loaded. Sample Duration: ${duration.toFixed(3)}`;
  }

  // Recording handlers
  const startRecording = async () => {
    if (!samplePlayer || recordBtnState.val === 'Recording') return;

    try {
      const recorderResult = await createAudioRecorder(samplePlayer.context);
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

  // const enableEnvelope = (envType: EnvelopeType) => {
  //   if (!samplePlayer) return;
  //   samplePlayer.enableEnvelope(envType);
  // };

  // const disableEnvelope = (envType: EnvelopeType) => {
  //   if (!samplePlayer) return;
  //   samplePlayer.disableEnvelope(envType);
  // };

  // const setEnvelopeTimeScale = (envType: EnvelopeType, timeScale: number) => {
  //   if (!samplePlayer) return;
  //   samplePlayer.setEnvelopeTimeScale(envType, timeScale);
  // };

  // const handleSustainIdxChange = (envType: EnvelopeType, index: number) => {
  //   if (!samplePlayer) return;
  //   samplePlayer.setEnvelopeSustainPoint(envType, index);
  // };

  // const handleEnvelopeChange = (
  //   envType: EnvelopeType,
  //   index: number,
  //   time: number,
  //   value: number
  // ) => {
  //   if (!samplePlayer) return;

  //   if (index === -1) {
  //     samplePlayer.addEnvelopePoint(envType, time, value);
  //   } else if (time === -1 && value === -1) {
  //     samplePlayer.deleteEnvelopePoint(envType, index);
  //   } else {
  //     samplePlayer.updateEnvelopePoint(envType, index, time, value);
  //   }
  // };

  // const handleEnvelopeLoopChange = (
  //   envType: EnvelopeType,
  //   enabled: boolean
  // ) => {
  //   if (!samplePlayer) return;
  //   samplePlayer.setEnvelopeLoop(envType, enabled, 'normal');
  // };

  // const handleEnvelopeSyncChange = (envType: EnvelopeType, sync: boolean) => {
  //   if (!samplePlayer) return;
  //   samplePlayer.setEnvelopeSync(envType, sync);
  // };

  const keyboard = document.createElement('webaudio-keyboard') as any;
  keyboard.setAttribute('width', '300');
  keyboard.setAttribute('height', '60');
  keyboard.setAttribute('min', '37'); // C3 = 48
  keyboard.setAttribute('keys', '31'); // 2 octaves + fifth (corresponding to curr computer keyboard range) // todo: use same keymap

  // Add event listener for note events
  keyboard.addEventListener('pointer', (event: any) => {
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

      div(
        {
          class: 'knobs',
          style: () =>
            expanded.val === 'true'
              ? `
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
                  gap: 1rem;
                  padding: 1rem;
                  max-width: 100%;
                  justify-items: center;
                  align-items: start;
                `
              : 'display: none; padding: 0.5rem;',
        },

        createLabeledKnob({
          label: 'Volume',
          defaultValue: 0.5,
          onChange: (value: number) => (volume.val = value),
        }),

        createLabeledKnob({
          label: 'Dry/Wet',
          defaultValue: 0,
          onChange: (value: number) => {
            dryWetMix.val = { dry: 1 - value, wet: value };
          },
        }),

        createLabeledKnob({
          label: 'HPF',
          defaultValue: 50,
          minValue: 30,
          maxValue: 18000,
          curve: 5,
          onChange: (value: number) => (hpfHz.val = value),
        }),

        createLabeledKnob({
          label: 'LPF',
          defaultValue: 18000,
          minValue: 20,
          maxValue: 20000,
          curve: 5,
          onChange: (value: number) => (lpfHz.val = value),
        }),

        createLabeledKnob({
          label: 'Reverb',
          defaultValue: 0.5,
          onChange: (value: number) => (reverbAmount.val = value),
        }),

        createLabeledKnob({
          label: 'Feedback',
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          onChange: (value: number) => (feedbackAmount.val = value),
        }),

        createLabeledKnob({
          label: 'Drive',
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          onChange: (value: number) => (drive.val = value),
        }),

        createLabeledKnob({
          label: 'Clipping',
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          onChange: (value: number) => (clipping.val = value),
        }),

        createLabeledKnob({
          label: 'FB-Pitch',
          defaultValue: 1,
          minValue: 0.25,
          maxValue: 4,
          allowedValues: [0.25, 0.5, 1.0, 2.0, 3.0, 4.0],
          curve: 2,
          onChange: (value: number) => (feedbackPitch.val = value),
        }),

        createLabeledKnob({
          label: 'amp-lfo-rate',
          defaultValue: 0.1,
          onChange: (value: number) => (gainLFORate.val = value),
          curve: 5,
          snapIncrement: 0,
        }),

        createLabeledKnob({
          label: 'amp-lfo-depth',
          defaultValue: 0,
          onChange: (value: number) => (gainLFODepth.val = value),
          curve: 1.5,
        }),

        createLabeledKnob({
          label: 'FB-Decay',
          defaultValue: 1,
          minValue: 0.001,
          maxValue: 1,
          curve: 1,
          onChange: (value: number) => (feedbackDecayTime.val = value),
        }),

        createLabeledKnob({
          label: 'pitch-lfo-rate',
          defaultValue: 0.01,
          onChange: (value: number) => (pitchLFORate.val = value),
          curve: 5,
          snapIncrement: 0,
        }),

        createLabeledKnob({
          defaultValue: 0,
          label: 'pitch-lfo-depth',
          onChange: (value: number) => (pitchLFODepth.val = value),
          curve: 1.5,
        }),

        createLabeledKnob({
          valueFormatter: (v) => v.toFixed(3),
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          label: 'Glide',
          snapIncrement: 0.0001,
          onChange: (value: number) => (glideTime.val = value),
          curve: 2.75,
        }),

        div(
          label({ textContent: 'Feedback Mode' }),
          Toggle({
            on: true,
            size: 1,
            onColor: '#4CAF50',
            onChange: () => (feedbackMode.val = !feedbackMode.oldVal),
          })
        )
      ),

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
                    'display: flex; justify-content: space-between; align-items: center; height: 5vh; column-gap: 0.5rem; margin-left: 0.5rem;',
                },

                // Group lable-buttons on the left
                div(
                  {
                    style: 'display: flex; column-gap: 0.5rem;',
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

                // TimeScale knobs to the right
                div(
                  {
                    style: 'position: relative;', // Stack knobs on top of each other
                  },
                  div(
                    {
                      style: () =>
                        `visibility: ${chosenEnvelope.val === 'amp-env' ? 'visible' : 'hidden'}`,
                    },
                    ampEnvInstance?.timeScaleKnob
                  ),
                  div(
                    {
                      style: () =>
                        `position: absolute; top: 0; visibility: ${chosenEnvelope.val === 'pitch-env' ? 'visible' : 'hidden'}`,
                    },
                    pitchEnvInstance?.timeScaleKnob
                  ),
                  div(
                    {
                      style: () =>
                        `position: absolute; top: 0; visibility: ${chosenEnvelope.val === 'filter-env' ? 'visible' : 'hidden'}`,
                    },
                    filterEnvInstance?.timeScaleKnob
                  )
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
        // dataset: {'data-instrument-id': `${samplePlayer?.nodeId}`},
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
