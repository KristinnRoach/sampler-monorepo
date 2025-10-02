import type { SamplePlayer, KnobElement } from '@repo/audio-components';
import {
  inputController,
  type NoteEvent,
  type ControlChangeEvent,
} from '@repo/input-controller';

type SamplePlayerAccessor = () => SamplePlayer | null | undefined;

type KnobMapping = {
  cc: number;
  selector: string;
  name: string;
};

type SetupOptions = {
  getSamplePlayer: SamplePlayerAccessor;
  onStateChange?: (enabled: boolean) => void;
  velocityTransform?: (event: NoteEvent) => number;
  enableKnobMidi?: boolean;
  knobMappings?: KnobMapping[];
  midiLearnEnabled?: boolean;
};

let midiNoteOnUnsub: (() => void) | null = null;
let midiNoteOffUnsub: (() => void) | null = null;
let midiControlChangeUnsub: (() => void) | null = null;
let enabled = false;
let stateChangeCallback: ((enabled: boolean) => void) | undefined;
let samplePlayerAccessor: SamplePlayerAccessor | null = null;
let sustainPedalActive = false;

// Knob MIDI variables
let knobMidiEnabled = false;
let knobControlChangeUnsub: (() => void) | null = null;
let ccMappings: Map<number, KnobElement[]> = new Map();
let midiLearnActive = false;
let knobsToLearn: KnobElement[] = [];
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

const defaultVelocityTransform = (event: NoteEvent): number => {
  const velocity = typeof event.velocity === 'number' ? event.velocity : 0;
  return Math.max(0, Math.min(127, velocity));
};

// Knob MIDI helper functions
function handleKnobControlChange(event: ControlChangeEvent): void {
  const ccNumber = event.controller;
  const value = event.value;

  // MIDI learn mode: map incoming CC to the selected knob(s)
  if (midiLearnActive && knobsToLearn.length > 0 && value > 0) {
    const knobNames = knobsToLearn
      .map((knob) => knob.title || 'knob')
      .join(', ');

    console.log(`MIDI Learn: Mapped CC${ccNumber} to ${knobNames}`);
    mapCCToKnob(ccNumber, knobsToLearn);

    // Dispatch custom event for the notification system
    document.dispatchEvent(
      new CustomEvent('midi:mapping', {
        detail: {
          message: `MIDI CC${ccNumber} mapped to ${knobNames}`,
        },
      })
    );

    // Reset the knob selection but keep MIDI learn mode active
    knobsToLearn = [];

    // Visual feedback: remove highlight from all knobs
    document.querySelectorAll('.midi-learn-highlight').forEach((el) => {
      el.classList.remove('midi-learn-highlight');
    });

    // Update status message to indicate user can select another knob
    updateMidiLearnStatus(true);

    return;
  }

  // Normal mode: use mapped CCs to control knobs
  const knobs = ccMappings.get(ccNumber);
  if (knobs && knobs.length > 0) {
    // Value is already normalized (0-1) by the input-controller
    const normalizedValue = Math.max(0, Math.min(1, value));
    // Apply to all mapped knobs
    knobs.forEach((knob) => {
      knob.setValueNormalized(normalizedValue);
    });
  }
}

function mapCCToKnob(
  ccNumber: number,
  knobs: KnobElement | KnobElement[]
): void {
  const knobsArray = Array.isArray(knobs) ? knobs : [knobs];
  ccMappings.set(ccNumber, knobsArray);

  const count = knobsArray.length;
  console.log(`Mapped CC${ccNumber} to ${count} knob${count !== 1 ? 's' : ''}`);
}

function toggleMidiLearn(): void {
  midiLearnActive = !midiLearnActive;

  if (!midiLearnActive) {
    // Cancel learn mode
    knobsToLearn = [];

    // Remove highlight from all knobs
    document.querySelectorAll('.midi-learn-highlight').forEach((el) => {
      el.classList.remove('midi-learn-highlight');
    });
    document.body.classList.remove('midi-learn-active');
    updateMidiLearnStatus(false);
    console.log('MIDI Learn mode deactivated');

    // Dispatch custom event for notification
    document.dispatchEvent(
      new CustomEvent('midi:learn', {
        detail: { message: 'MIDI Learn mode deactivated' },
      })
    );
  } else {
    document.body.classList.add('midi-learn-active');
    updateMidiLearnStatus(true);
    console.log(
      'MIDI Learn mode activated: Click on a knob to select it (hold Shift for multiple)'
    );

    // Dispatch custom event for notification
    document.dispatchEvent(
      new CustomEvent('midi:learn', {
        detail: {
          message:
            'MIDI Learn mode activated - Click on a knob (hold Shift for multiple)',
        },
      })
    );
  }
}

function updateMidiLearnStatus(active: boolean): void {
  let statusEl = document.querySelector('.midi-learn-status');

  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.className = 'midi-learn-status';
    document.body.appendChild(statusEl);
  }

  if (active) {
    const count = knobsToLearn.length;
    if (count > 0) {
      statusEl.textContent =
        count > 1
          ? `MIDI Learn: ${count} knobs selected. Move a controller to map.`
          : 'MIDI Learn: Move a controller knob to map';
    } else {
      statusEl.textContent =
        'MIDI Learn: Click on a knob to select (Shift+click for multiple)';
    }
    statusEl.classList.add('active');
    statusEl.classList.remove('inactive');
  } else {
    statusEl.classList.add('inactive');
    statusEl.classList.remove('active');
  }
}

