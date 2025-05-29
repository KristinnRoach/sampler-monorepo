import { BaseAudioElement } from './base/BaseAudioElement';
import { audiolib, SamplePlayer } from '@repo/audiolib';

/**
 * Web component for a sample player instrument
 * Wraps the SamplePlayer class from audiolib
 */
export class SamplerElement extends BaseAudioElement {
  protected samplePlayer: SamplePlayer | null = null;
  private envelopeElement: HTMLElement | null = null;
  private loopControlElement: HTMLElement | null = null;
  private offsetControlElement: HTMLElement | null = null;

  private attributeHandlers: Record<string, (value: string) => void> = {
    'start-offset': (value) => this.setStartOffset(parseFloat(value)),
    'end-offset': (value) => this.setEndOffset(parseFloat(value)),
  };

  // Define observed attributes
  static get observedAttributes(): string[] {
    return [
      'polyphony',
      // Attack and release are handled by EnvelopeElement // ? should still be observed ?
      'start-offset',
      'end-offset',
      'loop-start',
      'loop-end',

      'hold-locked',
      'loop-locked',
      'keyboard-enabled',
      'midi-enabled',
    ];
  }

  constructor() {
    super('sample-player');

    document.addEventListener('sample-loaded', this.onSampleLoaded.bind(this));

    this.innerHTML = `
      <div class="sampler-element">
        <div class="parameters">
          <label>
            <input type="checkbox" id="keyboard-enabled" checked> Keyboard
            </br>            
          </label>
          <label>
            <input type="checkbox" id="midi-enabled"> Midi
          </label>
            </br>    
          <label>
            <input type="checkbox" id="hold-locked"> &#128274 Hold
            </br>
          </label>
          <label>
            <input type="checkbox" id="loop-locked"> &#128274 Loop
            </br>
          </label>        
        </div>
        <slot></slot>
      </div> 
    `;
  }

  private onSampleLoaded(event: Event) {
    const customEvent = event as CustomEvent;
    // Only process events targeted at this sampler
    if (customEvent.detail.targetId === this.elementId) {
      this.handleSampleLoaded(customEvent.detail);
    }
  }

  private handleSampleLoaded(detail: any) {
    const { audioBuffer, fileName, duration } = detail;

    // Load sample into the player
    this.samplePlayer?.loadSample(audioBuffer);

    this.updateStatus(`Sample loaded: ${fileName}`);

    console.log(
      `Sampler ${this.id} loaded sample: ${fileName}, duration: ${duration}`
    );
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback(): void {
    // Set up the rest of the event listeners (loop, offset sliders, checkboxes)
    const holdLockCheckbox = this.querySelector(
      '#hold-locked'
    ) as HTMLInputElement;
    const loopLockCheckbox = this.querySelector(
      '#loop-locked'
    ) as HTMLInputElement;
    const keyboardCheckbox = this.querySelector(
      '#keyboard-enabled'
    ) as HTMLInputElement;
    const midiCheckbox = this.querySelector(
      '#midi-enabled'
    ) as HTMLInputElement;

    if (holdLockCheckbox) {
      holdLockCheckbox.addEventListener('change', () => {
        this.setAttributeEnabled('hold-locked', holdLockCheckbox.checked);
      });
    }

    if (loopLockCheckbox) {
      loopLockCheckbox.addEventListener('change', () => {
        this.setAttributeEnabled('loop-locked', loopLockCheckbox.checked);
      });
    }

    if (keyboardCheckbox) {
      keyboardCheckbox.addEventListener('change', () => {
        this.setAttributeEnabled('keyboard-enabled', keyboardCheckbox.checked);
      });
    }

    if (midiCheckbox) {
      midiCheckbox.addEventListener('change', () => {
        this.setAttributeEnabled('midi-enabled', midiCheckbox.checked);
      });
    }

    this.initialize();
  }

  /**
   * Called when an observed attribute changes
   */
  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (oldValue === newValue || !this.samplePlayer) return;

    const handler = this.attributeHandlers[name];
    if (handler) {
      handler(newValue);
    }
  }

