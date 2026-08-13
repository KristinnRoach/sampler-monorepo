import type { SamplePlayer } from '@repo/audiolib';
import type { KnobElement } from '@repo/audiolib/components';
import { inputController, type ControlChangeEvent } from '@repo/audiolib/io';

type SamplePlayerAccessor = () => SamplePlayer | null | undefined;
export type MidiInputChannel = number | 'all';

type KnobMapping = {
  cc: number;
  selector: string;
  name: string;
};

type SetupOptions = {
  getSamplePlayer: SamplePlayerAccessor;
  onStateChange?: (enabled: boolean) => void;
  inputChannel?: MidiInputChannel;
  knobMappings?: KnobMapping[];
  midiLearnEnabled?: boolean;
};

// State management
let midiNoteUnsub: (() => void) | null = null;
let midiSustainUnsub: (() => void) | null = null;
let knobControlUnsubs: (() => void)[] = [];
let enabled = false;
let stateChangeCallback: ((enabled: boolean) => void) | undefined;
let samplePlayerAccessor: SamplePlayerAccessor | null = null;

// MIDI Learn state
let midiLearnActive = false;
let knobsToLearn: KnobElement[] = [];
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
// Deferred knob setup, cancelled if MIDI is disabled before it runs
let knobSetupTimeout: ReturnType<typeof setTimeout> | null = null;
// Removes every knob MIDI-learn listener in one call on teardown
let midiLearnKnobListeners: AbortController | null = null;

// Track unsubscribe functions by CC number
let ccUnsubscribes: Map<number, () => void> = new Map();

let midiInputChannel: MidiInputChannel = 'all';

const clearKnobHighlights = () =>
  document
    .querySelectorAll('.midi-learn-highlight')
    .forEach((el) => el.classList.remove('midi-learn-highlight'));

const stopKnobDragDuringMidiLearn = (event: Event) => {
  if (!midiLearnActive) return;
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest('knob-element')) return;

  event.stopPropagation();
};

const bindNoteAndSustainTargets = () => {
  if (!samplePlayerAccessor) return;

  midiNoteUnsub?.();
  midiSustainUnsub?.();

  const getSamplePlayer = samplePlayerAccessor;

  midiNoteUnsub = inputController.registerNoteTarget(
    {
      play: (note: number, velocity?: number) => {
        const player = getSamplePlayer();
        if (!player) return;
        player.play(note, Math.max(0, Math.min(127, velocity ?? 0)));
      },
      release: (note: number) => {
        const player = getSamplePlayer();
        if (player) player.release(note);
      },
    },
    midiInputChannel,
  );

  midiSustainUnsub = inputController.registerSustainPedalTarget(
    {
      setSustainPedal: (pressed: boolean) => {
        const player = getSamplePlayer();
        if (player) player.setSustainPedal(pressed);
      },
    },
    midiInputChannel,
  );
};

// ============================================================================
// MIDI Learn Helper Functions (UI-specific, stays in app)
// ============================================================================

function handleMidiLearnControlChange(event: ControlChangeEvent): void {
  const ccNumber = event.controller;
  const midiValue = event.midiValue;

  // MIDI learn mode: map incoming CC to the selected knob(s)
  if (midiLearnActive && knobsToLearn.length > 0 && midiValue > 0) {
    const knobNames = knobsToLearn
      .map((knob) => knob.title || 'knob')
      .join(', ');

    console.log(`MIDI Learn: Mapped CC${ccNumber} to ${knobNames}`);

    // If CC already mapped, unsubscribe the old mapping
    const existingUnsub = ccUnsubscribes.get(ccNumber);
    if (existingUnsub) {
      existingUnsub();
    }

    // Register the new knobs
    const unsub = inputController.registerControlTarget(knobsToLearn, {
      controller: ccNumber,
    });

    // Track this unsubscribe function by CC number
    ccUnsubscribes.set(ccNumber, unsub);
    knobControlUnsubs.push(unsub);

    // Dispatch custom event for the notification system
    document.dispatchEvent(
      new CustomEvent('midi:mapping', {
        detail: {
          message: `MIDI CC${ccNumber} mapped to ${knobNames}`,
        },
      }),
    );

    // Reset the knob selection but keep MIDI learn mode active
    knobsToLearn = [];

    // Visual feedback: remove highlight from all knobs
    clearKnobHighlights();

    // Update status message to indicate user can select another knob
    updateMidiLearnStatus(true);
  }
}

function toggleMidiLearn(): void {
  midiLearnActive = !midiLearnActive;

  if (!midiLearnActive) {
    // Cancel learn mode
    knobsToLearn = [];

    clearKnobHighlights();
    document.body.classList.remove('midi-learn-active');
    updateMidiLearnStatus(false);
    console.log('MIDI Learn mode deactivated');

    // Dispatch custom event for notification
    document.dispatchEvent(
      new CustomEvent('midi:learn', {
        detail: { message: 'MIDI Learn mode deactivated' },
      }),
    );
  } else {
    document.body.classList.add('midi-learn-active');
    updateMidiLearnStatus(true);
    console.log(
      'MIDI Learn mode activated: Click on a knob to select it (hold Shift for multiple)',
    );

    // Dispatch custom event for notification
    document.dispatchEvent(
      new CustomEvent('midi:learn', {
        detail: {
          message:
            'MIDI Learn mode activated - Click on a knob (hold Shift for multiple)',
        },
      }),
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
      knob.classList.remove('midi-learn-highlight');
    } else {
      // Otherwise add to selection
      knobsToLearn.push(knob);
      knob.classList.add('midi-learn-highlight');
    }
  } else {
    // Without shift key, replace the selection
    clearKnobHighlights();
    knobsToLearn = [knob];
    knob.classList.add('midi-learn-highlight');
  }

  // Update status message
  updateMidiLearnStatus(true);

  const count = knobsToLearn.length;
  console.log(
    `MIDI Learn active: ${count} knob${count !== 1 ? 's' : ''} selected. Move a controller knob to map it.`,
  );
}

