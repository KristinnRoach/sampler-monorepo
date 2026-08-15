// src/App.tsx
import {
  Component,
  onMount,
  createSignal,
  createEffect,
  createMemo,
  onCleanup,
} from 'solid-js';

import {
  createSamplePlayer,
  keymaps,
  DEFAULT_KEYMAP_KEY,
  samplerParams,
  type KeymapKey,
  type SamplerParamPatch,
  type SamplePlayer,
} from '@kidlib/web-audio';
import ParamKnob from './components/knobs/ParamKnob';
import SampleWaveformFilled from './assets/svg/SampleWaveformFilled.svg';

import './styles/midi-learn.css';

import { addExpandCollapseListeners } from './utils/expandCollapse';
import { showNotification, cleanupNotifications } from './utils/notifications';
import { getLayoutFromWidth, type LayoutType } from './utils/layout';
import {
  enableSamplePlayerMidi,
  disableSamplePlayerMidi,
  setSamplePlayerMidiInputChannel,
  type MidiInputChannel,
} from './io/MidiMan';
import { getMidiSupportInfo } from '@kidlib/web-audio/io';
import {
  loadCurrentSample,
  saveCurrentSample,
  loadDefaultSample,
} from './utils/audio/currentSampleStorage';
import {
  recorderInputDeviceId,
  recorderInputSource,
  setRecorderInputDeviceId,
} from './utils/recorderSettings';
import {
  samplerParamValues,
  restoreSamplerParamValues,
  setSamplerParamValue,
  snapshotSamplerParamValues,
} from './utils/samplerParamState';
import type { SavedSample } from './db/samplelib/sampleIdb';

import { ThemeToggle } from './components/ThemeSwitcher';
import SaveButton from './components/SaveButton';
import Sidebar from './components/Sidebar';
import Accordion from './components/Accordion';
import SampleListSection from './components/SampleListSection';
import BaseButton from './components/Button';
import RowCollapseIcons from './components/RowCollapseIcons';
import OutputDeviceSelect from './components/OutputDeviceSelect';
import InputDeviceSelect from './components/InputDeviceSelect';
import SamplerToggle from './components/SamplerToggle';
import KeymapSelect from './components/KeymapSelect';
import PianoKeyboard from './components/PianoKeyboard';
import RootNoteSelect, {
  type RootNote,
} from './components/RootNoteSelect';
import SamplerStatus from './components/SamplerStatus';
import { useComputerKeyboard } from './hooks/useComputerKeyboard';

export const [samplePlayer, setSamplePlayer] =
  createSignal<SamplePlayer | null>(null);

// Untracked read for non-reactive consumers (web components, MidiMan, etc.)
export const getSamplePlayer = () => samplePlayer();

const MIDI_INPUT_CHANNEL_STORAGE_KEY = 'midi-input-channel';

const loadMidiInputChannel = (): MidiInputChannel => {
  try {
    const value = localStorage.getItem(MIDI_INPUT_CHANNEL_STORAGE_KEY);
    const channel = Number(value);
    return Number.isInteger(channel) && channel >= 1 && channel <= 16
      ? channel
      : 'all';
  } catch {
    return 'all';
  }
};

