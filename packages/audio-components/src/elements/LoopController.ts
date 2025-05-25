import { BaseAudioElement } from './base/BaseAudioElement';
import { TwoThumbSlider } from './ui-core/TwoThumbSlider';
import './ui-core/KnobElement';

/**
 * Web component for loop control
 * Manages loop start and loop end parameters for a sample player
 */
export class LoopController extends BaseAudioElement {
  private loopStartValue: number = 0;
  private loopEndValue: number = 0.99;

  // private loopDuration: number = this.loopEndValue - this.loopStartValue;
  private fineTuneValue: number = 0;

  private targetElement: HTMLElement | null = null;
  private targetId: string | null = null;

  // Callbacks
  private onLoopStartChange: ((value: number) => void) | null = null;
  private onLoopEndChange: ((value: number) => void) | null = null;
  private onFineTuneChange: ((value: number) => void) | null = null;

  private onOffsetChange:
    | ((startOffset: number, endOffset: number) => void)
    | null = null;

  static get observedAttributes(): string[] {
    return ['loop-start', 'loop-end', 'fine-tune', 'destination'];
  }

  constructor() {
    super('loop-controller');

    this.innerHTML = `
      <div class="loop-controller">
        <div class="parameters">
            <div class="loop-labels">
              <div class="slider-indicators">
                <span class="indicator left">Loop Start</span>
                <span class="indicator right">Loop End</span>
              </div>
            </div>
            <two-thumb-slider 
              id="loop-slider"
              min="0" 
              max="1" 
              step="0.001" 
              minimum-gap="0.001"
              value-min="0" 
              value-max="0.999">
            </two-thumb-slider>
            <div class="fine-tune-control">
              <label for="fine-tune">Fine Tune (ms):</label>
              <!-- <knob-element id="fine-tune" value="0" min="0" max="100"></value-knob> -->
              <input type="range" id="fine-tune" value="0" min="-0.5" max="0.5" step="0.01">
              <span class="fine-tune-value">0</span>
            </div>
        </div>
      </div>
      <style>
        .loop-controller .slider-indicators {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 0.8em;
        }
        .loop-controller .indicator {
          padding: 2px 4px;
          background: #333;
          border-radius: 3px;
          color: #fff;
        }
        .fine-tune-control {
          display: flex;
          align-items: center;
          margin-top: 10px;
          font-size: 0.9em;
        }
        .fine-tune-control input {
          width: 40px;
          height: 40px;
          margin: 0 10px;
        }
        .fine-tune-value {
          min-width: 40px;
        }
      </style>
    `;
  }

  registerCallbacks(options: {
    onLoopStart?: (value: number) => void;
    onLoopEnd?: (value: number) => void;
    onFineTuneChange?: (value: number) => void;
    onOffsetChange?: (startOffset: number, endOffset: number) => void;
  }): void {
    if (options.onLoopStart) this.onLoopStartChange = options.onLoopStart;
    if (options.onLoopEnd) this.onLoopEndChange = options.onLoopEnd;
    if (options.onFineTuneChange)
      this.onFineTuneChange = options.onFineTuneChange;
    if (options.onOffsetChange) this.onOffsetChange = options.onOffsetChange;
  }

