// src/App.tsx
import {
  Component,
  onMount,
  createSignal,
  createMemo,
  onCleanup,
} from 'solid-js';

import type { SamplePlayer } from '@repo/audiolib';
import { createSampler, type Sampler } from './utils/createSampler';
// import { KnobComponent, type KnobChangeEventDetail, Oscilloscope } from '@repo/audio-components/solidjs';

import SampleWaveformFilled from './assets/svg/SampleWaveformFilled.svg';

import './styles/midi-learn.css';

import { addExpandCollapseListeners } from './utils/expandCollapse';
import { addPreventScrollOnSpacebarListener } from './utils/preventScrollOnSpacebar';
import { showNotification, cleanupNotifications } from './utils/notifications';
import { getLayoutFromWidth, type LayoutType } from './utils/layout';
import { useSampleSelection } from './hooks/useSampleSelection';
import { enableSamplePlayerMidi, disableSamplePlayerMidi } from './io/MidiMan';
import { getMidiSupportInfo } from '@repo/input-controller';

import { ThemeToggle } from './components/ThemeSwitcher';
import SaveButton from './components/SaveButton';
import Sidebar from './components/Sidebar';
import Accordion from './components/Accordion';
import SampleListSection from './components/SampleListSection';
import BaseButton from './components/Button';
import RowCollapseIcons from './components/RowCollapseIcons';
import OutputDeviceSelect from './components/OutputDeviceSelect';
import InputDeviceSelect from './components/InputDeviceSelect';

