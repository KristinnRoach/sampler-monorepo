// KnobElement.ts
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

interface KnobConfig {
  minValue: number;
  maxValue: number;
  minRotation: number;
  maxRotation: number;
  snapIncrement: number;
  initialValue?: number;
  disabled?: boolean;
  borderStyle?: 'currentState' | 'fullCircle';
}

interface KnobChangeEventDetail {
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

  private gsapDraggable!: Draggable;
  private static stylesInjected = false;

  private config: KnobConfig = {
    minValue: 0,
    maxValue: 100,
    minRotation: -170,
    maxRotation: 170,
    snapIncrement: 0.01,
    initialValue: 0,
    disabled: false,
    borderStyle: 'currentState',
  };

  private currentValue: number = 0;
  private currentRotation: number = 0;
  private rotationToValue!: (rotation: number) => number;
  private valueToRotation!: (value: number) => number;

  // Observed attributes
  static get observedAttributes(): string[] {
    return [
      'min-value',
      'max-value',
      'min-rotation',
      'max-rotation',
      'snap-increment',
      'value',
      'disabled',
      'width',
      'height',
      'border-style',
    ];
  }

  constructor() {
    super();
    this.injectGlobalStyles();
  }

  connectedCallback(): void {
    this.render();
    this.updateConfigFromAttributes();

    setTimeout(() => this.init(), 0);
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
      this.updateConfigFromAttributes();

      // For width/height and border-style changes, we don't need to reinitialize gsap's draggable
      if (name === 'width' || name === 'height') return;
      if (name === 'border-style') return;

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
        display: inline-block;
        --knob-size: 120px;
        --knob-bg: inherit;  /* or currentColor ? linear-gradient(145deg, #2d2d2d, #1a1a1a); */
        --knob-border: rgb(234, 234, 234);
        --knob-indicator-color: var(--knob-border); 

       min-height: 30px;
       min-width: 30px;
      }
      
      knob-element[disabled] {
        opacity: 0.5;
        pointer-events: none;
      }
      
      knob-element .knob-container {
        position: relative;
        width: var(--knob-size);
        height: var(--knob-size);
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
      
      knob-element .center-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 4px;
        background: var(--knob-indicator-color);
        border-radius: 50%;
      }
    `;

    document.head.appendChild(styleElement);
    KnobElement.stylesInjected = true;
  }

  private updateConfigFromAttributes(): void {
    const getValue = (attr: string, defaultValue: number): number => {
      const value = this.getAttribute(attr);
      return value !== null ? parseFloat(value) : defaultValue;
    };

    this.config = {
      minValue: getValue('min-value', 0),
      maxValue: getValue('max-value', 100),
      minRotation: getValue('min-rotation', -150),
      maxRotation: getValue('max-rotation', 150),
      snapIncrement: getValue('snap-increment', 1),
      initialValue: getValue('value', 0),
      disabled: this.hasAttribute('disabled'),
      borderStyle:
        (this.getAttribute('border-style') as
          | 'currentState'
          | 'fullCircle'
          | undefined) || 'currentState',
    };

    this.updateBorder();
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
        <div class="center-dot"></div>
      </div>
    </div>
  `;

    this.knobElement = this.querySelector('.knob') as HTMLElement;
    this.indicatorElement = this.querySelector(
      '.knob-indicator'
    ) as HTMLElement;
  }

  private init(): void {
    if (!this.knobElement) {
      console.error('Knob element not found, retrying...');
      setTimeout(() => this.init(), 10);
      return;
    }

    this.createUtilityFunctions();
    this.createDraggable();
    this.setValue(this.config.initialValue || this.config.minValue);
  }

  private reinitialize(): void {
    this.cleanup();
    this.init();
  }

  private cleanup(): void {
    if (this.gsapDraggable) {
      this.gsapDraggable.kill();
    }
  }

  private createUtilityFunctions(): void {
    this.rotationToValue = gsap.utils.mapRange(
      this.config.minRotation,
      this.config.maxRotation,
      this.config.minValue,
      this.config.maxValue
    );

    this.valueToRotation = gsap.utils.mapRange(
      this.config.minValue,
      this.config.maxValue,
      this.config.minRotation,
      this.config.maxRotation
    );
  }

  private createDraggable(): void {
    if (this.config.disabled) return;

    let startRotation = 0;
    let totalDeltaY = 0;
    let mouseMoveHandler: (e: MouseEvent) => void;

    this.gsapDraggable = Draggable.create(this.knobElement, {
      type: 'y',
      inertia: false,
      overshootTolerance: 0,
      bounds: {
        minRotation: this.config.minRotation,
        maxRotation: this.config.maxRotation,
      },
      onPress: () => {
        this.knobElement.requestPointerLock();

        startRotation = this.currentRotation;
        totalDeltaY = 0;

        mouseMoveHandler = (e: MouseEvent) => {
          if (document.pointerLockElement === this.knobElement) {
            totalDeltaY += e.movementY;

            const sensitivity = 4.0; // Adjust as needed
            const newRotation = startRotation - totalDeltaY * sensitivity;

            this.currentRotation = gsap.utils.clamp(
              this.config.minRotation,
              this.config.maxRotation,
              newRotation
            );

            gsap.set(this.knobElement, {
              y: 0,
              rotation: this.currentRotation,
              duration: 0,
            });

            const rawValue = this.rotationToValue(this.currentRotation);

            this.currentValue = rawValue;
            this.dispatchChangeEvent();
          }
        };
        document.addEventListener('mousemove', mouseMoveHandler);
      },
      onRelease: () => {
        document.exitPointerLock();
        if (mouseMoveHandler) {
          document.removeEventListener('mousemove', mouseMoveHandler);
        }
      },
    })[0];
  }

  private updateBorder(): void {
    const borderStyle = this.getAttribute('border-style') || 'currentState';
    const path = this.querySelector('.knob-border') as SVGPathElement;
    if (!path) {
      console.warn('Path does not exist, retrying... ');
      setTimeout(() => this.updateBorder(), 10);
    }

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
      path.setAttribute('d', pathData);
    } else {
      path.setAttribute('d', `M50,2 A48,48,0,1,1,49.9,2 Z`);
    }
  }

  private dispatchChangeEvent(): void {
    this.updateBorder();

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
    if (!this.valueToRotation) {
      console.warn('setValue called before initialization, deferring...');
      // Store the value to set after init
      this.config.initialValue = value;
      return;
    }
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

    this.dispatchChangeEvent();
  }

  public getValue(): number {
    return this.currentValue;
  }

  public getPercentage(): number {
    return gsap.utils.mapRange(
      this.config.minValue,
      this.config.maxValue,
      0,
      100
    )(this.currentValue);
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

  // Property getters/setters for easier JS usage
  get value(): number {
    return this.getValue();
  }

  set value(val: number) {
    this.setValue(val, true);
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
