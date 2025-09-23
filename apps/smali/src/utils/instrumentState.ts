// instrumentState.ts - Utilities for capturing and restoring instrument state

export interface EnvelopeSettings {
  points: Array<{ time: number; value: number; curve?: string }>;
  sustainPointIndex?: number | null;
  releasePointIndex?: number;
  isEnabled: boolean;
  loopEnabled: boolean;
  syncedToPlaybackRate: boolean;
  timeScale?: number;
}

export interface InstrumentSettings {
  knobs: Record<string, number>;
  toggles: Record<string, boolean | string>;
  envelopes: Record<string, EnvelopeSettings>;
  selects: Record<string, string>;
  tempo: number;
}

/**
 * Captures the current state of all instrument controls
 */
export function captureInstrumentState(): InstrumentSettings {
  const state: InstrumentSettings = {
    knobs: {},
    toggles: {},
    envelopes: {},
    selects: {},
    tempo: 120,
  };

  // Capture all knob values
  // First, capture knobs that are wrapped in custom elements
  const knobWrappers = [
    'volume-knob',
    'dry-wet-knob',
    'reverb-send-knob',
    'reverb-size-knob',
    'delay-send-knob',
    'delay-time-knob',
    'delay-feedback-knob',
    'highpass-filter-knob',
    'lowpass-filter-knob',
    'distortion-knob',
    'am-modulation',
    'loop-start-knob',
    'loop-duration-knob',
    'loop-duration-drift-knob',
    'trim-start-knob',
    'trim-end-knob',
    'feedback-knob',
    'feedback-pitch-knob',
    'feedback-lpf-knob',
    'feedback-decay-knob',
    'gain-lfo-rate-knob',
    'gain-lfo-depth-knob',
    'pitch-lfo-rate-knob',
    'pitch-lfo-depth-knob',
    'glide-knob',
  ];

  knobWrappers.forEach((tagName) => {
    const wrapper = document.querySelector(tagName);
    if (wrapper) {
      // Look for knob-element inside the wrapper
      const knobElement = wrapper.querySelector('knob-element') as any;
      if (knobElement) {
        if (knobElement.getValue) {
          state.knobs[tagName] = knobElement.getValue();
        } else if (knobElement.value !== undefined) {
          state.knobs[tagName] = knobElement.value;
        }
      } else {
        // The wrapper itself might be the knob element
        const element = wrapper as any;
        if (element.getValue) {
          state.knobs[tagName] = element.getValue();
        } else if (element.value !== undefined) {
          state.knobs[tagName] = element.value;
        }
      }
    }
  });

  // Capture tempo knob (special case as it's a custom element)
  const tempoKnob = document.querySelector('tempo-knob');
  if (tempoKnob && (tempoKnob as any).getValue) {
    state.tempo = (tempoKnob as any).getValue();
  }

  // Capture all toggle states
  // NOTE: This uses an explicit allow-list approach to ensure we ONLY capture
  // user preference toggles and never affect operational button states like
  // record-button, load-button, or save-button which have their own runtime state
  const toggleMappings: Record<string, string[]> = {
    'midi-toggle': ['midi_on', 'midi_off'],
    'playback-direction-toggle': ['direction_forward', 'direction_reverse'],
    'loop-lock-toggle': ['loop_locked', 'loop_unlocked'],
    'hold-lock-toggle': ['hold_locked', 'hold_unlocked'],
    'pitch-toggle': ['pitch_on', 'pitch_off'],
  };

  // Capture SVG button toggles
  Object.entries(toggleMappings).forEach(([tagName, states]) => {
    const wrapper = document.querySelector(tagName);
    if (wrapper) {
      // Look for the SVG button inside
      const button = wrapper.querySelector('button.svg-button') as any;
      if (button && button.getState) {
        const currentState = button.getState();
        state.toggles[tagName] = currentState;
      }
    }
  });

  // Capture van-based toggles (feedback mode, LFO sync, pan drift)
  const vanToggles = [
    'pan-drift-toggle',
    'feedback-mode-toggle',
    'gain-lfo-sync-toggle',
    'pitch-lfo-sync-toggle',
  ];

  vanToggles.forEach((tagName) => {
    const toggle = document.querySelector(tagName);
    if (toggle) {
      const element = toggle as any;
      let isActive = false;

      // Van-based toggles likely use the active property
      if (element.isActive) {
        isActive = element.isActive();
      } else if (element.active !== undefined) {
        isActive = element.active;
      } else if (element.checked !== undefined) {
        isActive = element.checked;
      }

      state.toggles[tagName] = isActive;
    }
  });

  // Capture select/dropdown values
  const selects = ['rootnote-select', 'keymap-select'];
  selects.forEach((tagName) => {
    const wrapper = document.querySelector(tagName);
    if (wrapper) {
      // Look for the actual select element inside
      const selectElement = wrapper.querySelector(
        'select'
      ) as HTMLSelectElement;
      if (selectElement) {
        const value = selectElement.value;
        state.selects[tagName] = value;
      } else {
        // Fallback to wrapper element properties
        const element = wrapper as any;
        let value = '';
        if (element.getValue) {
          value = element.getValue();
        } else if (element.value !== undefined) {
          value = element.value;
        }
        if (value) {
          state.selects[tagName] = value;
        }
      }
    }
  });

  // Capture waveform-select inside am-modulation
  const amModulation = document.querySelector('am-modulation');
  if (amModulation) {
    const waveformSelect = amModulation.querySelector(
      'select'
    ) as HTMLSelectElement;
    if (waveformSelect) {
      const value = waveformSelect.value;
      state.selects['waveform-select'] = value;
    }
  }

  // Capture envelope states
  const samplerElement = document.querySelector('sampler-element') as any;
  if (samplerElement?.getSamplePlayer) {
    const sampler = samplerElement.getSamplePlayer();
    if (sampler && sampler.initialized) {
      // Capture all three envelope types
      const envelopeTypes = ['amp-env', 'filter-env', 'pitch-env'] as const;

      envelopeTypes.forEach((envType) => {
        try {
          const envelope = sampler.getEnvelope(envType);
          if (envelope) {
            state.envelopes[envType] = {
              points: envelope.points.map((p: any) => ({
                time: p.time,
                value: p.value,
                curve: p.curve || 'linear',
              })),
              sustainPointIndex: envelope.sustainPointIndex || null,
              releasePointIndex: envelope.releasePointIndex,
              isEnabled: envelope.isEnabled,
              loopEnabled: envelope.loopEnabled,
              syncedToPlaybackRate: envelope.syncedToPlaybackRate,
              timeScale: envelope.timeScale || 1,
            };
          }
        } catch (error) {
          console.warn(`Could not capture envelope ${envType}:`, error);
        }
      });
    }
  }

  return state;
}

