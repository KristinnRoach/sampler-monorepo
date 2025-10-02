import { Component, onMount, createSignal, onCleanup } from 'solid-js';

import type { SamplerElement, SamplePlayer } from '@repo/audio-components';

import './styles/midi-learn.css';

import { addExpandCollapseListeners } from './utils/expandCollapse';
import { addPreventScrollOnSpacebarListener } from './utils/preventScrollOnSpacebar';
import { restoreInstrumentState } from './utils/instrumentState';
import { SavedSample } from './db/samplelib/sampleIdb';
import {
  enableSamplePlayerMidi,
  disableSamplePlayerMidi,
} from './io/InputController';

import { ThemeToggle } from './components/ThemeSwitcher';
import SaveButton from './components/SaveButton';
import Sidebar from './components/Sidebar';
import SidebarToggle from './components/SidebarToggle';

const App: Component = () => {
  const [layout, setLayout] = createSignal<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );

  let samplerElementRef: SamplerElement | undefined;
  let samplePlayerRef: SamplePlayer | null = null;

  let notificationEl: HTMLDivElement | undefined;

  const [currentAudioBuffer, setCurrentAudioBuffer] =
    createSignal<AudioBuffer | null>(null);
  const [sampleLoaded, setSampleLoaded] = createSignal(false);
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  // Helper function to show temporary notifications
  const showNotification = (message: string, duration = 3000) => {
    if (!notificationEl) {
      // Create notification element if it doesn't exist yet
      notificationEl = document.createElement('div');
      notificationEl.className = 'midi-notification';
      notificationEl.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 10px 15px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        transform: translateY(20px);
        opacity: 0;
        transition: opacity 0.3s, transform 0.3s;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      `;
      document.body.appendChild(notificationEl);
    }

    notificationEl.innerHTML = message;

    notificationEl.style.opacity = '1';
    notificationEl.style.transform = 'translateY(0)';

    setTimeout(() => {
      if (notificationEl) {
        notificationEl.style.opacity = '0';
        notificationEl.style.transform = 'translateY(20px)';
      }
    }, duration);
  };

  const handleSampleSelect = async (sample: SavedSample) => {
    try {
      if (!samplePlayerRef) return;

      const arrayBuffer = sample.audioData;

      await samplePlayerRef.loadSample(arrayBuffer, undefined, {
        skipPreProcessing: true,
      });

      // Restore envelope settings using direct method call
      if (sample.settings?.envelopes) {
        // Wait a bit for the sample-loaded event to complete and envelopes to be created
        setTimeout(() => {
          const envelopeSwitcherElement = document.querySelector(
            'envelope-switcher[target-node-id="test-sampler"]'
          ) as any;
          if (
            envelopeSwitcherElement &&
            envelopeSwitcherElement.restoreEnvelopeSettings
          ) {
            envelopeSwitcherElement.restoreEnvelopeSettings(
              sample.settings.envelopes
            );
          }
        }, 100);
      }

      // Restore other settings (non-envelope) after a delay
      if (sample.settings) {
        setTimeout(() => {
          const settingsWithoutEnvelopes = { ...sample.settings };
          delete settingsWithoutEnvelopes.envelopes;
          restoreInstrumentState(settingsWithoutEnvelopes);
        }, 500);
      }

      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load sample:', error);
    }
  };

  onMount(() => {
    const handleSampleLoaded = () => {
      if (!samplerElementRef) {
        return;
      }

      samplePlayerRef = samplerElementRef.getSamplePlayer();
      const audiobuffer = samplePlayerRef?.audiobuffer || null;

      setCurrentAudioBuffer(audiobuffer);
      setSampleLoaded(true);

      // Set up event listeners for MIDI-related messages
      if (samplePlayerRef) {
        // Listen for MIDI enabled/disabled events
        samplePlayerRef.onMessage('midi:enabled', (msg) => {
          showNotification(
            'MIDI enabled - Press Alt+Shift+L to access MIDI Learn'
          );
        });

        samplePlayerRef.onMessage('midi:disabled', (msg) => {
          showNotification('MIDI disabled');
        });
      }
    };

    // Simple responsive layout detection
    const updateLayout = () => {
      const width = window.innerWidth;

      if (width < 800) {
        setLayout('mobile');
      } else if (width < 1200) {
        setLayout('tablet');
      } else {
        setLayout('desktop');
      }
    };

    document.addEventListener('sample-loaded', handleSampleLoaded);
    window.addEventListener('resize', updateLayout);
    addPreventScrollOnSpacebarListener();

    enableSamplePlayerMidi({
      getSamplePlayer: () => samplePlayerRef,
      enableKnobMidi: true,
      midiLearnEnabled: true,
      knobMappings: [
        { cc: 15, selector: 'highpass-filter-knob', name: 'HPF' },
        { cc: 73, selector: 'lowpass-filter-knob', name: 'LPF' },
      ],
    }).then((success) => {
      if (!success) {
        console.warn('MIDI initialization failed');
      }
    });

    // Listen for MIDI-related custom events
    document.addEventListener('midi:learn', ((
      e: CustomEvent<{ message: string }>
    ) => {
      if (e.detail?.message) {
        showNotification(e.detail.message);
      }
    }) as EventListener);

    document.addEventListener('midi:mapping', ((
      e: CustomEvent<{ message: string }>
    ) => {
      if (e.detail?.message) {
        showNotification(e.detail.message);
      }
    }) as EventListener);

    updateLayout(); // Initial check

    // Add expand/collapse listeners
    addExpandCollapseListeners();

    onCleanup(() => {
      document.removeEventListener('sample-loaded', handleSampleLoaded);
      window.removeEventListener('resize', updateLayout);

      // Remove MIDI notification event listeners
      document.removeEventListener('midi:learn', ((
        e: CustomEvent
      ) => {}) as EventListener);
      document.removeEventListener('midi:mapping', ((
        e: CustomEvent
      ) => {}) as EventListener);

      // Clean up notification element
      if (notificationEl && notificationEl.parentNode) {
        notificationEl.parentNode.removeChild(notificationEl);
      }
      notificationEl = undefined;

      // Clean up MIDI
      disableSamplePlayerMidi();
    });
  });

  return (
    <>
      <div id='page-wrapper' class='page-wrapper'>
        <div class='pre-sidebar-buttons'>
          <SidebarToggle
            onclick={() => setSidebarOpen(!sidebarOpen())}
            isOpen={sidebarOpen()}
            class='left-side-button'
          />

          <SaveButton
            audioBuffer={currentAudioBuffer()}
            disabled={!sampleLoaded()}
            isOpen={sidebarOpen()}
            class='left-side-button'
          />

          <ThemeToggle
            class={sidebarOpen() ? 'open' : ''}
            defaultTheme='light'
          />

          {/* <tempo-knob
          target-node-id='test-sampler'
          label=' '
          class={`left-side-button ${sidebarOpen() ? 'open' : ''} `}
        /> */}
        </div>
        <Sidebar
          isOpen={sidebarOpen()}
          onClose={() => setSidebarOpen(false)}
          onSampleSelect={handleSampleSelect}
        />
        <div class={`control-grid layout-${layout()}`} id='sampler-container'>
          <sampler-element
            ref={samplerElementRef}
            node-id='test-sampler'
            debug-mode='false'
          />

          <fieldset class='control-group env-group'>
            <legend class='expandable-legend'>Envelopes</legend>
            <div class='expandable-content'>
              <div class='flex-col'>
                <envelope-switcher
                  height='225px'
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
                <input-select target-node-id='test-sampler' />
              </div>
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
                width='700'
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

          {/* Row collapse icons */}
          <div
            class='row-collapse-icon'
            data-row='1'
            style='grid-area: space'
          />
          <div
            class='row-collapse-icon'
            data-row='2'
            style='grid-area: feedback'
          />
          <div class='row-collapse-icon' data-row='3' style='grid-area: lfo' />
          <div
            class='row-collapse-icon'
            data-row='4'
            style='grid-area: keyboard'
          />
        </div>
      </div>
    </>
  );
};

export default App;
