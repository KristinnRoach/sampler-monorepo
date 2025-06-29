import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';

import {
  type SamplePlayer,
  type CustomEnvelope,
  type EnvelopeType,
  type Recorder,
  getInstance,
} from '@repo/audiolib';

import { createIcons } from '../../utils/svg-utils';
import { SampleControls } from '../controls/SampleControls';
import { ExpandableHeader } from '../primitives/ExpandableHeader';
import { FileOperations } from '../controls/FileOperations';
import {
  VolumeControl,
  InputControls,
  LoopHoldControls,
} from '../controls/AudioControls';

import { EnvelopeSVG } from '../controls/EnvelopeSVG';

const { div, button } = van.tags;

const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer | null = null;
  let currentRecorder: Recorder | null = null;
  // Attributes
  const expanded = attributes.attr('expanded', 'true');

  // Audio params
  const volume = van.state(0.5);
  const ampEnvelope = van.state<CustomEnvelope | null>(null);
  const pitchEnvelope = van.state<CustomEnvelope | null>(null);
  const loopEnvelope = van.state<CustomEnvelope | null>(null);

  // Pitch params
  // const transposition = van.state(0);

  // Loop params
  const loopStart = van.state(0);
  const loopEnd = van.state(1);
  const loopEndFineTune = van.state(0);

  // Trim sample params
  const startPoint = van.state(0);
  const endPoint = van.state(1);

  // Sample Duration
  const sampleDuration = van.state(1);

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

  let ampEnvInstance: {
    element: SVGSVGElement;
    triggerPlayAnimation: (msg: any) => void;
    releaseAnimation: (msg: any) => void;
  } | null = null;

  let pitchEnvInstance: {
    element: SVGSVGElement;
    triggerPlayAnimation: (msg: any) => void;
    releaseAnimation: (msg: any) => void;
  } | null = null;

  // Create the envelopes and store references
  van.derive(() => {
    if (chosenEnvelope.val === 'amp-env' && ampEnvelope.val) {
      ampEnvInstance = EnvelopeSVG(
        'amp-env',
        ampEnvelope.val.getEnvelopeDataInstance(),
        handleEnvelopeChange,
        '100%',
        '100px',
        { x: [0, 1], y: [0, 1] }
      );
    }

    if (chosenEnvelope.val === 'pitch-env' && pitchEnvelope.val) {
      pitchEnvInstance = EnvelopeSVG(
        'pitch-env',
        pitchEnvelope.val.getEnvelopeDataInstance(),
        handleEnvelopeChange,
        '100%',
        '100px',
        { x: [0, 1], y: [0.5] }, // snap to center
        0.05 // higher snap threshold
      );
    }
  });

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

        if (!samplePlayer.initialized) {
          console.warn('Failed to create sample player');
          status.val = 'Failed to initialize';
          return;
        }

        // Setup envelopes
        ampEnvelope.val = samplePlayer.getEnvelope('amp-env');
        pitchEnvelope.val = samplePlayer.getEnvelope('pitch-env');
        // loopEnvelope.val = samplePlayer.getEnvelope('loop-env');

        van.derive(() => {
          if (!samplePlayer) return;

          // Only call setLoopPoint if values actually differ from stored values
          // ( todo: simplify and handle in audiolib )

          if (loopStart.val !== samplePlayer.loopStart) {
            samplePlayer.setLoopPoint('start', loopStart.val, loopEnd.val);
          }

          if (loopEnd.val !== samplePlayer.loopStart) {
            samplePlayer.setLoopPoint('end', loopStart.val, loopEnd.val);
          }
        });

        derive(() => {
          // if (samplePlayer?.isLoaded) {
          samplePlayer?.setSampleStartPoint(startPoint.val);
        });

        derive(() => {
          // if (samplePlayer?.isLoaded) {
          samplePlayer?.setSampleEndPoint(endPoint.val);
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

        samplePlayer.onMessage('envelopes:trigger', (msg: any) => {
          ampEnvInstance?.triggerPlayAnimation(msg);
          pitchEnvInstance?.triggerPlayAnimation(msg);
        });

        samplePlayer.onMessage('voice:releasing', (msg: any) => {
          ampEnvInstance?.releaseAnimation(msg);
          pitchEnvInstance?.releaseAnimation(msg);
        });

        samplePlayer.onMessage('voice:stopped', (msg: any) => {
          ampEnvInstance?.releaseAnimation(msg);
          pitchEnvInstance?.releaseAnimation(msg);
        });

        samplePlayer.onMessage('sample:pitch-detected', (msg: any) => {
          status.val = `Sample Pitch Detected -> ${msg.pitch}`;
        });

        samplePlayer.onMessage(
          'sample:loaded',
          (msg: any) => (sampleDuration.val = msg.duration ?? 0)
        );

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
            if (!samplePlayer) return;

            const arrayBuffer = await file.arrayBuffer();

            if (!arrayBuffer) {
              console.warn(`Failed to retrieve uploaded arrayBuffer`);
              return;
            }

            const durationSeconds = await samplePlayer.loadSample(arrayBuffer);
            console.log(durationSeconds);

            await new Promise((resolve) => setTimeout(resolve, 0));

            console.log(durationSeconds);

            if (durationSeconds > 0) {
              // Update sample duration and reset ranges
              sampleDuration.val = durationSeconds;

              loopStart.val = 0;
              loopEnd.val = 1; // Normalized
              startPoint.val = 0;
              endPoint.val = 1; // Normalized

              status.val = `Loaded: ${file.name}`;
              status.val = `Received duration from loadSample: ${durationSeconds}`;
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

  const handleEnvelopeChange = (
    envType: EnvelopeType,
    index: number,
    time: number,
    value: number
  ) => {
    if (!samplePlayer) return;
    // console.table({ envType, index, time, value });

    if (index === -1) {
      samplePlayer.addEnvelopePoint(envType, time, value);
    } else if (time === -1 && value === -1) {
      samplePlayer.deleteEnvelopePoint(envType, index);
    } else {
      samplePlayer.updateEnvelopePoint(envType, index, time, value);
    }
  };

  const defaultStyle = `display: flex; flex-direction: column; max-width: 50vw; padding: 0.5rem;`;

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
        style: () => (expanded.val === 'true' ? '' : 'display: none'),
      },

      VolumeControl(volume),

      () =>
        ampEnvelope.val && pitchEnvelope.val
          ? div(
              { style: 'margin: 10px 0;' },
              div(
                { style: 'display: flex; column-gap: 1rem;' },

                button(
                  {
                    style: () =>
                      'cursor: pointer; font-size: 0.9rem; margin-bottom: 5px;',
                    onclick: () => (chosenEnvelope.val = 'amp-env'),
                  },
                  'Amp Env'
                ),
                button(
                  {
                    style: () =>
                      'cursor: pointer; font-size: 0.9rem; margin-bottom: 5px;',
                    onclick: () => (chosenEnvelope.val = 'pitch-env'),
                  },
                  'Pitch Env'
                )
              ),

              () =>
                chosenEnvelope.val === 'amp-env' && ampEnvInstance
                  ? ampEnvInstance.element
                  : div(),

              () =>
                chosenEnvelope.val === 'pitch-env' && pitchEnvInstance
                  ? pitchEnvInstance.element
                  : div()
            )
          : div(),

      SampleControls(loopStart, loopEnd, startPoint, endPoint),

      div(
        { style: 'display: flex; gap: 10px; flex-wrap: wrap;' },
        InputControls(keyboardEnabled, midiEnabled, icons.keys, icons.midi),
        LoopHoldControls(loopEnabled, loopLocked, holdLocked, icons)
      ),
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