/**
 * Restores instrument state from saved settings
 */
export function restoreInstrumentState(settings: InstrumentSettings): void {
  // Restore knob values
  Object.entries(settings.knobs).forEach(([tagName, value]) => {
    // First try to find the wrapper element
    const wrapper = document.querySelector(tagName);
    if (wrapper) {
      // Look for knob-element inside the wrapper
      const knobElement = wrapper.querySelector('knob-element') as any;
      if (knobElement) {
        if (knobElement.setValue) {
          knobElement.setValue(value);
        } else if (knobElement.value !== undefined) {
          knobElement.value = value;
        }
      } else {
        // The wrapper itself might be the knob element
        const element = wrapper as any;
        if (element.setValue) {
          element.setValue(value);
        } else if (element.value !== undefined) {
          element.value = value;
        }
      }
    }
  });

  // Restore tempo
  if (settings.tempo) {
    const tempoKnob = document.querySelector('tempo-knob');
    if (tempoKnob && (tempoKnob as any).setValue) {
      (tempoKnob as any).setValue(settings.tempo);
    }
  }

  // Restore toggle states
  Object.entries(settings.toggles).forEach(([tagName, value]) => {
    // Check if this is an SVG button toggle (stores state string) or a boolean toggle
    const isSvgButton =
      typeof value === 'string' &&
      [
        'midi_on',
        'midi_off',
        'direction_forward',
        'direction_reverse',
        'loop_locked',
        'loop_unlocked',
        'hold_locked',
        'hold_unlocked',
        'pitch_on',
        'pitch_off',
      ].includes(value);

    if (isSvgButton) {
      // Handle SVG button toggles
      const wrapper = document.querySelector(tagName);
      if (wrapper) {
        const button = wrapper.querySelector('button.svg-button') as any;
        if (button && button.setState) {
          // Simply set the button state - this updates the visual
          button.setState(value);

          // Now we need to update the sampler state to match
          // We'll do this by getting the sampler and calling the appropriate method
          const samplerElement = document.querySelector(
            'sampler-element'
          ) as any;
          if (samplerElement?.getSamplePlayer) {
            const sampler = samplerElement.getSamplePlayer();
            if (sampler) {
              // Apply the state to the sampler based on the toggle type
              switch (tagName) {
                case 'midi-toggle':
                  if (value === 'midi_on') sampler.enableMIDI();
                  else sampler.disableMIDI();
                  break;
                case 'playback-direction-toggle':
                  sampler.setPlaybackDirection(
                    value === 'direction_reverse' ? 'reverse' : 'forward'
                  );
                  break;
                case 'loop-lock-toggle':
                  sampler.setLoopLocked(value === 'loop_locked');
                  break;
                case 'hold-lock-toggle':
                  sampler.setHoldLocked(value === 'hold_locked');
                  break;
                case 'pitch-toggle':
                  if (value === 'pitch_on') sampler.enablePitch();
                  else sampler.disablePitch();
                  break;
              }
            }
          }
        } else {
          console.warn(
            `[InstrumentState] Could not find SVG button in ${tagName}`
          );
        }
      } else {
        console.warn(`[InstrumentState] Could not find wrapper: ${tagName}`);
      }
    } else {
      // Handle van-based boolean toggles
      const toggle = document.querySelector(tagName);
      if (toggle) {
        const element = toggle as any;
        const isActive = value as boolean;

        // Try different methods to set the toggle state
        if (element.setActive) {
          element.setActive(isActive);
        } else if (element.active !== undefined) {
          element.active = isActive;
        } else if (element.checked !== undefined) {
          element.checked = isActive;
        } else if (element.toggle) {
          // Some toggles might need to be toggled to the right state
          const currentState = element.active || element.checked || false;
          if (currentState !== isActive) {
            element.toggle();
          }
        }

        // Dispatch change event to notify listeners
        toggle.dispatchEvent(
          new CustomEvent('toggle', {
            bubbles: true,
            detail: { active: isActive },
          })
        );
      } else {
        console.warn(`[InstrumentState] Could not find toggle: ${tagName}`);
      }
    }
  });

  // Restore select values
  Object.entries(settings.selects).forEach(([tagName, value]) => {
    // Special handling for waveform-select inside am-modulation
    if (tagName === 'waveform-select') {
      const amModulation = document.querySelector('am-modulation');
      if (amModulation) {
        const waveformSelect = amModulation.querySelector(
          'select'
        ) as HTMLSelectElement;
        if (waveformSelect) {
          waveformSelect.value = value;
          waveformSelect.dispatchEvent(new Event('change', { bubbles: true }));

          // Update sampler directly
          const samplerElement = document.querySelector(
            'sampler-element'
          ) as any;
          if (samplerElement?.getSamplePlayer) {
            const sampler = samplerElement.getSamplePlayer();
            if (sampler) {
              sampler.setModulationWaveform('AM', value);
            }
          }
        }
      }
      return; // Skip the rest of the logic for this special case
    }

    const wrapper = document.querySelector(tagName);
    if (wrapper) {
      // Look for the actual select element inside
      const selectElement = wrapper.querySelector(
        'select'
      ) as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = value;
        // Dispatch change event to trigger Van.js state update
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));

        // Also update the sampler directly to ensure state is synced
        const samplerElement = document.querySelector('sampler-element') as any;
        if (samplerElement?.getSamplePlayer) {
          const sampler = samplerElement.getSamplePlayer();
          if (sampler) {
            switch (tagName) {
              case 'rootnote-select':
                sampler.setRootNote(value);
                break;
              case 'keymap-select':
                // Dispatch keymap change event for keyboard components
                // The keyboard component needs the actual keymap data
                // We'll let the select's change event handle this properly
                // by not interfering with the natural flow
                break;
              case 'input-select':
                sampler.setRecorderInputSource(value);
                break;
            }
          }
        }
      } else {
        // Fallback to wrapper element methods
        const element = wrapper as any;
        if (element.setValue) {
          element.setValue(value);
        } else if (element.value !== undefined) {
          element.value = value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    } else {
      console.warn(`[InstrumentState] Could not find select: ${tagName}`);
    }
  });
}

