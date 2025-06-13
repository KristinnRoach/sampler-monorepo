import { BaseAudioElement } from './base/BaseAudioElement';
import { TwoThumbSlider } from './ui-core/TwoThumbSlider';
/**
 * Web component for sample offset control
 * Manages start offset and end offset parameters for a sample player
 */
export class SampleOffsetController extends BaseAudioElement {
  private startOffsetValue: number = 0;
  private endOffsetValue: number = 0.99;

  private targetElement: HTMLElement | null = null;
  private targetId: string | null = null;

  // Callback functions for offset parameter changes
  private onStartOffsetChange: ((value: number) => void) | null = null;
  private onEndOffsetChange: ((value: number) => void) | null = null;

  // Define observed attributes
  static get observedAttributes(): string[] {
    return ['start-offset', 'end-offset', 'destination'];
  }

  constructor() {
    super('sample-offset-controller');

    // Create UI template using light DOM
    this.innerHTML = `
      <div class="sample-offset-controller">
        <div class="parameters">
            <div class="offset-labels">
              <div class="slider-indicators">
                <span class="indicator left">Start</span>
                <span class="indicator right">End</span>
              </div>
            </div>
            <two-thumb-slider 
              id="offset-slider"
              min="0" 
              max="1" 
              step="0.001" 
              minimum-gap="0.001"
              value-min="0" 
              value-max="0.999">
            </two-thumb-slider>
        </div>
      </div>
      <style>
        .sample-offset-controller .slider-indicators {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 0.8em;
        }
        .sample-offset-controller .indicator {
          padding: 2px 4px;
          background: #333;
          border-radius: 3px;
          color: #fff;
        }
      </style>
    `;
  }

  registerCallbacks(options: {
    onStartOffset?: (value: number) => void;
    onEndOffset?: (value: number) => void;
  }): void {
    if (options.onStartOffset) this.onStartOffsetChange = options.onStartOffset;
    if (options.onEndOffset) this.onEndOffsetChange = options.onEndOffset;
  }