  /**
   * Initialize the sampler
   */
  async initialize(): Promise<void> {
    try {
      // Initialize the audiolib context // todo: remove dependency on audiolib
      if (!audiolib.isReady) await audiolib.init();

      // Get polyphony from attribute or use default
      const polyphony = parseInt(this.getAttribute('polyphony') || '16');

      // Create sampler // todo: only import standalone createSamplePlayer factory
      this.samplePlayer = audiolib.createSamplePlayer(undefined, polyphony);

      if (this.samplePlayer) {
        // Set up audio nodes
        this.outputNode = this.samplePlayer.out;
        this.audioContext = this.samplePlayer.audioContext;
        this.initialized = true;

        // Auto enable keyboard by default
        this.setAttributeEnabled(
          'keyboard-enabled',
          this.getAttribute('keyboard-enabled') !== 'false'
        );

        // Update UI
        this.updateStatus('Initialized');

        // Dispatch event
        this.dispatchEvent(
          new CustomEvent('sampleplayer-initialized', {
            bubbles: true,
            detail: { sampler: this.samplePlayer },
          })
        );

        // Get initial envelope values from the envelope element if available
        if (this.envelopeElement) {
          // Register callbacks with the envelope element
          (this.envelopeElement as any).registerCallbacks({
            onAttack: (value: number) => {
              if (this.samplePlayer) {
                this.samplePlayer.setAttackTime(value);
              }
            },
            onRelease: (value: number) => {
              if (this.samplePlayer) {
                this.samplePlayer.setReleaseTime(value);
              }
            },
          });

          // Initialize with values from the envelope element
          const attack = (this.envelopeElement as any).getAttack();
          const release = (this.envelopeElement as any).getRelease();

          if (this.samplePlayer) {
            this.samplePlayer.setAttackTime(attack);
            this.samplePlayer.setReleaseTime(release);
          }
        }

        // Get initial loop values from the loop control element if available
        if (this.loopControlElement) {
          // Register callbacks with the loop control element
          (this.loopControlElement as any).registerCallbacks({
            onLoopStart: (value: number) => {
              if (this.samplePlayer) {
                this.samplePlayer.setLoopStart(value);
              }
            },
            onLoopEnd: (value: number) => {
              if (this.samplePlayer) {
                this.samplePlayer.setLoopEnd(value);
              }
            },
          });

          // Initialize with values from the loop control element
          const loopStart = (this.loopControlElement as any).getLoopStart();
          const loopEnd = (this.loopControlElement as any).getLoopEnd();

          if (this.samplePlayer) {
            this.samplePlayer.setLoopStart(loopStart);
            this.samplePlayer.setLoopEnd(loopEnd);
          }
        }

        // Get initial offset values from the offset control element if available
        if (this.offsetControlElement) {
          // Register callbacks with the offset control element
          (this.offsetControlElement as any).registerCallbacks({
            onStartOffset: (value: number) => {
              if (this.samplePlayer) {
                this.samplePlayer.setSampleStartOffset(value);
              }
            },
            onEndOffset: (value: number) => {
              if (this.samplePlayer) {
                this.samplePlayer.setSampleEndOffset(value);
              }
            },
          });

          // Initialize with values from the offset control element
          const startOffset = (
            this.offsetControlElement as any
          ).getStartOffset();
          const endOffset = (this.offsetControlElement as any).getEndOffset();

          if (this.samplePlayer) {
            this.samplePlayer.setSampleStartOffset(startOffset);
            this.samplePlayer.setSampleEndOffset(endOffset);
          }
        }

        // Apply initial attributes
        if (this.hasAttribute('loop-start')) {
          this.setLoopStart(parseFloat(this.getAttribute('loop-start') || '0'));
        }

        if (this.hasAttribute('loop-end')) {
          this.setLoopEnd(parseFloat(this.getAttribute('loop-end') || '1'));
        }

        if (this.hasAttribute('hold-locked')) {
          this.setAttributeEnabled(
            'hold-locked',
            this.getAttribute('hold-locked') === 'true'
          );
        }

        if (this.hasAttribute('loop-locked')) {
          this.setAttributeEnabled(
            'loop-locked',
            this.getAttribute('loop-locked') === 'true'
          );
        }

        if (this.hasAttribute('keyboard-enabled')) {
          this.setAttributeEnabled(
            'keyboard-enabled',
            this.getAttribute('keyboard-enabled') === 'true'
          );
        }

        if (this.hasAttribute('midi-enabled')) {
          this.setAttributeEnabled(
            'midi-enabled',
            this.getAttribute('midi-enabled') === 'true'
          );
        }

        if (this.hasAttribute('start-offset')) {
          this.setStartOffset(
            parseFloat(this.getAttribute('start-offset') || '0')
          );
        }

        if (this.hasAttribute('end-offset')) {
          this.setEndOffset(parseFloat(this.getAttribute('end-offset') || '0'));
        }
      }
    } catch (error) {
      console.error('Failed to initialize sampler:', error);
      this.updateStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load a sample into the sampler
   */
  async loadSample(): Promise<void> {
    if (!this.samplePlayer || !this.audioContext) {
      this.updateStatus('Error: Sampler not initialized');
      return;
    }

    try {
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/*';

      fileInput.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (files && files.length > 0) {
          const file = files[0];
          this.updateStatus(`Loading sample: ${file.name}...`);

          try {
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Decode audio data
            const audioBuffer =
              await this.audioContext!.decodeAudioData(arrayBuffer);

            // Load sample into sampler
            await this.samplePlayer!.loadSample(audioBuffer);

            // Update loop sliders with sample duration
            const loopStartSlider = this.querySelector(
              '#loop-start'
            ) as HTMLInputElement;
            const loopEndSlider = this.querySelector(
              '#loop-end'
            ) as HTMLInputElement;

            if (loopStartSlider) {
              loopStartSlider.min = '0';
              loopStartSlider.max = audioBuffer.duration.toString();
              loopStartSlider.value = '0';
              const valueDisplay = this.querySelector('#loop-start-value');
              if (valueDisplay) valueDisplay.textContent = '0.00';
            }

            if (loopEndSlider) {
              loopEndSlider.min = '0';
              loopEndSlider.max = audioBuffer.duration.toString();
              loopEndSlider.value = audioBuffer.duration.toString();
              const valueDisplay = this.querySelector('#loop-end-value');
              if (valueDisplay)
                valueDisplay.textContent = audioBuffer.duration.toFixed(2);
            }

            if (
              this.loopControlElement &&
              typeof (this.loopControlElement as any).updateSampleDuration ===
                'function'
            ) {
              (this.loopControlElement as any).updateSampleDuration(
                audioBuffer.duration
              );
            }

            // Update start and end offset sliders with sample duration
            const startOffsetSlider = this.querySelector(
              '#start-offset'
            ) as HTMLInputElement;
            const endOffsetSlider = this.querySelector(
              '#end-offset'
            ) as HTMLInputElement;

            if (startOffsetSlider) {
              startOffsetSlider.min = '0';
              startOffsetSlider.max = audioBuffer.duration.toString();
              startOffsetSlider.value = '0';
              const valueDisplay = this.querySelector('#start-offset-value');
              if (valueDisplay) valueDisplay.textContent = '0.00';
            }

            if (endOffsetSlider) {
              endOffsetSlider.min = '0';
              endOffsetSlider.max = audioBuffer.duration.toString();
              endOffsetSlider.value = audioBuffer.duration.toString();
              const valueDisplay = this.querySelector('#end-offset-value');
              if (valueDisplay)
                valueDisplay.textContent = audioBuffer.duration.toFixed(2);
            }

            // Set the loop end parameter to the full duration
            this.setLoopEnd(audioBuffer.duration);
            this.setEndOffset(audioBuffer.duration);

            this.updateStatus(`Sample loaded: ${file.name}`);

            // Dispatch event
            this.dispatchEvent(
              new CustomEvent('sample-loaded', {
                bubbles: true,
                detail: {
                  sampler: this.samplePlayer,
                  fileName: file.name,
                  duration: audioBuffer.duration,
                },
              })
            );
          } catch (error) {
            console.error('Failed to load sample:', error);
            this.updateStatus(
              `Error loading sample: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      };

      // Trigger file selection
      fileInput.click();
    } catch (error) {
      console.error('Failed to load sample:', error);
      this.updateStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Play a note
   */
  playNote(midiNote: number, velocity: number = 0.8): void {
    if (!this.samplePlayer) {
      console.warn('Cannot play note - sample player not initialized');
      return;
    }

    this.samplePlayer.play(midiNote, velocity, { caps: false });
  }

  /**
   * Stop a note
   */
  stopNote(midiNote: number): void {
    if (!this.samplePlayer) {
      console.warn('Cannot stop note - sampler not initialized');
      return;
    }

    this.samplePlayer.release(midiNote, { caps: false });
  }

  /**
   * Set sample start offset
   */
  setStartOffset(value: number): void {
    if (!this.samplePlayer) return;

    // Ensure start doesn't exceed end
    const endOffset = this.getAttribute('end-offset')
      ? parseFloat(this.getAttribute('end-offset')!)
      : 1;

    if (value > endOffset) {
      value = Math.max(0, endOffset);
    }

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('start-offset') !== value.toString()) {
      this.setAttribute('start-offset', value.toString());
    }

    // Update offset controller if available
    if (
      this.offsetControlElement &&
      typeof (this.offsetControlElement as any).setStartOffset === 'function'
    ) {
      (this.offsetControlElement as any).setStartOffset(value);
    }

    // Set sample start offset on sampler
    this.samplePlayer.setSampleStartOffset(value);
  }

  /**
   * Set sample end offset
   */
  setEndOffset(value: number): void {
    if (!this.samplePlayer) return;

    // Ensure start doesn't exceed end
    const startOffset = this.getAttribute('start-offset')
      ? parseFloat(this.getAttribute('start-offset')!)
      : 0;

    if (value < startOffset) {
      value = Math.max(0, startOffset);
    }

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('end-offset') !== value.toString()) {
      this.setAttribute('end-offset', value.toString());
    }

    // Update offset controller if available
    if (
      this.offsetControlElement &&
      typeof (this.offsetControlElement as any).setEndOffset === 'function'
    ) {
      (this.offsetControlElement as any).setEndOffset(value);
    }

    // Set sample end offset on sampler
    this.samplePlayer.setSampleEndOffset(value);
  }

  /**
   * Set the offset control element
   */
  setOffsetControlElement(element: HTMLElement): void {
    this.offsetControlElement = element;
  }

  /**
   * Set loop start position
   */
  setLoopStart(value: number): void {
    if (!this.samplePlayer) return;

    // Ensure loop start doesn't exceed loop end
    const loopEnd = this.getAttribute('loop-end')
      ? parseFloat(this.getAttribute('loop-end')!)
      : 1;

    if (value > loopEnd) {
      value = Math.max(0, loopEnd);
    }

    // Ensure start doesn't exceed loop-start
    const startOffset = this.getAttribute('start-offset')
      ? parseFloat(this.getAttribute('start-offset')!)
      : 0;

    if (value < startOffset) {
      value = Math.max(0, startOffset);
    }

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('loop-start') !== value.toString()) {
      this.setAttribute('loop-start', value.toString());
    }

    // Update UI
    const loopStartSlider = this.querySelector(
      '#loop-start'
    ) as HTMLInputElement;
    if (loopStartSlider) loopStartSlider.value = value.toString();

    const valueDisplay = this.querySelector('#loop-start-value');
    if (valueDisplay) valueDisplay.textContent = value.toFixed(2);

    // Set loop start on sampler
    this.samplePlayer.setLoopStart(value);
  }

  /**
   * Set loop end position
   */
  setLoopEnd(value: number): void {
    if (!this.samplePlayer) return;

    // Ensure loop end doesn't go below loop start
    const loopStart = this.getAttribute('loop-start')
      ? parseFloat(this.getAttribute('loop-start')!)
      : 0;

    if (value < loopStart) {
      value = Math.min(this.samplePlayer.sampleDuration || 1, loopStart);
    }

    // Ensure loop end doesn't go below endOffset
    const endOffset = this.getAttribute('end-offset')
      ? parseFloat(this.getAttribute('end-offset')!)
      : 1;

    if (value > endOffset) {
      value = Math.max(0, endOffset);
    }

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('loop-end') !== value.toString()) {
      this.setAttribute('loop-end', value.toString());
    }

    // Update UI
    const loopEndSlider = this.querySelector('#loop-end') as HTMLInputElement;
    if (loopEndSlider) loopEndSlider.value = value.toString();

    const valueDisplay = this.querySelector('#loop-end-value');
    if (valueDisplay) valueDisplay.textContent = value.toFixed(2);

    // Set loop end on sampler
    if (value >= loopStart) this.samplePlayer.setLoopEnd(value);
  }

