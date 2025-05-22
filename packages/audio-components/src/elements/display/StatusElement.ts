/**
 * Simple status display component for audio elements
 * Provides a consistent way to show status messages across components
 */
export class StatusElement extends HTMLElement {
  private messageElement: HTMLElement;
  private visible: boolean = false;

  static get observedAttributes(): string[] {
    return ['message', 'type', 'visible'];
  }

  constructor() {
    super();

    // Create container for status message
    this.messageElement = document.createElement('div');
    this.messageElement.id = 'message';
    this.appendChild(this.messageElement);

    // Set default message
    this.updateMessage(this.getAttribute('message') || 'Ready');

    // Apply type if provided (can be used for styling)
    if (this.hasAttribute('type')) {
      this.messageElement.dataset.type = this.getAttribute('type') || 'info';
    }

    // Default to hidden unless visible attribute is set to true
    this.visible = this.getAttribute('visible') === 'true';
    // Ensure display property is synchronized with visible state
    this.style.display = this.visible ? '' : 'none';
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (oldValue === newValue) return;

    switch (name) {
      case 'message':
        this.updateMessage(newValue);
        break;
      case 'type':
        this.messageElement.dataset.type = newValue || 'info';
        break;
      case 'visible':
        this.visible = newValue === 'true';
        this.updateVisibility();
        break;
    }
  }

  /**
   * Update the displayed message
   */
  updateMessage(message: string): void {
    this.messageElement.textContent = message;

    // Also update the attribute silently
    if (this.getAttribute('message') !== message) {
      this.setAttribute('message', message);
    }
  }

  /**
   * Convenience method to set message and type together
   */
  setStatus(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): void {
    this.updateMessage(message);
    this.messageElement.dataset.type = type;
    this.setAttribute('type', type);
  }

  /**
   * Toggle the visibility of the status element
   * @param force Optional boolean to force a specific state
   * @returns The new visibility state
   */
  toggleDisplay(force?: boolean): boolean {
    // If force is provided, use it, otherwise toggle the current state
    this.visible = force !== undefined ? force : !this.visible;
    
    // Update attribute and visibility in one place
    this.setAttribute('visible', this.visible.toString());
    this.style.display = this.visible ? '' : 'none';
    
    return this.visible;
  }

  /**
   * Update the display property based on visibility state
   */
  private updateVisibility(): void {
    this.style.display = this.visible ? '' : 'none';
  }

  dispose() {
    // this.disconnect();
  }
}

// Define the custom element
customElements.define('status-element', StatusElement);
