import { BaseAudioElement } from './base/BaseAudioElement';

/**
 * Web component for loop control
 * Manages loop start and loop end parameters for a sample player
 */
export class LoopControlElement extends BaseAudioElement {
  private loopStartValue: number = 0;
  private loopEndValue: number = 0.99;

  private targetElement: HTMLElement | null = null;
  private targetId: string | null = null;

  // Callback functions for loop parameter changes
  private onLoopStartChange: ((value: number) => void) | null = null;
  private onLoopEndChange: ((value: number) => void) | null = null;

  // Define observed attributes
  static get observedAttributes(): string[] {
    return ['loop-start', 'loop-end', 'destination'];
  }

  constructor() {
    super('loop-control');

    // Create UI template using light DOM
    this.innerHTML = `
      <div class="loop-control-element">
        <div class="parameters">
          <label>
            Loop Start: <input type="range" min="0" max="1" step="0.0005" value="0" id="loop-start">
            <span id="loop-start-value">0.00</span>
          </label>
          <label>
            Loop End: <input type="range" min="0" max="1" step="0.0005" value="0.99" id="loop-end">
            <span id="loop-end-value">0.99</span>
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Register callbacks to be invoked when loop parameters change
   */
  registerCallbacks(options: {
    onLoopStart?: (value: number) => void;
    onLoopEnd?: (value: number) => void;
  }): void {
    if (options.onLoopStart) this.onLoopStartChange = options.onLoopStart;
    if (options.onLoopEnd) this.onLoopEndChange = options.onLoopEnd;
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback(): void {
    // Set up event listeners for UI controls
    const loopStartSlider = this.querySelector(
      '#loop-start'
    ) as HTMLInputElement;
    const loopEndSlider = this.querySelector('#loop-end') as HTMLInputElement;

    if (loopStartSlider) {
      loopStartSlider.addEventListener('input', () => {
        const value = parseFloat(loopStartSlider.value);
        this.setLoopStart(value);
      });

      // Initialize slider from attribute if present
      if (this.hasAttribute('loop-start')) {
        const value = parseFloat(this.getAttribute('loop-start') || '0');
        loopStartSlider.value = value.toString();
        this.setLoopStart(value);
      }
    }

    if (loopEndSlider) {
      loopEndSlider.addEventListener('input', () => {
        const value = parseFloat(loopEndSlider.value);
        this.setLoopEnd(value);
      });

      // Initialize slider from attribute if present
      if (this.hasAttribute('loop-end')) {
        const value = parseFloat(this.getAttribute('loop-end') || '0.99');
        loopEndSlider.value = value.toString();
        this.setLoopEnd(value);
      }
    }

    // Connect to target if destination attribute is set
    if (this.hasAttribute('destination')) {
      const destinationId = this.getAttribute('destination');
      if (destinationId) {
        // Delay connection slightly to ensure target is registered
        setTimeout(() => {
          this.connectToDestinationById(destinationId);
        }, 0);
      }
    }

    // Dispatch initialization event
    this.dispatchEvent(
      new CustomEvent('loop-control-initialized', {
        bubbles: true,
        detail: {
          loopControl: this,
          loopStart: this.loopStartValue,
          loopEnd: this.loopEndValue,
        },
      })
    );

    // Update the status
    this.updateStatus('Component ready', 'info');

    this.initialized = true;
  }

  /**
   * Called when an observed attribute changes
   */
  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (oldValue === newValue) return;

    switch (name) {
      case 'loop-start':
        this.setLoopStart(parseFloat(newValue || '0'));
        break;
      case 'loop-end':
        this.setLoopEnd(parseFloat(newValue || '0.99'));
        break;
      case 'destination':
        if (newValue && newValue !== this.targetId) {
          this.connectToDestinationById(newValue);
        } else if (!newValue && this.targetId) {
          this.disconnect();
        }
        break;
    }
  }

  /**
   * Set the loop start time and notify connected elements
   */
  setLoopStart(value: number): void {
    if (value > this.loopEndValue) {
      value = Math.max(0, this.loopEndValue);
    }

    this.loopStartValue = value;

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('loop-start') !== value.toString()) {
      this.setAttribute('loop-start', value.toString());
    }

    // Update the UI slider to match the constrained value
    const loopStartSlider = this.querySelector(
      '#loop-start'
    ) as HTMLInputElement;
    if (loopStartSlider && loopStartSlider.value !== value.toString()) {
      loopStartSlider.value = value.toString();
    }
    // Notify callback if registered
    if (this.onLoopStartChange) {
      this.onLoopStartChange(value);
    }

    // Apply to target
    this.applyLoopToTarget();

    // Dispatch event for connected elements
    this.dispatchEvent(
      new CustomEvent('loop-start-changed', {
        bubbles: true,
        detail: { value },
      })
    );
  }

  /**
   * Set the loop end time and notify connected elements
   */
  setLoopEnd(value: number): void {
    if (value < this.loopStartValue) {
      value = Math.max(this.loopStartValue, 0);
    }

    this.loopEndValue = value;

    // Update the UI slider to match the constrained value
    const loopEndSlider = this.querySelector('#loop-end') as HTMLInputElement;
    if (loopEndSlider && loopEndSlider.value !== value.toString()) {
      loopEndSlider.value = value.toString();
    }

    // Update the display value
    const valueDisplay = this.querySelector('#loop-end-value');
    if (valueDisplay) valueDisplay.textContent = value.toFixed(2);

    // Notify callback if registered
    if (this.onLoopEndChange) {
      this.onLoopEndChange(value);
    }

    // Apply to target
    this.applyLoopToTarget();

    // Dispatch event for connected elements
    this.dispatchEvent(
      new CustomEvent('loop-end-changed', {
        bubbles: true,
        detail: { value },
      })
    );
  }

  /**
   * Get the current loop start value
   */
  getLoopStart(): number {
    return this.loopStartValue;
  }

  /**
   * Get the current loop end value
   */
  getLoopEnd(): number {
    return this.loopEndValue;
  }

  /**
   * Connect this loop control to a target element
   */
  connect(target: HTMLElement | BaseAudioElement): this {
    // Store reference to target
    this.targetElement = target as HTMLElement;
    this.targetId = target.id;

    // Update attribute to reflect connection
    this.setAttribute('destination', this.targetId);

    // Update status display
    this.updateStatus(`Connected to ${this.targetId}`);

    // Apply current values to target
    this.applyLoopToTarget();

    // Dispatch connection event
    this.dispatchEvent(
      new CustomEvent('loop-control-connected', {
        bubbles: true,
        detail: { source: this, destination: target },
      })
    );

    return this;
  }

  /**
   * Disconnect from current target
   */
  disconnect(): this {
    if (this.targetElement) {
      this.dispatchEvent(
        new CustomEvent('loop-control-disconnected', {
          bubbles: true,
          detail: { source: this, destination: this.targetElement },
        })
      );
    }

    this.targetElement = null;
    this.targetId = null;
    this.removeAttribute('destination');
    this.updateStatus('Not connected');

    return this;
  }

  /**
   * Connect to a target element by ID
   */
  connectToDestinationById(id: string): boolean {
    const target = document.getElementById(id);
    if (!target) {
      console.warn(`Destination element with ID "${id}" not found`);
      return false;
    }

    this.connect(target);
    return true;
  }

  /**
   * Apply current loop values to connected target
   */
  private applyLoopToTarget(): void {
    if (!this.targetElement) return;

    // Try different ways to set values on target
    const target = this.targetElement as any;
    if (target.getSamplePlayer) {
      // Target has a getSamplePlayer method (like SamplerElement)
      const player = target.getSamplePlayer();
      if (player && player.setLoopStart && player.setLoopEnd) {
        player.setLoopStart(this.loopStartValue);
        player.setLoopEnd(this.loopEndValue);
      }
    } else if (target.setLoopStart && target.setLoopEnd) {
      // Target has direct methods
      target.setLoopStart(this.loopStartValue);
      target.setLoopEnd(this.loopEndValue);
    }
  }

  /**
   * Update the slider ranges based on sample duration
   */
  updateSampleDuration(duration: number): void {
    const loopStartSlider = this.querySelector(
      '#loop-start'
    ) as HTMLInputElement;
    const loopEndSlider = this.querySelector('#loop-end') as HTMLInputElement;

    if (loopStartSlider) {
      loopStartSlider.min = '0';
      loopStartSlider.max = duration.toString();
      const valueDisplay = this.querySelector('#loop-start-value');
      if (valueDisplay)
        valueDisplay.textContent = this.loopStartValue.toFixed(2);
    }

    if (loopEndSlider) {
      loopEndSlider.min = '0';
      loopEndSlider.max = duration.toString();

      // Set to duration if currently at max
      if (parseFloat(loopEndSlider.value) === parseFloat(loopEndSlider.max)) {
        this.setLoopEnd(duration);
        loopEndSlider.value = duration.toString();
      }

      const valueDisplay = this.querySelector('#loop-end-value');
      if (valueDisplay) valueDisplay.textContent = this.loopEndValue.toFixed(2);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
    this.inputNode = null;
    this.outputNode = null;
    this.audioContext = null;
  }
}