  connectedCallback(): void {
    const offsetSlider = this.querySelector('#offset-slider') as TwoThumbSlider;

    if (offsetSlider) {
      // Single event listener for both values
      offsetSlider.addEventListener('range-change', ((e: CustomEvent) => {
        this.setStartOffset(e.detail.min);
        this.setEndOffset(e.detail.max);
      }) as EventListener);

      // Initialize from attributes
      if (this.hasAttribute('start-offset')) {
        const startValue = parseFloat(this.getAttribute('start-offset') || '0');
        offsetSlider.valueMin = startValue;
      }
      if (this.hasAttribute('end-offset')) {
        const endValue = parseFloat(this.getAttribute('end-offset') || '0.99');
        offsetSlider.valueMax = endValue;
      }
    }

    // Connect to target if destination attribute is set
    if (this.hasAttribute('destination')) {
      const destinationId = this.getAttribute('destination');
      if (destinationId) {
        // tiny delay to ensure target is registered
        setTimeout(() => {
          this.connectToDestinationById(destinationId);
        }, 3);
      }
    }

    this.dispatchEvent(
      new CustomEvent('sample-offset-initialized', {
        bubbles: true,
        detail: {
          offsetControl: this,
          startOffset: this.startOffsetValue,
          endOffset: this.endOffsetValue,
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
      case 'start-offset':
        this.setStartOffset(parseFloat(newValue || '0'));
        break;
      case 'end-offset':
        this.setEndOffset(parseFloat(newValue || '0.99'));
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
   * Set the start offset time and notify connected elements
   */
  setStartOffset(value: number): void {
    this.startOffsetValue = value;
    this.setAttribute('start-offset', value.toString());

    // Notify callback if registered
    if (this.onStartOffsetChange) this.onStartOffsetChange(value);

    this.applyOffsetsToTarget();

    this.dispatchEvent(
      new CustomEvent('start-offset-changed', {
        bubbles: true,
        detail: { value },
      })
    );
  }

  /**
   * Set the end offset time and notify connected elements
   */
  setEndOffset(value: number): void {
    this.endOffsetValue = value;
    this.setAttribute('end-offset', value.toString());

    if (this.onEndOffsetChange) this.onEndOffsetChange(value);

    this.applyOffsetsToTarget();

    this.dispatchEvent(
      new CustomEvent('end-offset-changed', {
        bubbles: true,
        detail: { value },
      })
    );
  }

  /**
   * Get the current start offset value
   */
  getStartOffset(): number {
    return this.startOffsetValue;
  }

  /**
   * Get the current end offset value
   */
  getEndOffset(): number {
    return this.endOffsetValue;
  }

  /**
   * Connect this offset control to a target element
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
    this.applyOffsetsToTarget();

    // Dispatch connection event
    this.dispatchEvent(
      new CustomEvent('offset-control-connected', {
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
        new CustomEvent('offset-control-disconnected', {
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
   * Apply current offset values to connected target
   */
  private applyOffsetsToTarget(): void {
    if (!this.targetElement) return;

    // Try different ways to set values on target
    const target = this.targetElement as any;
    if (target.getSamplePlayer) {
      // Target has a getSamplePlayer method (like SamplerElement)
      const player = target.getSamplePlayer();
      if (player && player.setParameterValue) {
        player.setParameterValue('startOffset', this.startOffsetValue);
        player.setParameterValue('endOffset', this.endOffsetValue);
      }
    } else if (target.setStartOffset && target.setEndOffset) {
      // Target has direct methods
      target.setStartOffset(this.startOffsetValue);
      target.setEndOffset(this.endOffsetValue);
    }
  }

  /**
   * Update the slider ranges based on sample duration
   */
  updateSampleDuration(
    duration: number,
    options: {
      savedStartOffset?: number;
      savedEndOffset?: number;
    } = {}
  ): void {
    const { savedStartOffset, savedEndOffset } = options;
    const offsetSlider = this.querySelector('#offset-slider') as any;
    if (!offsetSlider) return;

    // Update constraints
    offsetSlider.min = 0;
    offsetSlider.max = duration;

    // Determine new values
    let newStart: number;
    let newEnd: number;

    if (savedStartOffset !== undefined && savedEndOffset !== undefined) {
      // Use saved values (clamped to valid range)
      newStart = Math.max(0, Math.min(savedStartOffset, duration));
      newEnd = Math.max(0, Math.min(savedEndOffset, duration));
    } else {
      // Auto-adjust current values or use defaults
      const wasAtMin = this.startOffsetValue <= offsetSlider.min;
      const wasAtMax = this.endOffsetValue >= offsetSlider.max;

      newStart = wasAtMin ? 0 : Math.min(duration, this.startOffsetValue);
      newEnd = wasAtMax ? duration : Math.min(duration, this.endOffsetValue);
    }

    // Apply new values
    offsetSlider.setValues(newStart, newEnd);

    // Dispatch event
    this.dispatchEvent(
      new CustomEvent('sample-duration-changed', {
        bubbles: true,
        detail: {
          duration,
          startOffset: newStart,
          endOffset: newEnd,
        },
      })
    );
  }

  /**
   * Set the minimum allowed gap between the start and end thumbs
   */
  setMinimumGap(value: number): void {
    const offsetSlider = this.querySelector('#offset-slider') as TwoThumbSlider;
    if (offsetSlider) {
      offsetSlider.setAttribute('minimum-gap', value.toString());
    }
  }

  /**
   * Get the current minimum gap value
   */
  getMinimumGap(): number {
    const offsetSlider = this.querySelector('#offset-slider') as TwoThumbSlider;
    if (offsetSlider) {
      const gap = offsetSlider.getAttribute('minimum-gap');
      return gap ? parseFloat(gap) : 0.001;
    }
    return 0.001;
  }

  /**
   * Set the step increment for the offset slider
   */
  setStep(value: number): void {
    const offsetSlider = this.querySelector('#offset-slider') as TwoThumbSlider;
    if (offsetSlider) {
      offsetSlider.setAttribute('step', value.toString());
    }
  }

  /**
   * Get the current step value
   */
  getStep(): number {
    const offsetSlider = this.querySelector('#offset-slider') as TwoThumbSlider;
    if (offsetSlider) {
      const step = offsetSlider.getAttribute('step');
      return step ? parseFloat(step) : 0.001;
    }
    return 0.001;
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