function startMidiLearnForKnob(knob: KnobElement, isShiftKey = false): void {
  midiLearnActive = true;

  if (isShiftKey && knobsToLearn.length > 0) {
    // With shift key, add to existing selection if not already selected
    const alreadySelected = knobsToLearn.includes(knob);

    if (alreadySelected) {
      // If already selected, remove it (toggle behavior)
      knobsToLearn = knobsToLearn.filter((k) => k !== knob);
      (knob as unknown as HTMLElement).classList.remove('midi-learn-highlight');
    } else {
      // Otherwise add to selection
      knobsToLearn.push(knob);
      (knob as unknown as HTMLElement).classList.add('midi-learn-highlight');
    }
  } else {
    // Without shift key, replace the selection

    // Reset any previous selection
    document.querySelectorAll('.midi-learn-highlight').forEach((el) => {
      el.classList.remove('midi-learn-highlight');
    });

    // Start a new selection
    knobsToLearn = [knob];

    // Highlight the current knob
    const knobElement = knob as unknown as HTMLElement;
    knobElement.classList.add('midi-learn-highlight');
  }

  // Update status message
  updateMidiLearnStatus(true);

  const count = knobsToLearn.length;
  console.log(
    `MIDI Learn active: ${count} knob${count !== 1 ? 's' : ''} selected. Move a controller knob to map it.`
  );
}

export async function enableSamplePlayerMidi(
  options: SetupOptions
): Promise<boolean> {
  if (enabled) {
    return true;
  }

  const initialized = await inputController.init();
  if (!initialized) {
    return false;
  }

  const getSamplePlayer = options.getSamplePlayer;
  samplePlayerAccessor = getSamplePlayer;
  const transformVelocity =
    options.velocityTransform || defaultVelocityTransform;

  midiNoteOnUnsub = inputController.onNoteOn((event: NoteEvent) => {
    const player = getSamplePlayer();
    if (!player) return;

    const velocity = transformVelocity(event);
    player.play(event.note, velocity);
  });

  midiNoteOffUnsub = inputController.onNoteOff((event: NoteEvent) => {
    const player = getSamplePlayer();
    if (!player) return;

    player.release(event.note);
  });

  sustainPedalActive = false;

  midiControlChangeUnsub = inputController.onControlChange(
    (event: ControlChangeEvent) => {
      if (event.controller !== 64) return;

      const player = getSamplePlayer();
      if (!player) return;

      const pressed = event.value >= 64;
      if (pressed === sustainPedalActive) return;

      sustainPedalActive = pressed;

      if (pressed) {
        player.sustainPedalOn();
      } else {
        player.sustainPedalOff();
      }
    }
  );

  // Initialize knob MIDI if requested
  if (options.enableKnobMidi) {
    knobMidiEnabled = true;

    // Subscribe to control change events for knob control
    knobControlChangeUnsub = inputController.onControlChange(
      handleKnobControlChange
    );

    // Set up keyboard shortcut for MIDI learn
    if (options.midiLearnEnabled) {
      keydownHandler = (e: KeyboardEvent) => {
        if (e.repeat) return;

        if (e.key === 'ˇ' && e.shiftKey && e.altKey) {
          e.preventDefault();
          toggleMidiLearn();
        }
      };
      document.addEventListener('keydown', keydownHandler);
    }

    // Set up default knob mappings
    if (options.knobMappings) {
      setTimeout(() => {
        options.knobMappings!.forEach(({ cc, selector, name }) => {
          const element = document.querySelector(
            `${selector}[target-node-id="test-sampler"]`
          );
          const knobElement = element?.querySelector(
            'knob-element'
          ) as KnobElement;
          if (knobElement) {
            mapCCToKnob(cc, knobElement);
          }
        });

        // Add MIDI learn click handlers to all knobs if enabled
        if (options.midiLearnEnabled) {
          document.querySelectorAll('knob-element').forEach((knob) => {
            knob.addEventListener('click', ((e: MouseEvent) => {
              // Only activate if MIDI learn mode is active
              if (midiLearnActive) {
                const isShiftKey = e.shiftKey;
                startMidiLearnForKnob(knob as KnobElement, isShiftKey);
                e.stopPropagation();
              }
            }) as EventListener);
          });
        }
      }, 500); // Small delay to ensure knobs are ready
    }

    console.log('Knob MIDI initialized using centralized input controller');
  }

  enabled = true;
  stateChangeCallback = options.onStateChange;
  stateChangeCallback?.(true);

  return true;
}

export function disableSamplePlayerMidi(): void {
  if (!enabled) {
    return;
  }

  midiNoteOnUnsub?.();
  midiNoteOffUnsub?.();
  midiControlChangeUnsub?.();
  midiNoteOnUnsub = null;
  midiNoteOffUnsub = null;
  midiControlChangeUnsub = null;

  if (sustainPedalActive && samplePlayerAccessor) {
    const player = samplePlayerAccessor();
    player?.sustainPedalOff();
  }

  // Clean up knob MIDI resources
  if (knobMidiEnabled) {
    knobControlChangeUnsub?.();
    knobControlChangeUnsub = null;

    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }

    // Cancel MIDI learn mode
    midiLearnActive = false;
    knobsToLearn = [];

    // Remove highlight from all knobs
    document.querySelectorAll('.midi-learn-highlight').forEach((el) => {
      el.classList.remove('midi-learn-highlight');
    });

    // Remove status indicator
    const statusEl = document.querySelector('.midi-learn-status');
    if (statusEl) {
      statusEl.remove();
    }

    document.body.classList.remove('midi-learn-active');
    ccMappings.clear();
    knobMidiEnabled = false;

    console.log('Knob MIDI disabled and cleaned up');
  }

  sustainPedalActive = false;
  samplePlayerAccessor = null;
  enabled = false;

  stateChangeCallback?.(false);
  stateChangeCallback = undefined;
}

export function isSamplePlayerMidiEnabled(): boolean {
  return enabled;
}
