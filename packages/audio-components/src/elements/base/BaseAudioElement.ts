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

  constructor(elementType: string) {
    super();
    this.elementType = elementType;
    this.elementId = `${elementType}-${Math.random().toString(36).substring(2, 9)}`;
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
   * Clean up resources when element is removed
   */
  disconnectedCallback(): void {
    this.dispose();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.disconnect();
    this.initialized = false;
  }
}