  /**
   * Set attribute enabled state and update the sampler
   * @param attributeName The name of the attribute to update (e.g., 'hold-locked')
   * @param enabled Whether the attribute is enabled
   */
  setAttributeEnabled(attributeName: string, enabled: boolean): void {
    if (!this.samplePlayer) return;

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute(attributeName) !== enabled.toString()) {
      this.setAttribute(attributeName, enabled.toString());
    }

    // Call the appropriate method on the samplePlayer based on the attribute
    switch (attributeName) {
      case 'hold-locked':
        if (enabled) this.samplePlayer.setLoopEnabled(enabled);
        this.samplePlayer.setHoldLocked(enabled);
        break;
      case 'loop-locked':
        if (enabled) this.samplePlayer.setLoopEnabled(enabled);
        this.samplePlayer.setLoopLocked(enabled);
        break;
      case 'keyboard-enabled':
        if (enabled) {
          this.samplePlayer.enableKeyboard();
        } else {
          this.samplePlayer.disableKeyboard();
        }
        break;
      case 'midi-enabled':
        if (enabled) {
          this.samplePlayer.enableMIDI();
        } else {
          this.samplePlayer.disableMIDI();
        }
        break;
      default:
        console.warn(`Unknown attribute: ${attributeName}`);
    }
  }

  /**
   * Get the SamplePlayer instance for external connections
   */
  getSamplePlayer(): SamplePlayer | null {
    return this.samplePlayer;
  }

  /**
   * Update status message
   */
  updateStatus(message: string): void {
    const statusElement = this.querySelector('#status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  dispose(): void {
    super.dispose();

    if (this.samplePlayer) {
      this.samplePlayer.dispose();
      this.samplePlayer = null;
    }

    this.outputNode = null;
    this.audioContext = null;
  }

  disconnectedCallback() {
    this.dispose();
    document.removeEventListener(
      'sample-loaded',
      this.onSampleLoaded.bind(this)
    );
  }
}
