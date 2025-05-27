import { BaseAudioElement } from './base/BaseAudioElement';
import { audiolib, Recorder, createAudioRecorder } from '@repo/audiolib';
import './ui-core/RecordButton';

/**
 * Web component for recording audio directly to a sampler
 */
export class RecorderElement extends BaseAudioElement {
  private recorder: Recorder | null = null;
  private isRecording: boolean = false;
  private destinationElement: BaseAudioElement | null = null;
  private recordButton: HTMLElement | null = null;

  // Define observed attributes
  static get observedAttributes(): string[] {
    return ['destination'];
  }

  constructor() {
    super('recorder');

    this.innerHTML = `
      <div class="recorder-element">
        <record-button id="record-toggle" 
          label-on="Recording..." 
          label-off="Record" 
          disabled>
        </record-button>
      </div>
    `;
  }

  connectedCallback(): void {
    this.recordButton = this.querySelector('#record-toggle');

    // Add event listener to toggle button
    this.recordButton?.addEventListener('toggle', (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.active) {
        console.log('Starting recording');
        this.startRecording();
      } else {
        this.stopRecording();
      }
    });

    this.initialize();
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (name === 'destination' && newValue !== oldValue) {
      this.connectToDestinationById(newValue);
    }
  }

  /**
   * Connect to destination element by its ID
   */
  private connectToDestinationById(destinationId: string): void {
    if (!destinationId) return;

    // Find the element by ID
    const destinationElement = document.getElementById(
      destinationId
    ) as BaseAudioElement;

    if (destinationElement && destinationElement instanceof BaseAudioElement) {
      this.connect(destinationElement);
    } else {
      console.debug(
        `Destination element with ID "${destinationId}" not found or not a BaseAudioElement`
      );
    }
  }

  async initialize(): Promise<void> {
    try {
      // Initialize the audiolib context
      await audiolib.init();

      // Create a recorder instance
      this.recorder = await audiolib.createRecorder();

      this.recorder.onMessage('record:start', () => {
        console.info('record:start');
      });

      // Listen for stop events from the recorder (for auto-stop functionality)
      this.recorder.onMessage('record:stopping', () => {
        console.info('record:stopping');

        // Update UI state when recording is automatically stopped
        if (this.isRecording) {
          this.isRecording = false;
          this.updateStatus('Processing recording...');
          this.updateButtons(false);

          // Update the record button state
          const recordButton = this.querySelector(
            '#record-toggle'
          ) as HTMLElement;
          if (recordButton) {
            recordButton.removeAttribute('active');
          }
        }
      });

      // Listen for stop events from the recorder (for auto-stop functionality)
      this.recorder.onMessage('record:stop', () => {
        console.info('record:stop');
        this.updateStatus('Recording stopped (auto)');
      });

      this.recorder.onMessage('record:cancelled', () => {
        console.info('record:cancelled');
        this.updateStatus('Recording cancelled');
        this.updateButtons(false);
      });

      this.updateStatus('Ready to record');
      this.enableControls();

      // Check for destination attribute and connect if present
      const destinationId = this.getAttribute('destination');
      if (destinationId) {
        this.connectToDestinationById(destinationId);
      }

      this.initialized = true;

      this.dispatchEvent(
        new CustomEvent('recorder-initialized', {
          bubbles: true,
          detail: { recorder: this },
        })
      );
    } catch (error) {
      console.error('Failed to initialize recorder:', error);
      this.updateStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  connect(destination: BaseAudioElement): this {
    // quick check - cleanup after
    const samplePlayer =
      'getSamplePlayer' in destination
        ? (destination as any).getSamplePlayer()
        : null;

    if (!this.recorder || !samplePlayer) {
      console.debug(
        'Recorder not initialized or destination is not a sample player'
      );
      return this;
    }

    this.recorder.connect(samplePlayer);

    // Set target ID for events
    this.setAttribute('target-element-id', destination.elementId);

    // Update destination attribute to reflect the connection
    this.setAttribute('destination', destination.id);

    // Store reference to destination
    this.destinationElement = destination;

    return this;
  }

  async startRecording(): Promise<void> {
    if (!this.recorder || this.isRecording) return;
    if (!this.destinationElement) {
      console.warn('No destination element connected');
      this.updateStatus('No destination element connected');
      return;
    }

    try {
      // await this.recorder.start(); // Using default options

      await this.recorder.start({
        useThreshold: true,
        startThreshold: -30, // Start recording at -30dB
        autoStop: true,
        stopThreshold: -40, // Stop when quieter than -40dB (must be lower than startThreshold)
        silenceTimeoutMs: 1000, // Wait 1 second of silence
      });

      this.isRecording = true;
      this.updateStatus('Recording...');
      this.updateButtons(true);

      this.dispatchEvent(
        new CustomEvent('recording-started', {
          bubbles: true,
          detail: { recorder: this },
        })
      );
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.updateStatus(
        `Error starting: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.recorder || !this.isRecording) return;

    try {
      const audioBuffer = await this.recorder.stop();
      this.isRecording = false;
      this.updateStatus('Recording stopped');
      this.updateButtons(false);

      // The buffer is already sent to the target by the recorder class
      // But we'll also dispatch an event for the UI
      this.dispatchEvent(
        new CustomEvent('recording-stopped', {
          bubbles: true,
          detail: {
            targetId: this.getAttribute('target-element-id'),
            duration: audioBuffer.duration,
          },
        })
      );
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.updateStatus(
        `Error stopping: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private updateButtons(isRecording: boolean): void {
    const recordButton = this.querySelector('#record-toggle') as HTMLElement;

    if (recordButton) {
      if (isRecording) {
        recordButton.setAttribute('active', '');
      } else {
        recordButton.removeAttribute('active');
      }
    }
  }

  private enableControls(): void {
    const recordButton = this.querySelector('#record-toggle') as HTMLElement;
    if (recordButton) {
      recordButton.removeAttribute('disabled');
    }
  }

  disconnectedCallback(): void {
    if (this.recorder) {
      this.recorder.dispose();
      this.recorder = null;
    }

    super.disconnectedCallback();
  }
}

// Register the custom element
customElements.define('recorder-element', RecorderElement);
