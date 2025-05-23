import { BaseAudioElement } from './base/BaseAudioElement';

/**
 * Web component for a simple ADSR envelope controller
 * Currently implements attack and release parameters
 */
export class EnvelopeElement extends BaseAudioElement {
  private attackValue: number = 0.01;
  private releaseValue: number = 0.02;

  private targetElement: HTMLElement | null = null;
  private targetId: string | null = null;

  // Callback functions for envelope parameter changes
  private onAttackChange: ((value: number) => void) | null = null;
  private onReleaseChange: ((value: number) => void) | null = null;

  // Define observed attributes
  static get observedAttributes(): string[] {
    return ['attack', 'release', 'destination'];
  }

  constructor() {
    super('envelope');

    // Create UI template using light DOM
    this.innerHTML = `
      <div class="envelope-element">
        <div class="parameters">
          <label>
            Attack: <input type="range" min="0" max="1" step="0.01" value="0.01" id="attack">
          </label>
          <label>
            Release: <input type="range" min="0" max="2" step="0.01" value="0.3" id="release">
          </label>
        </div>
        <!-- <button id="toggle-status-btn">Toggle Status</button> -->
        <!-- The status element will be inserted here programmatically -->
      </div>
    `;
  }

  /**
   * Register callbacks to be invoked when envelope parameters change
   */
  registerCallbacks(options: {
    onAttack?: (value: number) => void;
    onRelease?: (value: number) => void;
  }): void {
    if (options.onAttack) this.onAttackChange = options.onAttack;
    if (options.onRelease) this.onReleaseChange = options.onRelease;
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback(): void {
    const toggleStatusButton = this.querySelector('#toggle-status-btn');
    if (toggleStatusButton) {
      toggleStatusButton.addEventListener('click', () => {
        if (!this.statusElement) {
          this.initializeStatus();
        }
        this.toggleStatusDisplay();
      });
    }

    // Set up event listeners for UI controls
    const attackSlider = this.querySelector('#attack') as HTMLInputElement;
    const releaseSlider = this.querySelector('#release') as HTMLInputElement;

    if (attackSlider) {
      attackSlider.addEventListener('input', () => {
        const value = parseFloat(attackSlider.value);
        this.setAttack(value);
      });

      // Initialize slider from attribute if present
      if (this.hasAttribute('attack')) {
        const value = parseFloat(this.getAttribute('attack') || '0.01');
        attackSlider.value = value.toString();
        this.setAttack(value);
      }
    }

    if (releaseSlider) {
      releaseSlider.addEventListener('input', () => {
        const value = parseFloat(releaseSlider.value);
        this.setRelease(value);
      });

      // Initialize slider from attribute if present
      if (this.hasAttribute('release')) {
        const value = parseFloat(this.getAttribute('release') || '0.3');
        releaseSlider.value = value.toString();
        this.setRelease(value);
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
      new CustomEvent('envelope-initialized', {
        bubbles: true,
        detail: {
          envelope: this,
          attack: this.attackValue,
          release: this.releaseValue,
        },
      })
    );

    // Update the status (this won't be visible unless toggle is clicked)
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
      case 'attack':
        this.setAttack(parseFloat(newValue || '0.01'));
        break;
      case 'release':
        this.setRelease(parseFloat(newValue || '0.3'));
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
   * Set the attack time and notify connected elements
   */
  setAttack(value: number): void {
    this.attackValue = value;

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('attack') !== value.toString()) {
      this.setAttribute('attack', value.toString());
    }

    // Notify callback if registered
    if (this.onAttackChange) {
      this.onAttackChange(value);
    }

    // Apply envelope to target
    this.applyEnvelopeToTarget();

    // Dispatch event for connected elements
    this.dispatchEvent(
      new CustomEvent('attack-changed', {
        bubbles: true,
        detail: { value },
      })
    );
  }

  /**
   * Set the release time and notify connected elements
   */
  setRelease(value: number): void {
    this.releaseValue = value;

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('release') !== value.toString()) {
      this.setAttribute('release', value.toString());
    }

    // Notify callback if registered
    if (this.onReleaseChange) {
      this.onReleaseChange(value);
    }

    // Apply envelope to target
    this.applyEnvelopeToTarget();

    // Dispatch event for connected elements
    this.dispatchEvent(
      new CustomEvent('release-changed', {
        bubbles: true,
        detail: { value },
      })
    );
  }

  /**
   * Get the current attack value
   */
  getAttack(): number {
    return this.attackValue;
  }

  /**
   * Get the current release value
   */
  getRelease(): number {
    return this.releaseValue;
  }

  /**
   * Connect this envelope to a target element
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
    this.applyEnvelopeToTarget();

    // Dispatch connection event
    this.dispatchEvent(
      new CustomEvent('envelope-connected', {
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
        new CustomEvent('envelope-disconnected', {
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
   * Apply current envelope values to connected target
   */
  private applyEnvelopeToTarget(): void {
    if (!this.targetElement) return;

    // Try different ways to set values on target
    const target = this.targetElement as any;
    if (target.getSamplePlayer) {
      // Target has a getSamplePlayer method (like SamplerElement)
      const player = target.getSamplePlayer();
      if (player && player.setAttackTime && player.setReleaseTime) {
        player.setAttackTime(this.attackValue);
        player.setReleaseTime(this.releaseValue);
      }
    } else if (target.setAttackTime && target.setReleaseTime) {
      // Target has direct methods
      target.setAttackTime(this.attackValue);
      target.setReleaseTime(this.releaseValue);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();

    // Component-specific cleanup...

    this.inputNode = null;
    this.outputNode = null;
    this.audioContext = null;
  }
}
