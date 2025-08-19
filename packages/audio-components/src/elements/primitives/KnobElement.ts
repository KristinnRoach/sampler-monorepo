// KnobElement.ts
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

export interface KnobConfig {
  minValue: number;
  maxValue: number;
  defaultValue: number;
  minRotation: number;
  maxRotation: number;
  snapIncrement: number;
  allowedValues?: number[];
  curve?: number;
  snapThresholds?: Array<{ maxValue: number; increment: number }>;
  disabled?: boolean;
  borderStyle?: 'currentState' | 'fullCircle';
}

export interface KnobChangeEventDetail {
  value: number;
  rotation: number;
  percentage: number;
}

declare global {
  interface HTMLElementEventMap {
    'knob-change': CustomEvent<KnobChangeEventDetail>;
  }
}

export class KnobElement extends HTMLElement {
  private knobElement!: HTMLElement;
  private indicatorElement!: HTMLElement;
  private pathElement!: SVGPathElement;

  private gsapDraggable!: Draggable;
  private static stylesInjected = false;

  private config: KnobConfig = {
    minValue: 0,
    maxValue: 100,
    defaultValue: 0,
    minRotation: -170,
    maxRotation: 170,
    snapIncrement: 1,
    curve: 1,
    disabled: false,
    borderStyle: 'currentState',
  };

  private currentValue: number = 0;
  private currentRotation: number = 0;
  private rotationToValue!: (rotation: number) => number;
  private valueToRotation!: (value: number) => number;
  private applySnapping!: (value: number) => number;

  // Observed attributes
  static get observedAttributes(): string[] {
    return [
      'min-value',
      'max-value',
      'default-value',
      'min-rotation',
      'max-rotation',
      'snap-increment',
      'allowed-values',
      'value',
      'disabled',
      'width',
      'height',
      'border-style',
      'curve',
    ];
  }

  constructor() {
    super();
  }

  connectedCallback(): void {
    this.injectGlobalStyles();
    this.createUtilityFunctions();
    this.render();

    setTimeout(() => {
      this.createDraggable();
      this.setValue(this.config.defaultValue || this.config.minValue);
    }, 0);

    // ! This does not work // TODO: make dblclick handler work
    // Double-click to reset to default value (attach to knobElement after render)
    //   setTimeout(() => {
    //     const container = this.querySelector('.knob-container');
    //     if (container) {
    //       container.addEventListener('dblclick', (e) => {
    //         console.debug('dblclick on container', e.target);
    //       });
    //     }
    //     if (this.knobElement) {
    //       this.knobElement.addEventListener('dblclick', (e) => {
    //         console.debug('dblclick on knob', e.target);
    //       });
    //     }
    //     // Also try on the custom element itself
    //     this.addEventListener('dblclick', (e) => {
    //       console.debug('dblclick on custom element', e.target);
    //     });
    //   }, 0);
  }

  disconnectedCallback(): void {
    this.cleanup();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (oldValue !== newValue) {
      // Handle min/max changes BEFORE updating config
      if (name === 'max-value' || name === 'min-value') {
        const oldMin = this.config.minValue;
        const oldMax = this.config.maxValue;

        // Update config first
        this.updateConfigFromAttributes();
        this.updateBorder();

        // Scale current value from old range to new range
        let scaledValue: number;

        if (name === 'max-value') {
          scaledValue = gsap.utils.mapRange(
            oldMin, // old min
            parseFloat(oldValue), // old max
            this.config.minValue, // new min
            this.config.maxValue, // new max
            this.currentValue
          );
        } else {
          // min-value
          scaledValue = gsap.utils.mapRange(
            parseFloat(oldValue), // old min
            oldMax, // old max
            this.config.minValue, // new min
            this.config.maxValue, // new max
            this.currentValue
          );
        }

        // Clamp to new bounds and update visually
        this.createUtilityFunctions();
        this.setValue(scaledValue); // This will clamp and update visuals

        return;
      }

      // Handle other attributes normally
      this.updateConfigFromAttributes();
      this.updateBorder();

      if (name === 'width' || name === 'height') return;
      if (name === 'border-style') return;

      if (name === 'curve') {
        this.createUtilityFunctions();
        this.setValue(this.currentValue); // Refresh with new curve
        return;
      }

      if (this.gsapDraggable) {
        this.reinitialize();
      }
    }
  }

