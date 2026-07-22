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
import ParamKnob from './components/knobs/ParamKnob';
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
  const [samplePlayer, setSamplePlayer] = createSignal<SamplePlayer | null>(
    null,
  );

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
    let disposed = false;

    createSampler({ nodeId: 'test-sampler' })
      .then((sampler) => {
        if (disposed) {
          sampler.dispose();
          return;
        }
        samplerRef = sampler;
        samplePlayerRef = sampler.samplePlayer;
        setSamplePlayer(sampler.samplePlayer);
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
              <ParamKnob param='volume' player={samplePlayer()} />
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
                <load-button
                  target-node-id='test-sampler'
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
              <ParamKnob param='distortion' player={samplePlayer()} />
              <am-modulation label='AM' target-node-id='test-sampler' />
            </div>
          </fieldset>

          <fieldset class='control-group loop-group'>
            <legend class='expandable-legend'>Loop</legend>
            <div class='expandable-content'>
              <ParamKnob
                param='loopStart'
                label='Start'
                player={samplePlayer()}
              />
              <ParamKnob
                param='loopDuration'
                label='Duration'
                player={samplePlayer()}
              />
              <ParamKnob
                param='keytrackLoop'
                label='KeyTrack'
                title='Only affects loops longer than audiorate'
                player={samplePlayer()}
              />
              <div class='flex-col'>
                <ParamKnob
                  param='loopDurationDrift'
                  label='Drift'
                  player={samplePlayer()}
                />
                <pan-drift-toggle target-node-id='test-sampler' />
              </div>
            </div>
          </fieldset>

          <fieldset class='control-group trim-group'>
            <legend class='expandable-legend'>Trim</legend>
            <div class='expandable-content'>
              <ParamKnob param='trimStart' player={samplePlayer()} />
              <ParamKnob param='trimEnd' player={samplePlayer()} />
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
                class='fb-lpf-knob'
                player={samplePlayer()}
              />

              <ParamKnob
                param='feedbackDecay'
                label='Decay'
                player={samplePlayer()}
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
                  <ParamKnob
                    param='gainLFORate'
                    label='Rate'
                    player={samplePlayer()}
                  />
                  <gain-lfo-sync-toggle
                    target-node-id='test-sampler'
                    label=''
                  />
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
                  <pitch-lfo-sync-toggle
                    target-node-id='test-sampler'
                    label=''
                  />
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
