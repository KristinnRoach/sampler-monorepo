import { Component, onMount, createSignal } from 'solid-js';
import type { SamplerElement } from '@repo/audio-components';

const App: Component = () => {
  let samplerRef: SamplerElement | undefined;
  const [sampleLoaded, setSampleLoaded] = createSignal(false);
  const [layout, setLayout] = createSignal<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );

  onMount(() => {
    const handleSampleLoaded = () => {
      if (samplerRef) {
        const samplePlayer = samplerRef.getSamplePlayer();
        setSampleLoaded(true);
      }
    };

    // Simple responsive layout detection
    const updateLayout = () => {
      const width = window.innerWidth;

      if (width < 600) {
        setLayout('mobile');
      } else if (width < 900) {
        setLayout('tablet');
      } else {
        setLayout('desktop');
      }
    };

    document.addEventListener('sample-loaded', handleSampleLoaded);
    window.addEventListener('resize', updateLayout);

    updateLayout(); // Initial check

    // Add expand/collapse listeners (from original main.ts)
    const addExpandCollapseListeners = () => {
      const legends = document.querySelectorAll('.expandable-legend');
      legends.forEach((legend) => {
        legend.addEventListener('click', () => {
          const fieldset = legend.closest('fieldset');
          if (fieldset) {
            fieldset.classList.toggle('collapsed');
          }
        });
      });
    };

    addExpandCollapseListeners();

    return () => {
      document.removeEventListener('sample-loaded', handleSampleLoaded);
      window.removeEventListener('resize', updateLayout);
    };
  });

  return (
    <div id='page-wrapper' class='page-wrapper'>
      <div class={`control-grid layout-${layout()}`} id='sampler-container'>
        {/* Sampler Audio Engine */}
        <sampler-element
          ref={samplerRef}
          node-id='test-sampler'
          debug-mode='false'
        />

        {/* Controls */}
        <fieldset class='control-group env-group'>
          <legend class='expandable-legend'>Envelopes</legend>
          <div class='expandable-content'>
            <envelope-switcher height='225px' target-node-id='test-sampler' />
          </div>
        </fieldset>

        <fieldset class='control-group sample-group'>
          <legend class='expandable-legend'>Sample</legend>
          <div class='expandable-content'>
            <div class='flex-col'>
              <record-button
                target-node-id='test-sampler'
                show-status='false'
              />
              <input-select target-node-id='test-sampler' />
            </div>
            <load-button target-node-id='test-sampler' show-status='false' />
          </div>
        </fieldset>

        <fieldset class='control-group mix-group'>
          <legend class='expandable-legend'>Mix</legend>
          <div class='expandable-content'>
            <volume-knob target-node-id='test-sampler' />
            <dry-wet-knob target-node-id='test-sampler' />
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

        <fieldset class='control-group filter-group'>
          <legend class='expandable-legend'>Filters</legend>
          <div class='expandable-content'>
            <lowpass-filter-knob target-node-id='test-sampler' />
            <highpass-filter-knob target-node-id='test-sampler' />
          </div>
        </fieldset>

        <fieldset class='control-group reverb-group'>
          <legend class='expandable-legend'>Reverb</legend>
          <div class='expandable-content'>
            <reverb-send-knob label='Send' target-node-id='test-sampler' />
            <reverb-size-knob label='Size' target-node-id='test-sampler' />
          </div>
        </fieldset>

        <fieldset class='control-group effects-group'>
          <legend class='expandable-legend'>Effects</legend>
          <div class='expandable-content effects-grid'>
            <div class='flex-row dist-am'>
              <distortion-knob target-node-id='test-sampler' />
              <am-modulation target-node-id='test-sampler' />
            </div>
            <div class='effect-section'>
              <h4>Feedback</h4>
              <div class='feedback-controls'>
                <div class='flex-col'>
                  <feedback-knob target-node-id='test-sampler' label='Amount' />
                  <feedback-mode-toggle
                    target-node-id='test-sampler'
                    label=''
                  />
                </div>
                <div class='flex-row'>
                  <div class='flex-col'>
                    <feedback-pitch-knob
                      target-node-id='test-sampler'
                      label='Pitch'
                    />
                    <feedback-lpf-knob
                      label='Lowpass'
                      class='fb-lpf-knob'
                      target-node-id='test-sampler'
                    />
                  </div>
                  <feedback-decay-knob
                    target-node-id='test-sampler'
                    label='Decay'
                  />
                </div>
              </div>
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

        <fieldset class='control-group amp-lfo-group'>
          <legend class='expandable-legend'>LFO's</legend>
          <div class='expandable-content'>
            <div class='flex-col'>
              <gain-lfo-rate-knob target-node-id='test-sampler' label='Rate' />
              <gain-lfo-sync-toggle target-node-id='test-sampler' label='' />
            </div>
            <gain-lfo-depth-knob target-node-id='test-sampler' label='Depth' />
            <div class='flex-col'>
              <pitch-lfo-rate-knob target-node-id='test-sampler' label='Rate' />
              <pitch-lfo-sync-toggle target-node-id='test-sampler' label='' />
            </div>
            <pitch-lfo-depth-knob target-node-id='test-sampler' label='Depth' />
          </div>
        </fieldset>

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
              width='800'
              height='80'
            />
            <div class='keyboard-controls'>
              <keymap-select show-label='false' target-node-id='test-sampler' />
              <glide-knob target-node-id='test-sampler' />
            </div>
          </div>
        </fieldset>

        {/* Row collapse icons */}
        <div class='row-collapse-icon' data-row='1' style='grid-area: reverb' />
        <div class='row-collapse-icon' data-row='2' style='grid-area: mod' />
        <div
          class='row-collapse-icon'
          data-row='3'
          style='grid-area: pitch-lfo'
        />
        <div
          class='row-collapse-icon'
          data-row='4'
          style='grid-area: keyboard'
        />
      </div>
    </div>
  );
};

export default App;