  private injectGlobalStyles(): void {
    // Only inject styles once globally
    if (KnobElement.stylesInjected) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'knob-element-styles';
    styleElement.textContent = `
      knob-element {
        display: block;
        box-sizing: border-box;

        --knob-size: 120px;
        --knob-bg: inherit;  /* or currentColor ? linear-gradient(145deg, #2d2d2d, #1a1a1a); */
        --knob-border: rgb(234, 234, 234);
        --knob-indicator-color: var(--knob-border); 

        width: var(--knob-size, 120px);  /* Default, but overridable */
        height: var(--knob-size, 120px);
      }
      
      knob-element[disabled] {
        opacity: 0.5;
        pointer-events: none; 
      }
      
      knob-element .knob-container {
        position: relative;
        width: 100%; /* Fill parent */
        height: 100%; 
      }

      knob-element .knob-border-svg {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }
      
      knob-element .knob {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        position: relative;
        cursor: grab;
        transition: transform 0.1s ease;
      }
      
      knob-element .knob:hover {
        transform: scale(1.05);
      }
      
      knob-element .knob:active {
        cursor: grabbing;
        transform: scale(0.95);
      }
      
    `;

    document.head.appendChild(styleElement);
    KnobElement.stylesInjected = true;
  }

  private updateConfigFromAttributes(): void {
    const getNumericValue = (attr: string, defaultValue: number): number => {
      const value = this.getAttribute(attr);
      return value !== null ? parseFloat(value) : defaultValue;
    };

    const getStringValue = <T extends string>(
      attr: string,
      defaultValue: T
    ): T => {
      return (this.getAttribute(attr) as T) || defaultValue;
    };

    const getJsonValue = <T>(attr: string): T | undefined => {
      const value = this.getAttribute(attr);
      if (!value) return undefined;

      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn(`KnobElement: Invalid ${attr} JSON:`, value);
        return undefined;
      }
    };

    // Get allowedValues first to potentially override min/max
    const allowedValues = getJsonValue<number[]>('allowed-values');
    let minValue = getNumericValue('min-value', 0);
    let maxValue = getNumericValue('max-value', 100);

    // If allowedValues are provided, sort them and set min/max automatically
    if (allowedValues && allowedValues.length > 0) {
      const sortedValues = [...allowedValues].sort((a, b) => a - b);
      const autoMinValue = sortedValues[0];
      const autoMaxValue = sortedValues[sortedValues.length - 1];

      // Log if manually set min/max/snap don't match allowedValues
      if (this.hasAttribute('min-value') && minValue !== autoMinValue) {
        console.debug(
          `KnobElement: min-value (${minValue}) doesn't match first allowedValue (${autoMinValue}). Using ${autoMinValue}.`
        );
      }
      if (this.hasAttribute('max-value') && maxValue !== autoMaxValue) {
        console.debug(
          `KnobElement: max-value (${maxValue}) doesn't match last allowedValue (${autoMaxValue}). Using ${autoMaxValue}.`
        );
      }
      if (this.hasAttribute('snap-thresholds')) {
        console.debug(
          'KnobElement: allowedValues overrides snap-increment and snap-thresholds.'
        );
      }

      minValue = autoMinValue;
      maxValue = autoMaxValue;
    }

    this.config = {
      minValue,
      maxValue,
      defaultValue: getNumericValue('default-value', 0),
      minRotation: getNumericValue('min-rotation', -150),
      maxRotation: getNumericValue('max-rotation', 150),
      snapIncrement: getNumericValue('snap-increment', 1),
      curve: getNumericValue('curve', 1),

      borderStyle: getStringValue<'currentState' | 'fullCircle'>(
        'border-style',
        'currentState'
      ),

      allowedValues: allowedValues
        ? [...allowedValues].sort((a, b) => a - b)
        : undefined,

      snapThresholds:
        getJsonValue<Array<{ maxValue: number; increment: number }>>(
          'snap-thresholds'
        ),
      disabled: this.hasAttribute('disabled'),
    };

