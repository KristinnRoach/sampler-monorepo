import { BaseAudioElement } from './base/BaseAudioElement';
import { audiolib } from '@repo/audiolib';
import './ui-core/ToggleButton';

/**
 * Web component for recording audio directly to a sampler
 */
export class RecorderElement extends BaseAudioElement {
  private recorder: any = null; // Will hold the Recorder instance
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
        <toggle-button id="record-toggle" 
          label-on="Recording..." 
          label-off="Record" 
          disabled>
        </toggle-button>
      </div>
    `;
  }

  connectedCallback(): void {
    this.recordButton = this.querySelector('#record-toggle');

    // Add event listener to toggle button
    this.recordButton?.addEventListener('toggle', (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.active) {
        this.startRecording();
      } else {
        this.stopRecording(); // Add this to handle the toggle-off event
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
      await this.recorder.start();
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
    const recordButton = this.querySelector('#record-toggle') as any;

    if (recordButton) {
      if (recordButton.active !== isRecording) {
        recordButton.active = isRecording;
      }
    }
  }

  private enableControls(): void {
    const recordButton = this.querySelector('#record-toggle') as HTMLElement;
    if (recordButton) recordButton.removeAttribute('disabled');
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
