// src/midi/KnobMidiController.ts

import { KnobElement } from '@repo/audio-components';

export class KnobMidiController {
  #midiAccess: MIDIAccess | null = null;
  #initialized: boolean = false;
  #ccMappings: Map<number, KnobElement[]> = new Map();
  #midiLearnActive: boolean = false;
  #knobsToLearn: KnobElement[] = [];

  async initialize(): Promise<boolean> {
    if (this.#initialized) return true;

    try {
      this.#midiAccess = await navigator.requestMIDIAccess();

      const inputs = this.#midiAccess.inputs.values();
      for (const input of inputs) {
        input.onmidimessage = this.#handleMidiMessage.bind(this);
        console.log(`UI MIDI input connected: ${input.name}`);
      }

      document.addEventListener('keydown', (e) => {
        if (e.repeat) return;

        if (e.key === 'ˇ' && e.shiftKey && e.altKey) {
          e.preventDefault();
          this.toggleMidiLearn();
        }
      });

      this.#initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize UI MIDI:', error);
      return false;
    }
  }

  #handleMidiMessage(event: MIDIMessageEvent): void {
    if (!this.#initialized) return;
    if (!event || !event.data) return;

    const [status, ccNumber, value] = event.data;
    const command = status & 0xf0;

    // Only handle Control Change messages (0xB0)
    if (command !== 0xb0) return;

    // MIDI learn mode: map incoming CC to the selected knob(s)
    if (this.#midiLearnActive && this.#knobsToLearn.length > 0 && value > 0) {
      const knobNames = this.#knobsToLearn
        .map((knob) => knob.title || 'knob')
        .join(', ');

      console.log(`MIDI Learn: Mapped CC${ccNumber} to ${knobNames}`);
      this.mapCCToKnob(ccNumber, this.#knobsToLearn);

      // Create a temporary mapping success message
      const statusEl = document.querySelector('.midi-learn-status');
      if (statusEl) {
        const knobCount = this.#knobsToLearn.length;
        const message =
          knobCount > 1
            ? `Mapped CC${ccNumber} to ${knobCount} knobs`
            : `Mapped CC${ccNumber} to ${this.#knobsToLearn[0].title || 'knob'}`;

        statusEl.textContent = message;

        // Briefly show the mapping message, then revert to the MIDI learn status
        setTimeout(() => {
          statusEl.textContent = 'MIDI Learn: Click on a knob';
        }, 1500);
      }

      // Dispatch custom event for the notification system
      document.dispatchEvent(
        new CustomEvent('midi:mapping', {
          detail: {
            message: `MIDI CC${ccNumber} mapped to ${knobNames}`,
          },
        })
      );

      // Reset the knob selection but keep MIDI learn mode active
      this.#knobsToLearn = [];

      // Visual feedback: remove highlight from all knobs
      document.querySelectorAll('.midi-learn-highlight').forEach((el) => {
        el.classList.remove('midi-learn-highlight');
      });

      // Update status message to indicate user can select another knob
      this.#updateMidiLearnStatus(true);

      return;
    }

    // Normal mode: use mapped CCs to control knobs
    const knobs = this.#ccMappings.get(ccNumber);
    if (knobs && knobs.length > 0) {
      const normalizedValue = Math.max(0, Math.min(1, value / 127));
      // Apply to all mapped knobs
      knobs.forEach((knob) => {
        knob.setValueNormalized(normalizedValue);
      });
    }
  }

  // Start MIDI learn for a specific knob
  startMidiLearnForKnob(knob: KnobElement, isShiftKey = false): void {
    this.#midiLearnActive = true;

    if (isShiftKey && this.#knobsToLearn.length > 0) {
      // With shift key, add to existing selection if not already selected
      const alreadySelected = this.#knobsToLearn.includes(knob);

      if (alreadySelected) {
        // If already selected, remove it (toggle behavior)
        this.#knobsToLearn = this.#knobsToLearn.filter((k) => k !== knob);
        (knob as unknown as HTMLElement).classList.remove(
          'midi-learn-highlight'
        );
      } else {
        // Otherwise add to selection
        this.#knobsToLearn.push(knob);
        (knob as unknown as HTMLElement).classList.add('midi-learn-highlight');
      }
    } else {
      // Without shift key, replace the selection

      // Reset any previous selection
      document.querySelectorAll('.midi-learn-highlight').forEach((el) => {
        el.classList.remove('midi-learn-highlight');
      });

      // Start a new selection
      this.#knobsToLearn = [knob];

      // Highlight the current knob
      const knobElement = knob as unknown as HTMLElement;
      knobElement.classList.add('midi-learn-highlight');
    }

    // Update status message
    this.#updateMidiLearnStatus(true);

    const count = this.#knobsToLearn.length;
    console.log(
      `MIDI Learn active: ${count} knob${count !== 1 ? 's' : ''} selected. Move a controller knob to map it.`
    );
  }

  // Toggle MIDI learn mode
  toggleMidiLearn(): void {
    this.#midiLearnActive = !this.#midiLearnActive;

    if (!this.#midiLearnActive) {
      // Cancel learn mode
      this.#knobsToLearn = [];

      // Remove highlight from all knobs
      document.querySelectorAll('.midi-learn-highlight').forEach((el) => {
        el.classList.remove('midi-learn-highlight');
      });
      document.body.classList.remove('midi-learn-active');
      this.#updateMidiLearnStatus(false);
      console.log('MIDI Learn mode deactivated');

      // Dispatch custom event for notification
      document.dispatchEvent(
        new CustomEvent('midi:learn', {
          detail: { message: 'MIDI Learn mode deactivated' },
        })
      );
    } else {
      document.body.classList.add('midi-learn-active');
      this.#updateMidiLearnStatus(true);
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

  // Update MIDI learn status indicator
  #updateMidiLearnStatus(active: boolean): void {
    // Create or update status indicator
    let statusEl = document.querySelector('.midi-learn-status');

    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'midi-learn-status';
      document.body.appendChild(statusEl);
    }

    if (active) {
      const count = this.#knobsToLearn.length;
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

  // Map a CC number to one or more knob elements
  mapCCToKnob(ccNumber: number, knobs: KnobElement | KnobElement[]): void {
    // Convert single knob to array if needed
    const knobsArray = Array.isArray(knobs) ? knobs : [knobs];

    // Set the mapping
    this.#ccMappings.set(ccNumber, knobsArray);

    const count = knobsArray.length;
    console.log(
      `Mapped CC${ccNumber} to ${count} knob${count !== 1 ? 's' : ''}`
    );
  }

  // Remove a mapping
  unmapCC(ccNumber: number): void {
    this.#ccMappings.delete(ccNumber);
  }

  // Get knobs mapped to a specific CC
  getKnobsForCC(ccNumber: number): KnobElement[] | undefined {
    return this.#ccMappings.get(ccNumber);
  }

  get isInitialized() {
    return this.#initialized;
  }

  get midiLearnActive() {
    return this.#midiLearnActive;
  }
}