    this.updateDimensions();
  }

  private updateDimensions(): void {
    const width = this.getAttribute('width');
    const height = this.getAttribute('height');

    if (width || height) {
      const size = width || height || '120';
      this.style.setProperty('--knob-size', `${size}px`);
    }
  }

  private render(): void {
    this.innerHTML = `
    <div class="knob-container">
      <!-- SVG border (doesn't rotate) -->
      <svg class="knob-border-svg" width="100%" height="100%" viewBox="0 0 100 100">
          <path class="knob-border" 
                fill="none" 
                stroke="var(--knob-border)" 
                stroke-width="4" 
                d="M50,50Z"/>
      </svg>
      
      <!-- Rotating knob content -->
      <div class="knob">
        <div class="knob-indicator"></div>
      </div>

    </div>
  `;

    this.knobElement = this.querySelector('.knob') as HTMLElement;
    this.indicatorElement = this.querySelector(
      '.knob-indicator'
    ) as HTMLElement;

    this.pathElement = this.querySelector('.knob-border') as SVGPathElement;
  }

  private reinitialize(): void {
    this.cleanup();
    this.createUtilityFunctions();
    this.createDraggable();
    this.setValue(this.config.defaultValue || this.config.minValue);
  }

  private cleanup(): void {
    if (this.gsapDraggable) {
      this.gsapDraggable.kill();
    }
  }

  private createUtilityFunctions(): void {
    // Exponential factor
    const curve = this.config.curve || 1; // 1 = linear, 2 = quadratic, etc.

    this.rotationToValue = (rotation: number) => {
      // Map rotation to 0-1 range
      const normalizedRotation = gsap.utils.mapRange(
        this.config.minRotation,
        this.config.maxRotation,
        0,
        1
      )(rotation);

      // Apply exponential curve
      const curvedValue = Math.pow(normalizedRotation, curve);

      // Map back to actual value range
      const value = gsap.utils.mapRange(
        0,
        1,
        this.config.minValue,
        this.config.maxValue
      )(curvedValue);

      return value;
    };

    this.valueToRotation = (value: number) => {
      // Reverse the process
      const normalizedValue = gsap.utils.mapRange(
        this.config.minValue,
        this.config.maxValue,
        0,
        1
      )(value);

      // Apply inverse curve
      const curvedRotation = Math.pow(normalizedValue, 1 / curve);

      return gsap.utils.mapRange(
        0,
        1,
        this.config.minRotation,
        this.config.maxRotation
      )(curvedRotation);
    };

    this.applySnapping = (value: number): number => {
      // If allowedValues is specified, snap to the nearest allowed value
      if (this.config.allowedValues && this.config.allowedValues.length > 0) {
        return this.config.allowedValues.reduce((closest, current) => {
          return Math.abs(current - value) < Math.abs(closest - value)
            ? current
            : closest;
        });
      }

      if (this.config.snapIncrement <= 0) return value;

      let snapIncrement = this.config.snapIncrement;

      if (this.config.snapThresholds) {
        // Find the right increment for current value
        for (const { maxValue, increment } of this.config.snapThresholds) {
          if (value < maxValue) {
            snapIncrement = increment;
            break;
          }
        }
      }

      return Math.round(value / snapIncrement) * snapIncrement;
    };
  }

  private createDraggable(): void {
    if (this.config.disabled) return;

    const pointerLockSupported =
      'pointerLockElement' in document &&
      'requestPointerLock' in HTMLElement.prototype;

    if (!pointerLockSupported)
      console.info(`KnobElement: Pointer lock not supported`);

    let startRotation = 0;
    let totalDeltaY = 0;
    let mouseMoveHandler: (e: MouseEvent) => void;
    let isTouchDevice = false;
    let startY = 0;

    this.gsapDraggable = Draggable.create(this.knobElement, {
      type: 'y',
      inertia: false,
      overshootTolerance: 0,
      bounds: {
        minRotation: this.config.minRotation,
        maxRotation: this.config.maxRotation,
      },
      onPress: (e: PointerEvent | TouchEvent | MouseEvent) => {
        startRotation = this.currentRotation;
        totalDeltaY = 0;

        // Detect if this is a touch event
        isTouchDevice = 'touches' in e;

        // Store the starting Y position for touch devices
        if (isTouchDevice && 'touches' in e) {
          const touch = e.touches[0];
          if (touch) {
            startY = touch.clientY;
          }
        }

        // Only use pointer lock for non-touch devices
        if (pointerLockSupported && !isTouchDevice) {
          this.knobElement.requestPointerLock();

          mouseMoveHandler = (e: MouseEvent) => {
            if (document.pointerLockElement === this.knobElement) {
              totalDeltaY += e.movementY;

              const sensitivity = 4.0;
              const newRotation = startRotation - totalDeltaY * sensitivity;

              const clampedRotation = gsap.utils.clamp(
                this.config.minRotation,
                this.config.maxRotation,
                newRotation
              );

              const rawValue = this.rotationToValue(clampedRotation);
              const snappedValue = this.applySnapping(rawValue);
              this.currentValue = snappedValue;

              if (snappedValue !== rawValue) {
                this.currentRotation = this.valueToRotation(snappedValue);
              } else {
                this.currentRotation = clampedRotation;
              }

              gsap.set(this.knobElement, {
                y: 0,
                rotation: this.currentRotation,
                duration: 0,
              });

              this.updateBorder();
              this.dispatchChangeEvent();
            }
          };
          document.addEventListener('mousemove', mouseMoveHandler);
        }
      },

      onDrag: () => {
        // Handle drag for both touch and non-pointer-lock mouse
        if (!pointerLockSupported || isTouchDevice) {
          const sensitivity = 4.0;

          // For touch devices, GSAP's y represents the delta from start
          // For mouse without pointer lock, it's the same
          const deltaY = this.gsapDraggable.y;
          const newRotation = startRotation - deltaY * sensitivity;

          const clampedRotation = gsap.utils.clamp(
            this.config.minRotation,
            this.config.maxRotation,
            newRotation
          );

          const rawValue = this.rotationToValue(clampedRotation);
          const snappedValue = this.applySnapping(rawValue);

          this.currentValue = snappedValue;

          if (snappedValue !== rawValue) {
            this.currentRotation = this.valueToRotation(snappedValue);
          } else {
            this.currentRotation = clampedRotation;
          }

          gsap.set(this.knobElement, {
            rotation: this.currentRotation,
            y: 0,
          });

          this.updateBorder();
          this.dispatchChangeEvent();
        }
      },

      onRelease: () => {
        // Clean up pointer lock for non-touch devices
        if (pointerLockSupported && !isTouchDevice) {
          document.exitPointerLock();
          if (mouseMoveHandler) {
            document.removeEventListener('mousemove', mouseMoveHandler);
          }
        }

        // Reset touch device flag
        isTouchDevice = false;
      },
    })[0];
  }

  private updateBorder(): void {
    if (!this.pathElement) return;

    const borderStyle = this.getAttribute('border-style') || 'currentState';

    if (borderStyle === 'currentState') {
      const r = 48;
      const cx = 50;
      const cy = 50;

      const startAngle = ((this.config.minRotation - 90) * Math.PI) / 180;
      const currentAngle = ((this.currentRotation - 90) * Math.PI) / 180;

      const startX = r * Math.cos(startAngle) + cx;
      const startY = r * Math.sin(startAngle) + cy;
      const endX = r * Math.cos(currentAngle) + cx;
      const endY = r * Math.sin(currentAngle) + cy;

      const totalAngle = this.currentRotation - this.config.minRotation;
      const largeArc = Math.abs(totalAngle) > 180 ? 1 : 0;

      const pathData = `M${cx},${cy} L${startX},${startY} A${r},${r},0,${largeArc},1,${endX},${endY} Z`;
      this.pathElement.setAttribute('d', pathData);
    } else {
      this.pathElement.setAttribute('d', `M50,2 A48,48,0,1,1,49.9,2 Z`);
    }
  }

  private dispatchChangeEvent(): void {
    const percentage = gsap.utils.mapRange(
      this.config.minValue,
      this.config.maxValue,
      0,
      100
    )(this.currentValue);

    const event = new CustomEvent<KnobChangeEventDetail>('knob-change', {
      detail: {
        value: this.currentValue,
        rotation: this.currentRotation,
        percentage,
      },
      bubbles: true,
    });

    this.dispatchEvent(event);
  }

  // Public API
  public setValue(
    value: number,
    animate: boolean = false,
    animationOptions?: { duration: number; ease: string }
  ): void {
    // Guard against calls before initialization
    if (!this.valueToRotation || !this.knobElement || !this.pathElement) return;

    this.currentValue = gsap.utils.clamp(
      this.config.minValue,
      this.config.maxValue,
      value
    );

    this.currentRotation = this.valueToRotation(this.currentValue);

    if (animate) {
      gsap.to(this.knobElement, {
        rotation: this.currentRotation,
        duration: animationOptions?.duration ?? 0.3,
        ease: animationOptions?.ease || 'power2.out',
      });
    } else {
      gsap.set(this.knobElement, { rotation: this.currentRotation });
    }

    this.updateBorder();

    this.dispatchChangeEvent();
  }

  public getValue(): number {
    return this.currentValue;
  }

  public setCurve(curve: number): void {
    this.config.curve = curve;
    this.createUtilityFunctions();
    // Refresh the current value to apply the new curve
    this.setValue(this.currentValue);
  }

  public getCurve(): number {
    return this.config.curve || 1;
  }

  public setDisabled(disabled: boolean): void {
    if (disabled) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  public isDisabled(): boolean {
    return this.hasAttribute('disabled');
  }

  public getPercentage(): number {
    return gsap.utils.mapRange(
      this.config.minValue,
      this.config.maxValue,
      0,
      100
    )(this.currentValue);
  }

  // Property getters/setters for easier JS usage
  get value(): number {
    return this.getValue();
  }

  set value(val: number) {
    this.setValue(val, false);
  }

  get disabled(): boolean {
    return this.isDisabled();
  }

  set disabled(val: boolean) {
    this.setDisabled(val);
  }
}

export default KnobElement;

// Note: Defining elements has been delegated to src/elements/elementRegistry.ts
// customElements.define('knob-element', KnobElement);
