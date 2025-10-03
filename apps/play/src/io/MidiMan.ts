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

// State management
let midiNoteUnsub: (() => void) | null = null;
let midiSustainUnsub: (() => void) | null = null;
let knobControlUnsubs: (() => void)[] = [];
let enabled = false;
let stateChangeCallback: ((enabled: boolean) => void) | undefined;
let samplePlayerAccessor: SamplePlayerAccessor | null = null;

// let sustainPedalActive = false;

// MIDI Learn state
let midiLearnActive = false;
let knobsToLearn: KnobElement[] = [];
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

// CC to knob mapping for MIDI learn
let ccMappings: Map<number, KnobElement[]> = new Map();
// Track unsubscribe functions by CC number
let ccUnsubscribes: Map<number, () => void> = new Map();

const defaultVelocityTransform = (event: NoteEvent): number => {
  const velocity = typeof event.velocity === 'number' ? event.velocity : 0;
  return Math.max(0, Math.min(127, velocity));
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

    // Store new mapping
    ccMappings.set(ccNumber, [...knobsToLearn]);

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
  }
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

// ============================================================================
// Public API
// ============================================================================

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

  // Register note handling using the package's registerNoteTarget
  const noteUnsub = inputController.registerNoteTarget({
    play: (note: number, velocity?: number) => {
      const player = getSamplePlayer();
      if (!player) return;
      const vel =
        velocity !== undefined
          ? transformVelocity({ note, velocity } as NoteEvent)
          : 0;
      player.play(note, vel);
    },
    release: (note: number) => {
      const player = getSamplePlayer();
      if (!player) return;
      player.release(note);
    },
  });
  midiNoteUnsub = noteUnsub;

  // Register sustain pedal (CC 64) using the package's registerControlTarget
  // sustainPedalActive = false;
  // const sustainUnsub = inputController.registerControlTarget(
  //   {
  //     onControlChange: (value: number, event: ControlChangeEvent) => {
  //       const player = getSamplePlayer();
  //       if (!player) return;

  //       const pressed = value >= 0.5; // 64/127 ≈ 0.5
  //       if (pressed === sustainPedalActive) return;

  //       sustainPedalActive = pressed;

  //       if (pressed) {
  //         player.sustainPedalOn();
  //       } else {
  //         player.sustainPedalOff();
  //       }
  //     },
  //   },
  //   { controller: 64 }
  // );

  const sustainUnsub = inputController.registerSustainPedalTarget({
    setSustainPedal: (pressed: boolean) => {
      const player = getSamplePlayer();
      if (!player) return;
      player.setSustainPedal(pressed);
    },
  });

  midiSustainUnsub = sustainUnsub;

  // Initialize knob MIDI if requested
  if (options.enableKnobMidi) {
    // Set up default / initial knob mappings
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
            const unsub = inputController.registerControlTarget(knobElement, {
              controller: cc,
            });

            knobControlUnsubs.push(unsub);
            ccMappings.set(cc, [knobElement]);
            ccUnsubscribes.set(cc, unsub);
            console.log(`Mapped CC${cc} to ${name}`);
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

    // Set up MIDI learn for incoming CC messages
    if (options.midiLearnEnabled) {
      const learnUnsub = inputController.onControlChange(
        handleMidiLearnControlChange
      );
      knobControlUnsubs.push(learnUnsub);

      // Set up keyboard shortcut for MIDI learn (Command+Shift+M)
      keydownHandler = (e: KeyboardEvent) => {
        if (e.repeat) return;

        if ((e.key === 'M' || e.key === 'm') && e.shiftKey && e.metaKey) {
          e.preventDefault();
          toggleMidiLearn();
        }
      };
      document.addEventListener('keydown', keydownHandler);
    }
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

  // Clean up knob MIDI resources
  knobControlUnsubs.forEach((unsub) => unsub());
  knobControlUnsubs = [];

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
  ccUnsubscribes.clear();

  console.log('MIDI disabled and cleaned up');

  // sustainPedalActive = false;
  samplePlayerAccessor = null;
  enabled = false;

  stateChangeCallback?.(false);
  stateChangeCallback = undefined;
}

export function isSamplePlayerMidiEnabled(): boolean {
  return enabled;
}