// ============================================================================
// Public API
// ============================================================================

export async function enableSamplePlayerMidi(
  options: SetupOptions,
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
  midiInputChannel = options.inputChannel || 'all';
  bindNoteAndSustainTargets();

  // Set up default mappings and MIDI Learn listeners after knobs render
  if (options.knobMappings || options.midiLearnEnabled) {
    knobSetupTimeout = setTimeout(() => {
      knobSetupTimeout = null;

      options.knobMappings?.forEach(({ cc, selector, name }) => {
        const element = document.querySelector(selector);
        const knobElement = element?.querySelector(
          'knob-element',
        ) as KnobElement;

        if (knobElement) {
          const unsub = inputController.registerControlTarget(knobElement, {
            controller: cc,
          });

          knobControlUnsubs.push(unsub);
          ccUnsubscribes.set(cc, unsub);
          console.log(`Mapped CC${cc} to ${name}`);
        }
      });

      // Add MIDI learn click handlers to all knobs if enabled
      if (options.midiLearnEnabled) {
        const controller = new AbortController();
        midiLearnKnobListeners = controller;
        document.addEventListener('mousedown', stopKnobDragDuringMidiLearn, {
          capture: true,
          signal: controller.signal,
        });
        document.addEventListener('touchstart', stopKnobDragDuringMidiLearn, {
          capture: true,
          signal: controller.signal,
        });
        document.querySelectorAll('knob-element').forEach((knob) => {
          knob.addEventListener(
            'click',
            ((e: MouseEvent) => {
              // Only activate if MIDI learn mode is active
              if (midiLearnActive) {
                const isShiftKey = e.shiftKey;
                startMidiLearnForKnob(knob as KnobElement, isShiftKey);
                e.stopPropagation();
              }
            }) as EventListener,
            { signal: controller.signal },
          );
        });
      }
    }, 500); // Small delay to ensure knobs are ready
  }

  // Set up MIDI learn for incoming CC messages
  if (options.midiLearnEnabled) {
    const learnUnsub = inputController.onControlChange(
      handleMidiLearnControlChange,
    );
    knobControlUnsubs.push(learnUnsub);

    // Set up keyboard shortcut for MIDI learn (Command+Shift+M)
    keydownHandler = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if ((e.key === 'M' || e.key === 'm') && e.shiftKey && e.metaKey) {
        e.preventDefault();
        toggleMidiLearn();
      }
      else if (e.key === 'Escape' && midiLearnActive) {
       toggleMidiLearn();
      }
    };
    document.addEventListener('keydown', keydownHandler);
  }

  enabled = true;
  stateChangeCallback = options.onStateChange;
  stateChangeCallback?.(true);

  console.log('enableSamplePlayerMidi() -> MIDI enabled');

  return true;
}

export function disableSamplePlayerMidi(): void {
  if (!enabled) {
    return;
  }

  // Clean up note handling
  midiNoteUnsub?.();
  midiNoteUnsub = null;

  // Clean up sustain pedal
  midiSustainUnsub?.();
  midiSustainUnsub = null;

  // if (sustainPedalActive && samplePlayerAccessor) {
  //   const player = samplePlayerAccessor();
  //   player?.sustainPedalOff();
  // }

  // Cancel pending knob setup so it can't register targets after teardown
  if (knobSetupTimeout !== null) {
    clearTimeout(knobSetupTimeout);
    knobSetupTimeout = null;
  }

  // Clean up knob MIDI resources
  knobControlUnsubs.forEach((unsub) => unsub());
  knobControlUnsubs = [];

  midiLearnKnobListeners?.abort();
  midiLearnKnobListeners = null;

  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }

  // Cancel MIDI learn mode
  midiLearnActive = false;
  knobsToLearn = [];

  clearKnobHighlights();

  // Remove status indicator
  const statusEl = document.querySelector('.midi-learn-status');
  if (statusEl) {
    statusEl.remove();
  }

  document.body.classList.remove('midi-learn-active');
  ccUnsubscribes.clear();

  console.log('MIDI disabled and cleaned up');

  samplePlayerAccessor = null;
  enabled = false;

  stateChangeCallback?.(false);
  stateChangeCallback = undefined;
}

export function setSamplePlayerMidiInputChannel(
  channel: MidiInputChannel,
): void {
  if (channel === midiInputChannel) return;

  midiInputChannel = channel;
  if (!enabled) return;

  const player = samplePlayerAccessor?.();
  player?.setSustainPedal(false);
  player?.releaseAll();
  bindNoteAndSustainTargets();
}
