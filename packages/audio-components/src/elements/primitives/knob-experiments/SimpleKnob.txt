export interface KnobChangeEvent extends CustomEvent {
  detail: { value: number };
}

export interface KnobCancelEvent extends CustomEvent {}

export class SimpleKnob extends HTMLElement {
  private _value: number = 0;
  private _min: number = 0;
  private _max: number = 127;
  private _step: number = 1;
  private _diameter: number = 64;
  private _sprites: number = 30;
  private _src: string = '';

  // Mouse interaction state
  private startPos: number | null = null;
  private startVal: number = 0;
  private boundMousemove: ((e: MouseEvent) => void) | null = null;
  private boundCancel: ((e: MouseEvent) => void) | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
    this.setupEventListeners();
  }

  static get observedAttributes(): string[] {
    return ['value', 'min', 'max', 'step', 'diameter', 'sprites', 'src'];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue !== newValue) {
      switch (name) {
        case 'value':
          this._value = parseFloat(newValue || '0') || 0;
          break;
        case 'min':
          this._min = parseFloat(newValue || '0') || 0;
          break;
        case 'max':
          this._max = parseFloat(newValue || '127') || 127;
          break;
        case 'step':
          this._step = parseFloat(newValue || '1') || 1;
          break;
        case 'diameter':
          this._diameter = parseInt(newValue || '64') || 64;
          break;
        case 'sprites':
          this._sprites = parseInt(newValue || '30') || 30;
          break;
        case 'src':
          this._src = newValue || '';
          break;
      }
      this.updateKnob();
    }
  }

  connectedCallback(): void {
    this.updateKnob();
  }

  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        
        #knob {
          cursor: pointer;
          width: 64px;
          height: 64px;
          position: relative;
          border-radius: 50%;
          background: linear-gradient(145deg, #e0e0e0, #a0a0a0);
          border: 2px solid #888;
          box-shadow: 
            inset 2px 2px 5px rgba(255,255,255,0.8),
            inset -2px -2px 5px rgba(0,0,0,0.3),
            2px 2px 8px rgba(0,0,0,0.2);
        }
        
        #knob::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 20px;
          background: #333;
          border-radius: 2px;
          box-shadow: 0 0 2px rgba(0,0,0,0.5);
        }
        
        #value-tip {
          opacity: 0;
          border: solid 1px #666;
          background-color: #eee;
          position: absolute;
          top: 0;
          right: 0;
          padding: 1px 4px;
          font-size: 10px;
          font-family: Helvetica, Arial, sans-serif;
          transition: opacity 0.3s;
          pointer-events: none;
          z-index: 10;
        }
      </style>
      <div class="knob" id="knob">
        <span id="value-tip">${this._value}</span>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const knob = this.shadowRoot?.getElementById('knob');
    if (knob) {
      knob.addEventListener('mousedown', this.handleMouseDown.bind(this));
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const valueTip = this.shadowRoot?.getElementById('value-tip');
    if (valueTip) {
      valueTip.style.opacity = '1';
    }

    this.startPos = e.pageY;
    this.startVal = this._value;

    this.boundMousemove = this.handleMouseMove.bind(this);
    this.boundCancel = this.handleMouseUp.bind(this);

    window.addEventListener('mousemove', this.boundMousemove, true);
    window.addEventListener('mouseup', this.boundCancel, true);

    e.preventDefault();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.startPos === null) return;

    const offset = this.startPos - e.pageY || 0;
    const value =
      this.startVal +
      (e.shiftKey ? Math.floor(offset / 3) : this._step * offset);
    this.updateValue(value);
  }

  private handleMouseUp(e: MouseEvent): void {
    this.startPos = null;
    const valueTip = this.shadowRoot?.getElementById('value-tip');
    if (valueTip) {
      valueTip.style.opacity = '0';
    }

    if (this.boundMousemove) {
      window.removeEventListener('mousemove', this.boundMousemove, true);
    }
    if (this.boundCancel) {
      window.removeEventListener('mouseup', this.boundCancel, true);
    }

    this.dispatchEvent(new CustomEvent('cancel') as KnobCancelEvent);
  }

  private updateValue(value: number): void {
    // Clamp value between min and max
    this._value =
      value < this._min ? this._min : value > this._max ? this._max : value;

    // Update the attribute to reflect the new value
    this.setAttribute('value', this._value.toString());

    this.updateKnobPosition();
    this.updateValueTip();

    // Dispatch change event
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this._value },
        bubbles: true,
      }) as KnobChangeEvent
    );
  }

  private updateKnob(): void {
    const knob = this.shadowRoot?.getElementById('knob');
    if (!knob) return;

    // Update size
    knob.style.width = this._diameter + 'px';
    knob.style.height = this._diameter + 'px';

    // Update background image if provided
    if (this._src) {
      knob.style.backgroundImage = `url(${this._src})`;
      knob.style.backgroundRepeat = 'no-repeat';
      knob.style.backgroundPosition = 'center';
      // Remove CSS styling when using sprite
      knob.style.background = '';
      knob.style.border = '';
      knob.style.boxShadow = '';
      knob.style.borderRadius = '';
    }

    this.updateKnobPosition();
    this.updateValueTip();
  }

  private updateKnobPosition(): void {
    const knob = this.shadowRoot?.getElementById('knob');
    if (!knob) return;

    const range = this._max - this._min;
    const normalizedValue = (this._value - this._min) / range;

    // If using sprites and src is provided
    if (this._src && this._sprites > 1) {
      const spriteIndex = Math.floor(normalizedValue * (this._sprites - 1));
      const yPos = -spriteIndex * this._diameter;

      const knobStyle = knob.style as any;
      if ('backgroundPositionY' in knobStyle) {
        knobStyle.backgroundPositionY = yPos + 'px';
      } else {
        knobStyle.backgroundPosition = `center ${yPos}px`;
      }
    } else {
      // Use CSS rotation (270 degrees range: -135 to +135)
      const rotation = normalizedValue * 270 - 135;
      knob.style.transform = `rotate(${rotation}deg)`;
    }
  }

  private updateValueTip(): void {
    const valueTip = this.shadowRoot?.getElementById('value-tip');
    if (valueTip) {
      valueTip.textContent = (Math.round(this._value * 100) / 100).toString();
    }
  }

  // Getters and setters for properties
  get value(): number {
    return this._value;
  }

  set value(val: number) {
    this._value = parseFloat(val.toString()) || 0;
    this.setAttribute('value', this._value.toString());
  }

  get min(): number {
    return this._min;
  }

  set min(val: number) {
    this._min = parseFloat(val.toString()) || 0;
    this.setAttribute('min', this._min.toString());
  }

  get max(): number {
    return this._max;
  }

  set max(val: number) {
    this._max = parseFloat(val.toString()) || 127;
    this.setAttribute('max', this._max.toString());
  }

  get step(): number {
    return this._step;
  }

  set step(val: number) {
    this._step = parseFloat(val.toString()) || 1;
    this.setAttribute('step', this._step.toString());
  }

  get diameter(): number {
    return this._diameter;
  }

  set diameter(val: number) {
    this._diameter = parseInt(val.toString()) || 64;
    this.setAttribute('diameter', this._diameter.toString());
  }

  get sprites(): number {
    return this._sprites;
  }

  set sprites(val: number) {
    this._sprites = parseInt(val.toString()) || 30;
    this.setAttribute('sprites', this._sprites.toString());
  }

  get src(): string {
    return this._src;
  }

  set src(val: string) {
    this._src = val || '';
    this.setAttribute('src', this._src);
  }
}

// Register the custom element
customElements.define('simple-knob', SimpleKnob);
