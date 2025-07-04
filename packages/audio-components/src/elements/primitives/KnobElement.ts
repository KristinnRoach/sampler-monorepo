import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

// Register GSAP plugin
gsap.registerPlugin(Draggable);

interface KnobConfig {
  minValue: number;
  maxValue: number;
  minRotation: number;
  maxRotation: number;
  snapIncrement: number;
  initialValue?: number;
  disabled?: boolean;
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
    minRotation: -135,
    maxRotation: 135,
    snapIncrement: 1,
    initialValue: 0,
    disabled: false,
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
    ];
  }

  constructor() {
    super();
    this.injectGlobalStyles();
  }

  connectedCallback(): void {
    this.render();
    this.updateConfigFromAttributes();
    this.init();
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

      // For width/height changes, we don't need to reinitialize draggable
      if (name === 'width' || name === 'height') {
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
        display: inline-block;
        --knob-size: 120px;
        --knob-bg: inherit;  /* or currentColor ? linear-gradient(145deg, #2d2d2d, #1a1a1a); */
        --knob-border: rgb(234, 234, 234);
        --knob-indicator-color: var(--knob-border); /* rgb(45, 210, 97); */
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
      
      knob-element .knob {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid var(--knob-border);
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
      
      knob-element .knob-indicator {
        position: absolute;
        top: calc(var(--knob-size) * 0.067);
        left: 50%;
        transform: translateX(-50%);
        width: calc(var(--knob-size) * 0.033); 
        height: calc(var(--knob-size) * 0.25);
        background: var(--knob-indicator-color);
        border-radius: calc(var(--knob-size) * 0.017);
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
      minRotation: getValue('min-rotation', -135),
      maxRotation: getValue('max-rotation', 135),
      snapIncrement: getValue('snap-increment', 1),
      initialValue: getValue('value', 0),
      disabled: this.hasAttribute('disabled'),
    };

    // Handle width and height
    this.updateDimensions();
  }

  private updateDimensions(): void {
    const width = this.getAttribute('width');
    const height = this.getAttribute('height');

    if (width || height) {
      const size = width || height || '120'; // Use width, or height, or default
      this.style.setProperty('--knob-size', `${size}px`);
    }
  }

  private render(): void {
    // Create the HTML structure in light DOM
    this.innerHTML = `
      <div class="knob-container">
        <div class="knob">
          <div class="knob-indicator"></div>
          <div class="center-dot"></div>
        </div>
      </div>
    `;

    // Query elements from light DOM
    this.knobElement = this.querySelector('.knob') as HTMLElement;
    this.indicatorElement = this.querySelector(
      '.knob-indicator'
    ) as HTMLElement;
  }

  private init(): void {
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

  //   private createDraggable(): void {
  //     if (this.config.disabled) return;

  //     this.gsapDraggable = Draggable.create(this.knobElement, {
  //       type: 'rotation',
  //       bounds: {
  //         minRotation: this.config.minRotation,
  //         maxRotation: this.config.maxRotation,
  //       },
  //       onDrag: () => this.onDrag(),
  //       onThrowUpdate: () => this.onDrag(),
  //       inertia: true,
  //     })[0];
  //   }

  private createDraggable(): void {
    if (this.config.disabled) return;

    this.gsapDraggable = Draggable.create(this.knobElement, {
      type: 'y',
      bounds: { minY: -100, maxY: 100 },
      onDrag: () => this.onYDrag(),
      onThrowUpdate: () => this.onYDrag(),
      inertia: true,
    })[0];
  }

  private onYDrag(): void {
    // Map Y position to rotation
    const yPos = this.gsapDraggable.y;
    this.currentRotation = gsap.utils.mapRange(
      -100,
      100,
      this.config.maxRotation,
      this.config.minRotation
    )(yPos);

    // Clamp rotation
    this.currentRotation = gsap.utils.clamp(
      this.config.minRotation,
      this.config.maxRotation,
      this.currentRotation
    );

    // Reset position and apply rotation
    gsap.set(this.knobElement, {
      y: 0, // Keep element in original position
      rotation: this.currentRotation,
    });

    // Convert to value and snap
    const rawValue = this.rotationToValue(this.currentRotation);
    this.currentValue = gsap.utils.snap(this.config.snapIncrement, rawValue);

    this.dispatchChangeEvent();
  }

  private onDrag(): void {
    // Get current rotation and clamp it
    this.currentRotation = gsap.utils.clamp(
      this.config.minRotation,
      this.config.maxRotation,
      this.gsapDraggable.rotation
    );

    // Convert rotation to value and snap
    const rawValue = this.rotationToValue(this.currentRotation);
    this.currentValue = gsap.utils.snap(this.config.snapIncrement, rawValue);

    this.dispatchChangeEvent();
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
  public setValue(value: number, animate: boolean = false): void {
    this.currentValue = gsap.utils.clamp(
      this.config.minValue,
      this.config.maxValue,
      value
    );

    this.currentRotation = this.valueToRotation(this.currentValue);

    if (animate) {
      gsap.to(this.knobElement, {
        rotation: this.currentRotation,
        duration: 0.3,
        ease: 'power2.out',
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

// Define the custom element
customElements.define('knob-element', KnobElement);

// Export for TypeScript module usage
export default KnobElement;

// === SHADOW DOM VERSION BELOW === //

// import { gsap } from 'gsap';
// import { Draggable } from 'gsap/Draggable';

// // Register GSAP plugin
// gsap.registerPlugin(Draggable);

// interface KnobConfig {
//   minValue: number;
//   maxValue: number;
//   minRotation: number;
//   maxRotation: number;
//   snapIncrement: number;
//   initialValue?: number;
//   disabled?: boolean;
// }

// interface KnobChangeEventDetail {
//   value: number;
//   rotation: number;
//   percentage: number;
// }

// declare global {
//   interface HTMLElementEventMap {
//     'knob-change': CustomEvent<KnobChangeEventDetail>;
//   }
// }

// export class KnobElement extends HTMLElement {
//   private knobElement!: HTMLElement;
//   private indicatorElement!: HTMLElement;
//   private gsapDraggable!: Draggable;
//   private shadow: ShadowRoot;

//   private config: KnobConfig = {
//     minValue: 0,
//     maxValue: 100,
//     minRotation: -135,
//     maxRotation: 135,
//     snapIncrement: 1,
//     initialValue: 0,
//     disabled: false,
//   };

//   private currentValue: number = 0;
//   private currentRotation: number = 0;
//   private rotationToValue!: (rotation: number) => number;
//   private valueToRotation!: (value: number) => number;

//   // Observed attributes
//   static get observedAttributes(): string[] {
//     return [
//       'min-value',
//       'max-value',
//       'min-rotation',
//       'max-rotation',
//       'snap-increment',
//       'value',
//       'disabled',
//       'width',
//       'height',
//     ];
//   }

//   constructor() {
//     super();
//     this.shadow = this.attachShadow({ mode: 'open' });
//     this.render();
//   }

//   connectedCallback(): void {
//     this.updateConfigFromAttributes();
//     this.init();
//   }

//   disconnectedCallback(): void {
//     this.cleanup();
//   }

//   attributeChangedCallback(
//     name: string,
//     oldValue: string,
//     newValue: string
//   ): void {
//     if (oldValue !== newValue) {
//       this.updateConfigFromAttributes();

//       // For width/height changes, we don't need to reinitialize draggable
//       if (name === 'width' || name === 'height') {
//         return;
//       }

//       if (this.gsapDraggable) {
//         this.reinitialize();
//       }
//     }
//   }

//   private updateConfigFromAttributes(): void {
//     const getValue = (attr: string, defaultValue: number): number => {
//       const value = this.getAttribute(attr);
//       return value !== null ? parseFloat(value) : defaultValue;
//     };

//     this.config = {
//       minValue: getValue('min-value', 0),
//       maxValue: getValue('max-value', 100),
//       minRotation: getValue('min-rotation', -135),
//       maxRotation: getValue('max-rotation', 135),
//       snapIncrement: getValue('snap-increment', 1),
//       initialValue: getValue('value', 0),
//       disabled: this.hasAttribute('disabled'),
//     };

//     // Handle width and height
//     this.updateDimensions();
//   }

//   private updateDimensions(): void {
//     const width = this.getAttribute('width');
//     const height = this.getAttribute('height');

//     if (width || height) {
//       const size = width || height || '120'; // Use width, or height, or default
//       this.style.setProperty('--knob-size', `${size}px`);
//     }
//   }

//   private render(): void {
//     this.shadow.innerHTML = `
//       <style>
//         :host {
//           display: inline-block;
//           --knob-size: 120px;
//           --knob-bg: linear-gradient(145deg, #2d2d2d, #1a1a1a);
//           --knob-border: #333;
//           --indicator-color:rgb(45, 210, 97);
//           --indicator-glow: rgba(0, 255, 136, 0.5);
//         }

//         :host([disabled]) {
//           opacity: 0.5;
//           pointer-events: none;
//         }

//         .knob-container {
//           position: relative;
//           width: var(--knob-size);
//           height: var(--knob-size);
//         }

//         .knob {
//           width: 100%;
//           height: 100%;
//           background: var(--knob-bg);
//           border-radius: 50%;
//           border: 2px solid var(--knob-border);
//           position: relative;
//           cursor: grab;
//           box-shadow:
//             0 4px 8px rgba(11, 11, 11, 0.3),
//             inset 0 1px 3px rgba(255,255,255,0.1);
//           transition: transform 0.1s ease;
//         }

//         .knob:hover {
//           transform: scale(1.02);
//         }

//         .knob:active {
//           cursor: grabbing;
//           transform: scale(0.98);
//         }

//         .knob-indicator {
//           position: absolute;
//           top: calc(var(--knob-size) * 0.067);
//           left: 50%;
//           transform: translateX(-50%);
//           width: calc(var(--knob-size) * 0.033);
//           height: calc(var(--knob-size) * 0.25);
//           background: var(--indicator-color);
//           border-radius: calc(var(--knob-size) * 0.017);
//           box-shadow: 0 0 calc(var(--knob-size) * 0.083) var(--indicator-glow);
//         }

//         .center-dot {
//           position: absolute;
//           top: 50%;
//           left: 50%;
//           transform: translate(-50%, -50%);
//           width: 8px;
//           height: 8px;
//           background: var(--indicator-color);
//           border-radius: 50%;
//           box-shadow: 0 0 6px var(--indicator-glow);
//         }
//       </style>

//       <div class="knob-container">
//         <div class="knob" part="knob">
//           <div class="knob-indicator" part="indicator"></div>
//           <div class="center-dot" part="center"></div>
//         </div>
//       </div>
//     `;

//     this.knobElement = this.shadow.querySelector('.knob') as HTMLElement;
//     this.indicatorElement = this.shadow.querySelector(
//       '.knob-indicator'
//     ) as HTMLElement;
//   }

//   private init(): void {
//     this.createUtilityFunctions();
//     this.createDraggable();
//     this.setValue(this.config.initialValue || this.config.minValue);
//   }

//   private reinitialize(): void {
//     this.cleanup();
//     this.init();
//   }

//   private cleanup(): void {
//     if (this.gsapDraggable) {
//       this.gsapDraggable.kill();
//     }
//   }

//   private createUtilityFunctions(): void {
//     this.rotationToValue = gsap.utils.mapRange(
//       this.config.minRotation,
//       this.config.maxRotation,
//       this.config.minValue,
//       this.config.maxValue
//     );

//     this.valueToRotation = gsap.utils.mapRange(
//       this.config.minValue,
//       this.config.maxValue,
//       this.config.minRotation,
//       this.config.maxRotation
//     );
//   }

//   private createDraggable(): void {
//     if (this.config.disabled) return;

//     this.gsapDraggable = Draggable.create(this.knobElement, {
//       type: 'rotation',
//       bounds: {
//         minRotation: this.config.minRotation,
//         maxRotation: this.config.maxRotation,
//       },
//       onDrag: () => this.onDrag(),
//       onThrowUpdate: () => this.onDrag(),
//       inertia: true,
//     })[0];
//   }

//   private onDrag(): void {
//     // Get current rotation and clamp it
//     this.currentRotation = gsap.utils.clamp(
//       this.config.minRotation,
//       this.config.maxRotation,
//       this.gsapDraggable.rotation
//     );

//     // Convert rotation to value and snap
//     const rawValue = this.rotationToValue(this.currentRotation);
//     this.currentValue = gsap.utils.snap(this.config.snapIncrement, rawValue);

//     this.dispatchChangeEvent();
//   }

//   private dispatchChangeEvent(): void {
//     const percentage = gsap.utils.mapRange(
//       this.config.minValue,
//       this.config.maxValue,
//       0,
//       100
//     )(this.currentValue);

//     const event = new CustomEvent<KnobChangeEventDetail>('knob-change', {
//       detail: {
//         value: this.currentValue,
//         rotation: this.currentRotation,
//         percentage,
//       },
//       bubbles: true,
//     });

//     this.dispatchEvent(event);
//   }

//   // Public API
//   public setValue(value: number, animate: boolean = false): void {
//     this.currentValue = gsap.utils.clamp(
//       this.config.minValue,
//       this.config.maxValue,
//       value
//     );

//     this.currentRotation = this.valueToRotation(this.currentValue);

//     if (animate) {
//       gsap.to(this.knobElement, {
//         rotation: this.currentRotation,
//         duration: 0.3,
//         ease: 'power2.out',
//       });
//     } else {
//       gsap.set(this.knobElement, { rotation: this.currentRotation });
//     }

//     this.dispatchChangeEvent();
//   }

//   public getValue(): number {
//     return this.currentValue;
//   }

//   public getPercentage(): number {
//     return gsap.utils.mapRange(
//       this.config.minValue,
//       this.config.maxValue,
//       0,
//       100
//     )(this.currentValue);
//   }

//   public setDisabled(disabled: boolean): void {
//     if (disabled) {
//       this.setAttribute('disabled', '');
//     } else {
//       this.removeAttribute('disabled');
//     }
//   }

//   public isDisabled(): boolean {
//     return this.hasAttribute('disabled');
//   }

//   // Property getters/setters for easier JS usage
//   get value(): number {
//     return this.getValue();
//   }

//   set value(val: number) {
//     this.setValue(val, true);
//   }

//   get disabled(): boolean {
//     return this.isDisabled();
//   }

//   set disabled(val: boolean) {
//     this.setDisabled(val);
//   }
// }

// // Define the custom element
// customElements.define('knob-element', KnobElement);

// // Export for TypeScript module usage
// export default KnobElement;