const App: Component = () => {
  const [layout, setLayout] = createSignal<LayoutType>('desktop');
  const [envHeight, setEnvHeight] = createSignal<number>(225);

  let samplerRef: Sampler | undefined;
  let samplePlayerRef: SamplePlayer | null = null;

  const [currentAudioBuffer, setCurrentAudioBuffer] =
    createSignal<AudioBuffer | null>(null);
  const [sampleLoaded, setSampleLoaded] = createSignal(false);
  const [toolbarOpen, setToolbarOpen] = createSignal(false);
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [sidebarSection, setSidebarSection] = createSignal<'menu' | 'samples'>(
    'samples',
  );

  let inputSourceSelectRef: HTMLElement | undefined;
  const [inputSource, setInputSource] = createSignal('audio-input');
  const inputDeviceSelectDisabled = createMemo(
    () => inputSource() !== 'audio-input',
  );

  const [selectedInputDeviceId, setSelectedInputDeviceId] = createSignal('');
  const handleInputDeviceChange = (deviceId: string) => {
    getSamplePlayer()?.setRecorderInputDeviceId(deviceId);
    setSelectedInputDeviceId(deviceId);
  };

  const { handleSampleSelect } = useSampleSelection(
    () => samplePlayerRef,
    setSidebarOpen,
  );

  const getSamplePlayer = () => samplePlayerRef;

  onMount(() => {
    createSampler({ nodeId: 'test-sampler' })
      .then((sampler) => {
        samplerRef = sampler;
        samplePlayerRef = sampler.samplePlayer;
      })
      .catch(() => {
        // Errors already logged and dispatched as 'sampler-error' by createSampler
      });

    const handleSampleLoaded = () => {
      const audiobuffer = samplePlayerRef?.audiobuffer || null;

      setCurrentAudioBuffer(audiobuffer);
      setSampleLoaded(true);
      // Preserve a device chosen before the player was ready
      const chosenDeviceId = selectedInputDeviceId();
      if (chosenDeviceId) {
        samplePlayerRef?.setRecorderInputDeviceId(chosenDeviceId);
      } else {
        setSelectedInputDeviceId(
          samplePlayerRef?.getRecorderInputDeviceId() || '',
        );
      }
    };

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
    addPreventScrollOnSpacebarListener();
    window.addEventListener('resize', updateLayout);

    const inputSourceSelect = inputSourceSelectRef?.querySelector('select');
    setInputSource(inputSourceSelect?.value ?? 'audio-input');
    const handleInputSourceChange = (e: Event) =>
      setInputSource((e.target as HTMLSelectElement).value);
    inputSourceSelect?.addEventListener('change', handleInputSourceChange);
    onCleanup(() =>
      inputSourceSelect?.removeEventListener('change', handleInputSourceChange),
    );

    document.addEventListener('sample-loaded', handleSampleLoaded);

    enableSamplePlayerMidi({
      getSamplePlayer: () => samplePlayerRef,
      enableKnobMidi: true,
      midiLearnEnabled: true,
      knobMappings: [
        { cc: 15, selector: 'highpass-filter-knob', name: 'HPF' },
        { cc: 73, selector: 'lowpass-filter-knob', name: 'LPF' },
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
      window.removeEventListener('resize', updateLayout);
      document.removeEventListener('sample-loaded', handleSampleLoaded);
      document.removeEventListener('midi:learn', handleMidiLearn);

      cleanupNotifications();
      disableSamplePlayerMidi();
      samplerRef?.dispose();
    });
  });

  return (
    <>
      <div class='content-wrapper'>
        {/* // ! START TEST sidebar ! */}
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
              disabled={!sampleLoaded()}
              isOpen={sidebarOpen()}
              class={`toolbar-btn ${toolbarOpen() ? '__toolbar-open' : ''}`}
            />

            <ThemeToggle
              class={`toolbar-btn ${toolbarOpen() ? '__toolbar-open' : ''}`}
              defaultTheme='light'
            />

            <InputDeviceSelect
              class={`toolbar-btn input-device-select ${toolbarOpen() ? '__toolbar-open' : ''}`}
              disabled={inputDeviceSelectDisabled()}
              value={selectedInputDeviceId()}
              onChange={handleInputDeviceChange}
            />

            <OutputDeviceSelect
              class={`toolbar-btn output-device-select ${toolbarOpen() ? '__toolbar-open' : ''}`}
            />

            {/* <tempo-knob
          target-node-id='test-sampler'
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
        {/* <Oscilloscope ctx={} input={} /> */}

        {/* // ! END TEST sidebar ! */}
        <div class={`control-grid layout-${layout()}`} id='sampler-container'>
          <fieldset class='control-group env-group'>
            <legend class='expandable-legend'>Envelopes</legend>
            <div class='expandable-content'>
              <div class='flex-col'>
                <envelope-switcher
                  height={envHeight()}
                  bg-color='var(--envelope-bg)'
                  target-node-id='test-sampler'
                />
                {/* <div class='flex-row'>
                <trim-start-knob target-node-id='test-sampler' />
                <trim-end-knob target-node-id='test-sampler' />

                <loop-start-knob
                  target-node-id='test-sampler'
                  label='Loop Start'
                />
                <loop-duration-knob
                  target-node-id='test-sampler'
                  label='Loop Duration'
                />
                <loop-duration-drift-knob
                  target-node-id='test-sampler'
                  label='Loop Drift'
                />
                <pan-drift-toggle target-node-id='test-sampler' />
              </div> */}
              </div>
            </div>
          </fieldset>

          <fieldset id='sample-group' class='control-group sample-group'>
            <legend class='expandable-legend'>Sample</legend>
            <div class='expandable-content'>
              <volume-knob target-node-id='test-sampler' />
              <div class='flex-col'>
                <record-button
                  target-node-id='test-sampler'
                  show-status='false'
                />
                <div class='input-source-selection-container'>
                  <input-select
                    ref={inputSourceSelectRef}
                    target-node-id='test-sampler'
                    class='input-source-select'
                  />
                  <InputDeviceSelect
                    class='input-device-select'
                    disabled={inputDeviceSelectDisabled()}
                    value={selectedInputDeviceId()}
                    onChange={handleInputDeviceChange}
                  />
                </div>
              </div>
              <div class='flex-col'>
                <load-button target-node-id='test-sampler' show-status='false' />

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
              <dry-wet-knob target-node-id='test-sampler' />
              <reverb-send-knob label='RevSend' target-node-id='test-sampler' />
              <reverb-size-knob label='RevSize' target-node-id='test-sampler' />
              <delay-send-knob label='Delay' target-node-id='test-sampler' />
              <delay-time-knob label='Time' target-node-id='test-sampler' />
              <delay-feedback-knob label='FB' target-node-id='test-sampler' />
            </div>
          </fieldset>

          <fieldset class='control-group filter-group'>
            <legend class='expandable-legend'>Filters</legend>
            <div class='expandable-content'>
              <highpass-filter-knob target-node-id='test-sampler' />
              <lowpass-filter-knob target-node-id='test-sampler' />

              {/* <KnobComponent
                preset='highpassFilter'
                displayValue={true}
                size={45}
                onChange={(detail: KnobChangeEventDetail) =>
                  samplePlayerRef?.setHpfCutoff(detail.value)
                }
              />
              <KnobComponent
                preset='lowpassFilter'
                displayValue={true}
                size={45}
                onChange={(detail: KnobChangeEventDetail) =>
                  samplePlayerRef?.setLpfCutoff(detail.value)
                }
              /> */}
            </div>
          </fieldset>

          <fieldset class='control-group misc-group'>
            <legend class='expandable-legend'>Dirt</legend>
            <div class='expandable-content'>
              <distortion-knob target-node-id='test-sampler' />
              <am-modulation label='AM' target-node-id='test-sampler' />
            </div>
          </fieldset>

          <fieldset class='control-group loop-group'>
            <legend class='expandable-legend'>Loop</legend>
            <div class='expandable-content'>
              <loop-start-knob target-node-id='test-sampler' label='Start' />
              <loop-duration-knob
                target-node-id='test-sampler'
                label='Duration'
              />
              <keytrack-loop-knob
                target-node-id='test-sampler'
                label='KeyTrack'
                title='Only affects loops longer than audiorate'
              />
              <div class='flex-col'>
                <loop-duration-drift-knob
                  target-node-id='test-sampler'
                  label='Drift'
                />
                <pan-drift-toggle target-node-id='test-sampler' />
              </div>
            </div>
          </fieldset>

          <fieldset class='control-group trim-group'>
            <legend class='expandable-legend'>Trim</legend>
            <div class='expandable-content'>
              <trim-start-knob target-node-id='test-sampler' />
              <trim-end-knob target-node-id='test-sampler' />
            </div>
          </fieldset>

          <fieldset class='control-group feedback-group'>
            <legend class='expandable-legend'>Feedback</legend>
            <div class='expandable-content'>
              <feedback-knob target-node-id='test-sampler' label='Amount' />
              <feedback-pitch-knob
                target-node-id='test-sampler'
                label='Pitch'
              />
              <feedback-lpf-knob
                label='Lowpass'
                class='fb-lpf-knob'
                target-node-id='test-sampler'
              />

              <feedback-decay-knob
                target-node-id='test-sampler'
                label='Decay'
              />

              <feedback-mode-toggle target-node-id='test-sampler' label='' />
            </div>
          </fieldset>

          {/* Todo: add .control-group to lfo-container? Clarify */}
          <div class='lfo-container'>
            <fieldset class='control-group amp-lfo-group'>
              <legend class='expandable-legend'>Amp LFO</legend>
              <div class='expandable-content'>
                <div class='flex-col'>
                  <gain-lfo-rate-knob
                    target-node-id='test-sampler'
                    label='Rate'
                  />
                  <gain-lfo-sync-toggle
                    target-node-id='test-sampler'
                    label=''
                  />
                </div>
                <gain-lfo-depth-knob
                  target-node-id='test-sampler'
                  label='Depth'
                />
              </div>
            </fieldset>

            <fieldset class='control-group pitch-lfo-group'>
              <legend class='expandable-legend'>Pitch LFO</legend>
              <div class='expandable-content'>
                <div class='flex-col'>
                  <pitch-lfo-rate-knob
                    target-node-id='test-sampler'
                    label='Rate'
                  />
                  <pitch-lfo-sync-toggle
                    target-node-id='test-sampler'
                    label=''
                  />
                </div>
                <pitch-lfo-depth-knob
                  target-node-id='test-sampler'
                  label='Depth'
                />
              </div>
            </fieldset>
          </div>

          <fieldset class='control-group toggle-group'>
            <legend class='expandable-legend'>Toggles</legend>
            <div class='expandable-content'>
              <midi-toggle target-node-id='test-sampler' />
              <playback-direction-toggle target-node-id='test-sampler' />
              <loop-lock-toggle target-node-id='test-sampler' />
              <hold-lock-toggle target-node-id='test-sampler' />
              <pitch-toggle target-node-id='test-sampler' />
              <sampler-status target-node-id='test-sampler' />
            </div>
          </fieldset>

          <fieldset class='control-group keyboard-group'>
            <legend class='expandable-legend'>Keyboard</legend>
            <computer-keyboard target-node-id='test-sampler' />
            <div class='expandable-content'>
              <piano-keyboard
                id='piano-keyboard'
                class='piano-keyboard'
                target-node-id='test-sampler'
                height='80'
              />
              <div class='keyboard-controls'>
                <div class='flex-row'>
                  <rootnote-select
                    show-label='false'
                    target-node-id='test-sampler'
                  />
                  <keymap-select
                    show-label='false'
                    target-node-id='test-sampler'
                  />
                </div>

                <glide-knob target-node-id='test-sampler' />
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
//     samplePlayerRef?.freezeActiveVoices(true);
//   }
// });
// document.body.addEventListener('keyup', (e) => {
//   if (e.code === 'IntlBackslash') {
//     e.preventDefault();
//     console.log('Unfreezing active voices');
//     samplePlayerRef?.freezeActiveVoices(false);
//   }
// });
// ! END - TEST Listener