const App: Component = () => {
  const [layout, setLayout] = createSignal<LayoutType>('desktop');
  const [envHeight, setEnvHeight] = createSignal<number>(225);

  const [currentAudioBuffer, setCurrentAudioBuffer] =
    createSignal<AudioBuffer | null>(null);
  const [activeSavedSample, setActiveSavedSample] = createSignal<{
    id: number;
    name: string;
  } | null>(null);
  const [audioInitialized, setAudioInitialized] = createSignal(false);
  const [sampleLoaded, setSampleLoaded] = createSignal(false);
  const [samplerError, setSamplerError] = createSignal<string | null>(null);
  const [toolbarOpen, setToolbarOpen] = createSignal(false);
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [sidebarSection, setSidebarSection] = createSignal<'menu' | 'samples'>(
    'samples',
  );
  const [midiInputChannel, setMidiInputChannel] =
    createSignal<MidiInputChannel>(loadMidiInputChannel());
  const [keymapKey, setKeymapKey] = createSignal<KeymapKey>(DEFAULT_KEYMAP_KEY);
  const [keyboardOctaveOffset, setKeyboardOctaveOffset] = createSignal(0);
  const [rootNote, setRootNote] = createSignal<RootNote>('C');

  const keymap = createMemo(() => keymaps[keymapKey()]);

  const pressedKeyboardNotes = useComputerKeyboard({
    player: samplePlayer,
    keymap,
    octaveOffset: keyboardOctaveOffset,
    setOctaveOffset: setKeyboardOctaveOffset,
  });

  createEffect(() => {
    samplePlayer()?.setRootNote(rootNote());
  });

  const inputDeviceSelectDisabled = createMemo(
    () => recorderInputSource() !== 'audio-input',
  );

  const applyParamPatch = (
    player: SamplePlayer,
    patch: SamplerParamPatch,
  ) => {
    player.applyParams(patch);
    restoreSamplerParamValues(patch);
  };

  const handleSampleSelect = async (savedSample: SavedSample) => {
    const player = getSamplePlayer();
    if (!player) return;

    try {
      await player.loadSample(savedSample.audioData, undefined, {
        skipPreProcessing: true,
      });

      if (savedSample.patch?.params) {
        applyParamPatch(player, savedSample.patch.params);
      }

      if (savedSample.id !== undefined) {
        setActiveSavedSample({ id: savedSample.id, name: savedSample.name });
      }
      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load sample:', error);
    }
  };

  onMount(() => {
    let disposed = false;
    let player: SamplePlayer | undefined;
    let unsubscribeSampleLoaded: (() => void) | undefined;
    const reloadDraft = snapshotSamplerParamValues();

    const handleSampleLoaded = (samplePlayer: SamplePlayer) => {
      const audiobuffer = samplePlayer.audiobuffer;
      if (!audiobuffer?.length) {
        console.error('sample:loaded fired without usable audiobuffer');
        return;
      }

      setCurrentAudioBuffer(audiobuffer);
      setSampleLoaded(true);
      setActiveSavedSample(null);
      void saveCurrentSample(audiobuffer);

      // SamplePlayer resets its loop/trim points to the full buffer on load,
      // so reset the normalized controls to match instead of keeping the
      // previous sample's fractions.
      (['trimStart', 'trimEnd', 'loopStart', 'loopEnd'] as const).forEach(
        (key) => setSamplerParamValue(key, samplerParams[key].defaultValue),
      );

      // Compatibility signal for the remaining vanilla controls.
      document.dispatchEvent(
        new CustomEvent('sample-loaded', {
          detail: {
            buffer: audiobuffer,
            durationSeconds: audiobuffer.duration,
          },
        }),
      );
    };

    void (async () => {
      try {
        const prevSample = await loadCurrentSample();
        const sample = prevSample ?? (await loadDefaultSample());
        if (!sample.byteLength)
          console.warn('Failed to fetch app default sample');

        const createdPlayer = await createSamplePlayer(sample, 16);
        if (disposed) {
          createdPlayer.dispose();
          return;
        }

        player = createdPlayer;
        setSamplePlayer(createdPlayer);
        setAudioInitialized(true);
        setSamplerError(null);
        unsubscribeSampleLoaded = createdPlayer.onMessage('sample:loaded', () =>
          handleSampleLoaded(createdPlayer),
        );

        // Compatibility signal for the remaining vanilla controls.
        document.dispatchEvent(new CustomEvent('sampler-initialized'));

        // createSamplePlayer resolves after its initial sample has loaded.
        handleSampleLoaded(createdPlayer);
        applyParamPatch(createdPlayer, reloadDraft);
      } catch (error: any) {
        const errText =
          typeof error?.message === 'string' ? error.message : String(error);
        console.error('Sampler initialization error:', error);
        setSamplerError(
          errText.includes('AudioWorklet')
            ? 'AudioWorklet not supported'
            : errText,
        );
      }
    })();

    const updateLayout = () => {
      const layoutType = getLayoutFromWidth(window.innerWidth);
      if (layoutType === 'mobile') {
        setEnvHeight(100);
      } else {
        setEnvHeight(225);
      }

      setLayout(layoutType);
    };

    updateLayout();
    addExpandCollapseListeners();
    window.addEventListener('resize', updateLayout);

    enableSamplePlayerMidi({
      getSamplePlayer,
      inputChannel: midiInputChannel(),
      midiLearnEnabled: true,
      knobMappings: [
        { cc: 15, selector: '[data-param="highpassFilter"]', name: 'HPF' },
        { cc: 73, selector: '[data-param="lowpassFilter"]', name: 'LPF' },
      ],
    }).then((success) => {
      if (success) {
        showNotification(
          'MIDI enabled - Press Cmd+Shift+M to access MIDI Learn',
        );
      } else {
        const { supported, message } = getMidiSupportInfo();

        if (!supported) {
          showNotification(`MIDI not available - ${message}`, 5000);
        } else {
          showNotification(
            'MIDI initialization failed - Check if MIDI devices are connected',
            4000,
          );
        }
        console.warn('MIDI initialization failed');
      }
    });

    const handleMidiLearn = ((e: CustomEvent<{ message: string }>) => {
      if (e.detail?.message) {
        showNotification(e.detail.message);
      }
    }) as EventListener;

    // Listen for MIDI-related custom events
    document.addEventListener('midi:learn', handleMidiLearn);

    onCleanup(() => {
      disposed = true;
      window.removeEventListener('resize', updateLayout);
      document.removeEventListener('midi:learn', handleMidiLearn);

      cleanupNotifications();
      disableSamplePlayerMidi();

      unsubscribeSampleLoaded?.();
      if (player) {
        player.dispose();
        setSamplePlayer(null);
      }
    });
  });

  createEffect(() => {
    const values = samplerParamValues();

    if (values.trimStart > values.loopStart) {
      setSamplerParamValue('loopStart', values.trimStart);
    }

    if (values.trimEnd < values.loopEnd) {
      setSamplerParamValue('loopEnd', values.trimEnd);
    }
  });

  return (
    <>
      <div class='content-wrapper'>
        <div
          class={`toolbar-wrapper ${toolbarOpen() ? '__toolbar-open' : ''} ${sidebarOpen() ? '__sidebar-open' : ''}`}
        >
          <BaseButton
            title='Toggle Toolbar'
            onclick={() => setToolbarOpen(!toolbarOpen())}
            conditionalClass={[
              { condition: sidebarOpen(), className: '__toolbar-open' },
            ]}
            class='toolbar-toggle'
          >
            <svg
              width='20'
              height='20'
              stroke='10'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path d='M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z' />
            </svg>
          </BaseButton>

          <div
            class={`expandable-width ${toolbarOpen() ? '__toolbar-open' : ''}`}
          >
            <BaseButton
              title='View saved samples'
              onclick={() => {
                setSidebarSection('samples');
                setSidebarOpen(true);
              }}
              conditionalClass={[
                { condition: sidebarOpen(), className: '__toolbar-open' },
              ]}
              class='toolbar-btn samplelib-button'
            >
              <SampleWaveformFilled
                fill={'white'}
                stroke={'white'}
                stroke-width={6}
                width={30}
                height={30}
              />
            </BaseButton>

            <SaveButton
              audioBuffer={currentAudioBuffer()}
              savedSample={activeSavedSample()}
              disabled={!sampleLoaded()}
              isOpen={sidebarOpen()}
              class={`toolbar-btn ${toolbarOpen() ? '__toolbar-open' : ''}`}
              onSavedCallback={setActiveSavedSample}
            />

            <ThemeToggle
              class={`toolbar-btn ${toolbarOpen() ? '__toolbar-open' : ''}`}
              defaultTheme='light'
            />

            <InputDeviceSelect
              class={`toolbar-btn input-device-select ${toolbarOpen() ? '__toolbar-open' : ''}`}
              disabled={inputDeviceSelectDisabled()}
              value={recorderInputDeviceId()}
              onChange={setRecorderInputDeviceId}
            />

            <OutputDeviceSelect
              class={`toolbar-btn output-device-select ${toolbarOpen() ? '__toolbar-open' : ''}`}
            />

            <div
              class={`toolbar-btn input-device-select ${toolbarOpen() ? '__toolbar-open' : ''}`}
            >
              <select
                aria-label='MIDI note channel'
                title='MIDI note channel'
                class='icon-select'
                value={midiInputChannel()}
                onchange={(event) => {
                  const channel =
                    event.currentTarget.value === 'all'
                      ? 'all'
                      : Number(event.currentTarget.value);
                  setMidiInputChannel(channel);
                  setSamplePlayerMidiInputChannel(channel);
                  try {
                    localStorage.setItem(
                      MIDI_INPUT_CHANNEL_STORAGE_KEY,
                      String(channel),
                    );
                  } catch {
                    // Persistence is optional; routing still updates.
                  }
                }}
              >
                <option value='all'>Notes: All channels</option>
                {Array.from({ length: 16 }, (_, index) => (
                  <option value={index + 1}>Notes: Channel {index + 1}</option>
                ))}
              </select>
              <div class='icon-select-icon'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  aria-hidden='true'
                  viewBox='0 5 24 14'
                  width='20'
                  height='20'
                  fill='currentColor'
                  stroke='none'
                  stroke-width='1'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                >
                  <path d='M 21.775 5 L 24 5 L 24 18.998 L 21.775 18.998 L 21.775 5 Z M 13.213 5 L 19.719 5 C 20.379 5 20.764 5.891 20.764 6.948 L 20.764 17.262 C 20.764 18.575 20.414 18.998 19.652 18.998 L 13.213 18.998 L 13.213 10.106 L 15.438 10.106 L 15.438 15.577 L 18.573 15.577 L 18.573 8.159 L 13.213 8.159 L 13.213 5 Z M 9.978 5 L 12.168 5 L 12.168 18.998 L 9.978 18.998 L 9.978 5 Z M 0 5 L 7.854 5 C 8.514 5 8.899 5.891 8.899 6.948 L 8.899 19 L 6.708 19 L 6.708 8.524 L 5.427 8.524 L 5.427 18.997 L 3.438 18.997 L 3.438 8.525 L 2.191 8.525 L 2.191 18.998 L 0 18.998 L 0 5 Z' />
                </svg>
              </div>
            </div>

            {/* <tempo-knob
          label=' '
          class={`left-side-button ${sidebarOpen() ? 'open' : ''} `}
        /> */}
          </div>
        </div>

        <Sidebar
          isOpen={sidebarOpen()}
          onClose={() => setSidebarOpen(false)}
          title='Sample Library'
        >
          <Accordion
            sections={[
              {
                id: 'samples',
                title: '',
                content: (
                  <SampleListSection onSampleSelect={handleSampleSelect} />
                ),
              },
            ]}
            openSectionId={sidebarSection()}
            onSectionChange={setSidebarSection}
          />
        </Sidebar>

        <div class={`control-grid layout-${layout()}`} id='sampler-container'>
          <fieldset class='control-group env-group'>
            <legend class='expandable-legend'>Envelopes</legend>
            <div class='expandable-content'>
              <div class='flex-col'>
                <envelope-switcher
                  height={envHeight()}
                  bg-color='var(--envelope-bg)'
                />
              </div>
            </div>
          </fieldset>

          <fieldset id='sample-group' class='control-group sample-group'>
            <legend class='expandable-legend'>Sample</legend>
            <div class='expandable-content'>
              <ParamKnob param='volume' player={samplePlayer()} />
              <div class='flex-col'>
                <record-button
                  show-status='false'
                />
                <div class='input-source-selection-container'>
                  <input-select
                    class='input-source-select'
                  />
                  <InputDeviceSelect
                    class='input-device-select'
                    disabled={inputDeviceSelectDisabled()}
                    value={recorderInputDeviceId()}
                    onChange={setRecorderInputDeviceId}
                  />
                </div>
              </div>
              <div class='flex-col'>
                <load-button
                  show-status='false'
                />

                <button
                  class='reset-button'
                  title='Reset knobs'
                  disabled={!sampleLoaded()}
                  onclick={() => {
                    const knobElements =
                      document.querySelectorAll('knob-element');
                    knobElements.forEach((knob) => {
                      (knob as any).resetToDefault();
                    });
                  }}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 256 256'
                    fill='none'
                  >
                    <path d='M139.141 232.184c78.736 0 127.946-85.236 88.579-153.424-39.369-68.187-137.789-68.187-177.158 0A102.125 102.125 0 0 0 43.71 93.1m62.258-5.371c-14.966 5.594-35.547 10.026-48.737 19.272-2.137 1.497-26.015 16.195-26.049 13.991C27.503 98.21 13.21 75.873 13.21 52.583' />
                  </svg>
                </button>
              </div>
            </div>
          </fieldset>

          <fieldset id='space-group' class='control-group space-group'>
            <legend class='expandable-legend'>Space</legend>
            <div class='expandable-content'>
              <ParamKnob param='dryWet' player={samplePlayer()} />
              <ParamKnob
                param='reverbSend'
                label='RevSend'
                player={samplePlayer()}
              />
              <ParamKnob
                param='reverbSize'
                label='RevSize'
                player={samplePlayer()}
              />
              <ParamKnob
                param='delaySend'
                label='Delay'
                player={samplePlayer()}
              />
              <ParamKnob
                param='delayTime'
                label='Time'
                player={samplePlayer()}
              />
              <ParamKnob
                param='delayFeedback'
                label='FB'
                player={samplePlayer()}
              />
            </div>
          </fieldset>

          <fieldset class='control-group filter-group'>
            <legend class='expandable-legend'>Filters</legend>
            <div class='expandable-content'>
              <ParamKnob param='highpassFilter' player={samplePlayer()} />
              <ParamKnob param='lowpassFilter' player={samplePlayer()} />
            </div>
          </fieldset>

          <fieldset class='control-group misc-group'>
            <legend class='expandable-legend'>Dirt</legend>
            <div class='expandable-content'>
              <ParamKnob param='distortion' player={samplePlayer()} />
              <div
                class='am-modulation-composite'
                style='display: inline-flex; flex-direction: column; align-items: center; gap: 2px;'
              >
                <ParamKnob param='amMod' label='AM' player={samplePlayer()} />
                <waveform-select
                  show-label='false'
                />
              </div>
            </div>
          </fieldset>

          <fieldset class='control-group loop-group'>
            <legend class='expandable-legend'>Loop</legend>
            <div class='expandable-content'>
              <ParamKnob
                param='loopStart'
                label='Start'
                player={samplePlayer()}
                minAllowed={() => samplerParamValues().trimStart}
                maxAllowed={() => samplerParamValues().loopEnd} // - getLoopPointGap()}
              />
              <ParamKnob
                param='loopEnd'
                label='End'
                player={samplePlayer()}
                minAllowed={() => samplerParamValues().loopStart} // + getLoopPointGap()}
                maxAllowed={() => samplerParamValues().trimEnd}
              />
              <ParamKnob
                param='keytrackLoop'
                label='KeyTrack'
                player={samplePlayer()}
              />
              <div class='flex-col'>
                <ParamKnob
                  param='loopDurationDrift'
                  label='Drift'
                  player={samplePlayer()}
                />
                <SamplerToggle param='panDrift' player={samplePlayer()} />
              </div>
            </div>
          </fieldset>

          <fieldset class='control-group trim-group'>
            <legend class='expandable-legend'>Trim</legend>
            <div class='expandable-content'>
              <ParamKnob param='trimStart' player={samplePlayer()} maxAllowed={() => samplerParamValues().trimEnd}/>
              <ParamKnob param='trimEnd' player={samplePlayer()} minAllowed={() => samplerParamValues().trimStart}/>
              <button
                class='crop-button'
                onClick={async () => {
                  const player = samplePlayer();
                  if (!player) return;

                  try {
                    const savedSample = activeSavedSample();
                    const croppedBuffer = await player.cropSample();
                    if (!croppedBuffer) return;

                    setActiveSavedSample(savedSample);
                    // Trim points are normalized: the crop is the new full range.
                    setSamplerParamValue('trimStart', 0);
                    setSamplerParamValue('trimEnd', 1);
                  } catch (error) {
                    console.error('Failed to crop sample:', error);
                    showNotification('Failed to crop sample');
                  }
                }}
              >
                Crop
              </button>
            </div>
          </fieldset>

          <fieldset class='control-group feedback-group'>
            <legend class='expandable-legend'>Feedback</legend>
            <div class='expandable-content'>
              <ParamKnob
                param='feedback'
                label='Amount'
                player={samplePlayer()}
              />
              <ParamKnob
                param='feedbackPitch'
                label='Pitch'
                player={samplePlayer()}
              />
              <ParamKnob
                param='feedbackLpf'
                label='Lowpass'
                player={samplePlayer()}
              />

              <ParamKnob
                param='feedbackDecay'
                label='Decay'
                player={samplePlayer()}
              />

              <SamplerToggle param='feedbackMode' player={samplePlayer()} />
            </div>
          </fieldset>

          {/* Todo: add .control-group to lfo-container? Clarify */}
          <div class='lfo-container'>
            <fieldset class='control-group amp-lfo-group'>
              <legend class='expandable-legend'>Amp LFO</legend>
              <div class='expandable-content'>
                <div class='flex-col'>
                  <ParamKnob
                    param='gainLFORate'
                    label='Rate'
                    player={samplePlayer()}
                  />
                  <SamplerToggle param='gainLFOSync' player={samplePlayer()} />
                </div>
                <ParamKnob
                  param='gainLFODepth'
                  label='Depth'
                  player={samplePlayer()}
                />
              </div>
            </fieldset>

            <fieldset class='control-group pitch-lfo-group'>
              <legend class='expandable-legend'>Pitch LFO</legend>
              <div class='expandable-content'>
                <div class='flex-col'>
                  <ParamKnob
                    param='pitchLFORate'
                    label='Rate'
                    player={samplePlayer()}
                  />
                  <SamplerToggle param='pitchLFOSync' player={samplePlayer()} />
                </div>
                <ParamKnob
                  param='pitchLFODepth'
                  label='Depth'
                  player={samplePlayer()}
                />
              </div>
            </fieldset>
          </div>

          <fieldset class='control-group toggle-group'>
            <legend class='expandable-legend'>Toggles</legend>
            <div class='expandable-content'>
              <SamplerToggle
                param='timestretch'
                player={samplePlayer()}
                class='sampler-toggle-container'
              />
              {/* <midi-toggle /> */}
              <playback-direction-toggle />
              <loop-lock-toggle />
              <hold-lock-toggle />
              <pitch-toggle />
              <SamplerStatus
                audioInitialized={audioInitialized()}
                sampleLoaded={sampleLoaded()}
                error={samplerError()}
              />
            </div>
          </fieldset>

          <fieldset class='control-group keyboard-group'>
            <legend class='expandable-legend'>Keyboard</legend>
            <div class='expandable-content'>
              <PianoKeyboard
                player={samplePlayer()}
                keymap={keymap()}
                octaveOffset={keyboardOctaveOffset()}
                rootNote={rootNote()}
                pressedNotes={pressedKeyboardNotes()}
                height={80}
              />
              <div class='keyboard-controls'>
                <div class='flex-row'>
                  <RootNoteSelect
                    value={rootNote()}
                    onChange={setRootNote}
                  />
                  <KeymapSelect
                    value={keymapKey()}
                    onChange={setKeymapKey}
                  />
                </div>

                <ParamKnob param='glide' player={samplePlayer()} />
              </div>
            </div>
          </fieldset>

          <RowCollapseIcons />
        </div>
      </div>
    </>
  );
};

export default App;

// ! Only for testing. Remove when freeze implemented.
// document.body.addEventListener('keydown', (e) => {
//   if (e.repeat) return;

//   if (e.code === 'IntlBackslash') {
//     e.preventDefault();
//     console.log('Freezing active voices');
//     getSamplePlayer()?.freezeActiveVoices(true);
//   }
// });
// document.body.addEventListener('keyup', (e) => {
//   if (e.code === 'IntlBackslash') {
//     e.preventDefault();
//     console.log('Unfreezing active voices');
//     getSamplePlayer()?.freezeActiveVoices(false);
//   }
// });
// ! END - TEST Listener