/**
 * Creates a snapshot of just the essential performance settings
 * (a lighter alternative that captures only the most important parameters)
 */
export function captureEssentialSettings() {
  return {
    // Core sound parameters
    volume: getKnobValue('volume-knob'),
    dryWet: getKnobValue('dry-wet-knob'),
    trimStart: getKnobValue('trim-start-knob'),
    trimEnd: getKnobValue('trim-end-knob'),

    // Effects
    reverbSend: getKnobValue('reverb-send-knob'),
    reverbSize: getKnobValue('reverb-size-knob'),
    delaySend: getKnobValue('delay-send-knob'),
    delayTime: getKnobValue('delay-time-knob'),
    delayFeedback: getKnobValue('delay-feedback-knob'),
    distortion: getKnobValue('distortion-knob'),

    // Filters
    highpass: getKnobValue('highpass-filter-knob'),
    lowpass: getKnobValue('lowpass-filter-knob'),

    // Loop
    loopStart: getKnobValue('loop-start-knob'),
    loopDuration: getKnobValue('loop-duration-knob'),

    // Modulation
    pitchLfoRate: getKnobValue('pitch-lfo-rate-knob'),
    pitchLfoDepth: getKnobValue('pitch-lfo-depth-knob'),
    gainLfoRate: getKnobValue('gain-lfo-rate-knob'),
    gainLfoDepth: getKnobValue('gain-lfo-depth-knob'),

    // Performance
    glide: getKnobValue('glide-knob'),
    tempo: getKnobValue('tempo-knob'),

    // Toggles
    midiEnabled: getToggleState('midi-toggle'),
    loopLocked: getToggleState('loop-lock-toggle'),
    pitchEnabled: getToggleState('pitch-toggle'),
  };
}

// Helper functions
function getKnobValue(selector: string): number {
  const element = document.querySelector(selector) as any;
  if (element?.getValue) return element.getValue();
  if (element?.value !== undefined) return element.value;
  return 0;
}

function getToggleState(selector: string): boolean {
  const element = document.querySelector(selector) as any;
  if (element?.active !== undefined) return element.active;
  if (element?.checked !== undefined) return element.checked;
  return element?.getAttribute('active') !== null;
}
