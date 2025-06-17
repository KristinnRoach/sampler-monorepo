import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import { SamplePlayer, getInstance } from '@repo/audiolib';
import { createIcons } from '../../utils/svg-utils';
import { SampleControls } from '../controls/SampleControls';
import { ExpandableHeader } from '../primitives/ExpandableHeader';
import { FileOperations } from '../controls/FileOperations';
import {
  VolumeControl,
  InputControls,
  LoopHoldControls,
} from '../controls/AudioControls';

import { createAudioEnvelopeController } from '../controls/CustomEnvElement';
import { EnvelopeSVG } from '../controls/EnvelopeSVG';

const { div } = van.tags;

const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer;

  // Attributes
  const expanded = attributes.attr('expanded', 'true');

  // Audio params
  const volume = van.state(0.5);
  const ampEnvController = createAudioEnvelopeController();
  const pitchEnvController = createAudioEnvelopeController();
  // const loopEndEnvController = createAudioEnvelopeController();

  const attack = van.state(0.001);
  const release = van.state(0.3);

  // Pitch params
  const transposition = van.state(0);

  // Loop params
  const loopStart = van.state(0);
  const loopEnd = van.state(0.99);
  const loopEndFineTune = van.state(0);

  // Trim sample params
  const startOffset = van.state(0);
  const endOffset = van.state(1);

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

        const polyphony = parseInt(attributes.attr('polyphony', '16').val);
        // Todo: remove dep on audiolib class, add destination master handling
        samplePlayer = audiolib.createSamplePlayer(undefined, polyphony);

        // connects automatically to audio destination

        if (!samplePlayer) {
          console.warn('Failed to create sample player');
          status.val = 'Failed to initialize';
          return;
        }

        samplePlayer.setEnvelopeController(ampEnvController, 'envGain');
        samplePlayer.setEnvelopeController(pitchEnvController, 'playbackRate');
        // samplePlayer.setEnvelopeController(loopEndEnvController, 'loopEnd');

        derive(() => samplePlayer.setAttackTime(attack.val));
        derive(() => samplePlayer.setReleaseTime(release.val));
        derive(() => samplePlayer.setLoopStart(loopStart.val));
        derive(() => samplePlayer.setLoopEnd(loopEnd.val));

        derive(() =>
          samplePlayer.setFineTuneLoopEnd(-loopEndFineTune.val / 10000)
        ); // Convert 0-100 to 0 to -0.1 seconds

        derive(() => samplePlayer.setSampleStartOffset(startOffset.val));
        derive(() => samplePlayer.setSampleEndOffset(endOffset.val));
        derive(() => (samplePlayer.volume = volume.val));

        // derive(() => (samplePlayer.setTrans = transposition.val));

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
        });
        derive(() => {
          samplePlayer.setLoopLocked(loopLocked.val);
        });

        // Listen for SamplePlayer events:

        samplePlayer.onMessage('sample:pitch-detected', (msg: any) => {
          status.val = `Sample Pitch Detected -> ${msg.pitch}`;
        });

        // todo (later): Make KeyboardInputManager in audiolib handle caps robustly and sampleplayer.sendUpStreamMessage
        // then remove these handlers if works
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
        // todo (later): add listeners for other messages and type them & dispatch events
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

      // ! onMessage('record:armed' is not working, temp fix:
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
      recordBtnState.val = 'Record';
      status.val = 'Recording stopped';
    } catch (error) {
      console.error('Failed to stop recording:', error);
      status.val = `Stop error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  const defaultStyle = `display: flex; flex-direction: column; max-width: 50vw; padding: 0.5rem;`;

  return div(
    { class: 'sampler-element', style: () => defaultStyle },

    ExpandableHeader(
      'Sampler',
      expanded,

      FileOperations(
        samplePlayer!, // todo: ensure samplePlayer is ready
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

      div(
        { style: 'margin: 10px 0;' },
        div({ style: 'font-size: 0.9rem; margin-bottom: 5px;' }, 'AmpEnv'),
        EnvelopeSVG(ampEnvController, '100%', '100px')
      ),

      div(
        { style: 'margin: 10px 0;' },
        div({ style: 'font-size: 0.9rem; margin-bottom: 5px;' }, 'PitchEnv'),
        EnvelopeSVG(pitchEnvController, '100%', '100px')
      ),

      // div(
      //   { style: 'margin: 10px 0;' },
      //   div({ style: 'font-size: 0.9rem; margin-bottom: 5px;' }, 'LoopEnv'),
      //   EnvelopeSVG(loopEndEnvController, '100%', '100px')
      // ),

      SampleControls(
        loopStart,
        loopEnd,
        loopEndFineTune,
        startOffset,
        endOffset,
        sampleDuration
      ),
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
