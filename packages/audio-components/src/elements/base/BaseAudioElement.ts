import { StatusElement } from '../display/StatusElement';

/**
 * Base class for all audio web components
 * Provides common functionality for audio routing and lifecycle management
 */
export class BaseAudioElement extends HTMLElement {
  elementId: string; // todo: protected
  protected elementType: string;

  protected audioContext: AudioContext | null = null;
  protected inputNode: AudioNode | null = null;
  protected outputNode: AudioNode | null = null;
  protected initialized: boolean = false;

  protected statusElement: StatusElement | null = null;

  constructor(elementType: string) {
    super();
    this.elementType = elementType;
    this.elementId = `${elementType}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Initialize status element
   * Should be called by child classes during connectedCallback
   */
  protected initializeStatus(): void {
    // Check if status element already exists - add type casting
    this.statusElement = this.querySelector('status-element') as StatusElement;

    // // Create status element if it doesn't exist
    // if (!this.statusElement) {
    //   // Create the element WITH type casting
    //   this.statusElement = document.createElement(
    //     'status-element'
    //   ) as StatusElement;

    if (this.statusElement) {
      // First append to DOM so the element is properly upgraded
      this.appendChild(this.statusElement);

      // THEN set attributes after it's in the DOM and upgraded
      this.statusElement.setAttribute('message', 'Not initialized');
      this.statusElement.setAttribute('visible', 'false');
    } else {
      console.debug('No status element');
    }
  }

  /**
   * Update status message
   */
  protected updateStatus(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): void {
    if (!this.statusElement) {
      return;
      // this.initializeStatus();
    }

    if (!this.statusElement) return;

    // Call setStatus safely
    if (typeof this.statusElement.setStatus === 'function') {
      this.statusElement.setStatus(message, type);
    } else {
      // Fallback to attributes if method is not available
      this.statusElement.setAttribute('message', message);
      this.statusElement.setAttribute('type', type);
    }
  }

  /**
   * Toggle the visibility of the status display
   * @param force Optional boolean to force a specific state
   * @returns The new visibility state or null if no status element
   */
  toggleStatusDisplay(force?: boolean): boolean | null {
    if (!this.statusElement) {
      this.initializeStatus();
    }

    if (!this.statusElement) return null;

    // Call toggleDisplay safely
    if (typeof this.statusElement.toggleDisplay === 'function') {
      return this.statusElement.toggleDisplay(force);
    } else {
      // Fallback toggle using attribute and style
      const isVisible = this.statusElement.getAttribute('visible') === 'true';
      const newVisible = force !== undefined ? force : !isVisible;

      this.statusElement.setAttribute('visible', String(newVisible));
      this.statusElement.style.display = newVisible ? '' : 'none';

      return newVisible;
    }
  }

  /**
   * Connect this element's output to another audio element or AudioNode
   */
  connect(destination: HTMLElement | BaseAudioElement | AudioNode): this {
    if (destination instanceof BaseAudioElement) {
      // todo: create separate BaseElement class for non-audio elements
      this.setAttribute('target-element-id', destination.elementId);

      if (!this.outputNode || !destination?.getInput()) {
        console.warn('Failed to connect elements');
        return this;
      }

      const inputNode = destination.getInput();
      if (inputNode) {
        this.outputNode.connect(inputNode);
      } else {
        console.warn('Cannot connect - destination has no input node');
      }
    } else if (destination instanceof AudioNode) {
      if (this.outputNode) this.outputNode.connect(destination);
    }

    // Dispatch connection event
    this.dispatchEvent(
      new CustomEvent('audio-connected', {
        bubbles: true,
        detail: { source: this, destination },
      })
    );

    return this;
  }

  /**
   * Disconnect this element's output
   */
  disconnect(): this {
    if (this.outputNode) {
      this.outputNode.disconnect();
      this.updateStatus('Disconnected');

      // Dispatch disconnection event
      this.dispatchEvent(
        new CustomEvent('audio-disconnected', {
          bubbles: true,
          detail: { source: this },
        })
      );
    }
    return this;
  }

  /**
   * Get the input AudioNode for connections
   */
  getInput(): AudioNode | null {
    return this.inputNode;
  }

  /**
   * Get the output AudioNode for connections
   */
  getOutput(): AudioNode | null {
    return this.outputNode;
  }

  /**
   * Get the current time from the audio context
   */
  get now(): number {
    return this.audioContext?.currentTime || 0;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.disconnect();
    this.initialized = false;
  }

  /**
   * Clean up resources when element is removed
   */
  disconnectedCallback(): void {
    this.dispose();
  }
}