  connectedCallback(): void {
    const loopSliderEl = this.querySelector('#loop-slider') as TwoThumbSlider;
    const fineTuneSliderEl = this.querySelector('#fine-tune') as any;

    if (loopSliderEl) {
      // Single event listener for both values
      loopSliderEl.addEventListener('range-change', ((e: CustomEvent) => {
        this.setLoopStart(e.detail.min);
        this.setLoopEnd(e.detail.max);
      }) as EventListener);

      // Initialize from attributes
      if (this.hasAttribute('loop-start')) {
        const startValue = parseFloat(this.getAttribute('loop-start') || '0');
        loopSliderEl.valueMin = startValue;
        // add fine-tune constraints?
      }
      if (this.hasAttribute('loop-end')) {
        const endValue = parseFloat(this.getAttribute('loop-end') || '0.99');
        loopSliderEl.valueMax = endValue - (this.fineTuneValue ?? 0);
        // add fine-tune constraints?
      }

      // if (fineTuneSliderEl) {
      //   fineTuneSliderEl.addEventListener('change', (e: CustomEvent) => {
      //     this.setFineTune();
      //   });
      // }

      // if (this.hasAttribute('fine-tune')) {
      //   const fineTuneValue = parseFloat(
      //     this.getAttribute('fine-tune') || '0.99'
      //   );
      //   // fineTuneSliderEl.valueMax = endValue - (this.fineTuneValue ?? 0);
      // }
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
      new CustomEvent('loop-control-initialized', {
        bubbles: true,
        detail: {
          loopControl: this,
          loopStart: this.loopStartValue,
          loopEnd: this.loopEndValue,
          fineTuneOffset: this.fineTuneValue,
          target: this.targetElement,
          targetId: this.targetId,
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
      case 'fine-tune':
        this.setFineTune(parseFloat(newValue || '0'));
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
    this.loopStartValue = value;
    this.setAttribute('loop-start', value.toString());

    const valueDisplay = this.querySelector('#loop-start-value');
    if (valueDisplay) valueDisplay.textContent = value.toFixed(2);

    // Notify callback if registered
    if (this.onLoopStartChange) this.onLoopStartChange(value);

    this.applyLoopToTarget();

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
    this.loopEndValue = value;
    this.setAttribute('loop-end', value.toString());

    const valueDisplay = this.querySelector('#loop-end-value');
    if (valueDisplay) valueDisplay.textContent = value.toFixed(2);

    if (this.onLoopEndChange) this.onLoopEndChange(value);

    this.applyLoopToTarget();

    this.dispatchEvent(
      new CustomEvent('loop-end-changed', {
        bubbles: true,
        detail: { value },
      })
    );
  }

  /**
   * Set the fine-tune offset value in milliseconds
   */
  setFineTune(value: number): void {
    this.fineTuneValue = value; //* this.loopDuration;
    this.setAttribute('fine-tune', value.toString());

    const fineTuneValue = this.querySelector('.fine-tune-value') as HTMLElement;
    if (fineTuneValue) fineTuneValue.textContent = `${this.fineTuneValue}`;

    if (this.onFineTuneChange) this.onFineTuneChange(value);

    this.applyLoopToTarget();

    this.dispatchEvent(
      new CustomEvent('fine-tune-changed', {
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
   * Get the current fine-tune value
   */
  getFineTuneValue(): number {
    return this.fineTuneValue;
  }

  /**
   * Apply current loop values to connected target
   */
  private applyLoopToTarget(): void {
    if (!this.targetElement) return;

    // this.loopDuration = this.loopEndValue - this.loopStartValue;

    const target = this.targetElement as any;
    const effectiveEndValue = this.loopEndValue + this.fineTuneValue; //* (this.loopDuration);

    // Try different ways to set values on target
    if (target.getSamplePlayer) {
      // Target has a getSamplePlayer method (like SamplerElement)
      const player = target.getSamplePlayer();
      if (player && player.setLoopStart && player.setLoopEnd) {
        player.setLoopStart(this.loopStartValue);
        player.setLoopEnd(effectiveEndValue);
      }
    } else if (target.setLoopStart && target.setLoopEnd) {
      // Target has direct methods
      target.setLoopStart(this.loopStartValue);
      target.setLoopEnd(effectiveEndValue);
    }
  }

  /**
   * Update the slider ranges based on sample duration
   */
  onSampleSwitch(
    duration: number,
    options: {
      startOffset?: number;
      endOffset?: number;
      savedLoopStart?: number;
      savedLoopEnd?: number;
    } = {}
  ) {
    const {
      startOffset = 0,
      endOffset = duration,
      savedLoopStart,
      savedLoopEnd,
    } = options;
    const loopSliderEl = this.querySelector('#loop-slider') as any;
    if (!loopSliderEl) return;

    // Update constraints first
    loopSliderEl.min = startOffset;
    loopSliderEl.max = endOffset;

    // Determine new values
    let newStart: number;
    let newEnd: number;

    if (savedLoopStart !== undefined && savedLoopEnd !== undefined) {
      // Use saved values (clamped to valid range)
      newStart = Math.max(startOffset, Math.min(savedLoopStart, endOffset));
      newEnd = Math.max(startOffset, Math.min(savedLoopEnd, endOffset));
    } else {
      // Auto-adjust current values or use defaults
      const wasAtMin = this.loopStartValue <= loopSliderEl.min;
      const wasAtMax = this.loopEndValue >= loopSliderEl.max;

      newStart = wasAtMin
        ? startOffset
        : Math.max(startOffset, this.loopStartValue);
      newEnd = wasAtMax ? endOffset : Math.min(endOffset, this.loopEndValue);
    }

    // Apply new values
    loopSliderEl.setValues(newStart, newEnd);

    // Notify callbacks
    this.onOffsetChange?.(startOffset, endOffset);

    // Dispatch event
    this.dispatchEvent(
      new CustomEvent('loop-offset-changed', {
        bubbles: true,
        detail: {
          startOffset,
          endOffset,
          duration,
          loopStart: newStart,
          loopEnd: newEnd,
        },
      })
    );
  }

  /**
   * Set the minimum allowed gap between the loop start and end thumbs
   */
  setMinimumGap(value: number): void {
    const loopSlider = this.querySelector('#loop-slider') as TwoThumbSlider;
    if (loopSlider) {
      loopSlider.setAttribute('minimum-gap', value.toString());
    }
  }

  /**
   * Get the current minimum gap value
   */
  getMinimumGap(): number {
    const loopSlider = this.querySelector('#loop-slider') as TwoThumbSlider;
    if (loopSlider) {
      const gap = loopSlider.getAttribute('minimum-gap');
      return gap ? parseFloat(gap) : 0.001;
    }
    return 0.001;
  }

  /**
   * Set the step increment for the loop slider
   */
  setStep(value: number): void {
    const loopSlider = this.querySelector('#loop-slider') as TwoThumbSlider;
    if (loopSlider) {
      loopSlider.setAttribute('step', value.toString());
    }
  }

  /**
   * Get the current step value
   */
  getStep(): number {
    const loopSlider = this.querySelector('#loop-slider') as TwoThumbSlider;
    if (loopSlider) {
      const step = loopSlider.getAttribute('step');
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
