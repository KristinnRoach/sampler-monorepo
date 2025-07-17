// Minimal Vanilla TypeScript Knob Web Component

class KnobElement extends HTMLElement {
  private _value: number = 50;
  private _min: number = 0;
  private _max: number = 100;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartValue: number = 0;
  private indicator!: SVGCircleElement;
  private container!: HTMLDivElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
    this.setupEvents();
  }

  static get observedAttributes() {
    return ['value', 'min', 'max'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'value':
        this._value = parseFloat(newValue) || 0;
        break;
      case 'min':
        this._min = parseFloat(newValue) || 0;
        break;
      case 'max':
        this._max = parseFloat(newValue) || 100;
        break;
    }
    this.updateVisual();
  }

  get value(): number {
    return this._value;
  }

  set value(val: number) {
    const clamped = Math.max(this._min, Math.min(this._max, val));
    if (clamped !== this._value) {
      this._value = clamped;
      this.setAttribute('value', clamped.toString());
      this.updateVisual();
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: clamped },
          bubbles: true,
        })
      );
    }
  }

  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 60px;
          height: 60px;
          cursor: grab;
          user-select: none;
        }
        
        :host(.dragging) {
          cursor: grabbing;
        }
        
        .knob-container {
          width: 100%;
          height: 100%;
        }
        
        svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }
        
        .indicator {
          transform-origin: 30px 30px;
          transition: transform 0.1s ease;
        }
      </style>
      
      <div class="knob-container">
        <svg viewBox="0 0 60 60">
          <defs>
            <radialGradient id="knob-shadow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="85%" stop-color="#242a2e" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#242a2e" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="knob-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#52595f"/>
              <stop offset="100%" stop-color="#2b3238"/>
            </linearGradient>
          </defs>
          
          <g class="knob-body">
            <circle cx="30" cy="30" r="24" fill="url(#knob-shadow)"/>
            <ellipse cx="30" cy="32" rx="21" ry="22" fill="#242a2e" opacity="0.15"/>
            <circle cx="30" cy="30" r="21" fill="url(#knob-base)" stroke="#242a2e" stroke-width="1.5"/>
            <circle class="indicator" cx="30" cy="12" r="2" fill="#4eccff"/>
          </g>
        </svg>
      </div>
    `;

    this.container = this.shadowRoot.querySelector(
      '.knob-container'
    ) as HTMLDivElement;
    this.indicator = this.shadowRoot.querySelector(
      '.indicator'
    ) as SVGCircleElement;
    this.updateVisual();
  }

  private updateVisual(): void {
    if (!this.indicator) return;

    const normalizedValue = (this._value - this._min) / (this._max - this._min);
    const rotation = normalizedValue * 270;
    this.indicator.style.transform = `rotate(${rotation}deg)`;
  }

  private setupEvents(): void {
    this.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.addEventListener('dblclick', this.onDoubleClick.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.startDrag(e.clientY);

    const onMouseMove = (e: MouseEvent) => this.updateDrag(e.clientY);
    const onMouseUp = () => this.endDrag(onMouseMove, onMouseUp);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.startDrag(touch.clientY);

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.updateDrag(touch.clientY);
    };
    const onTouchEnd = () => this.endDrag(onTouchMove, onTouchEnd);

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }

  private onDoubleClick(): void {
    const midValue = (this._min + this._max) / 2;
    this.value = midValue;
  }

  private startDrag(clientY: number): void {
    this.isDragging = true;
    this.dragStartY = clientY;
    this.dragStartValue = this._value;
    this.classList.add('dragging');
    document.body.style.cursor = 'grabbing';
  }

  private updateDrag(clientY: number): void {
    if (!this.isDragging) return;

    const deltaY = clientY - this.dragStartY;
    const sensitivity = 200;
    const range = this._max - this._min;
    const delta = -(deltaY / sensitivity) * range;
    const newValue = this.dragStartValue + delta;

    this.value = newValue;

    // Dispatch input event for real-time updates
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: this._value },
        bubbles: true,
      })
    );
  }

  private endDrag(mouseMoveHandler: any, mouseUpHandler: any): void {
    this.isDragging = false;
    this.classList.remove('dragging');
    document.body.style.cursor = '';

    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('touchmove', mouseMoveHandler);
    document.removeEventListener('touchend', mouseUpHandler);
  }
}

// Register the custom element
customElements.define('knob-element', KnobElement);

// Test app using the vanilla web component
const createApp = (): HTMLElement => {
  const app = document.createElement('div');
  app.style.cssText = 'padding: 20px; font-family: Arial, sans-serif;';

  const title = document.createElement('div');
  title.textContent = 'Vanilla Web Component Knob:';
  title.style.marginBottom = '20px';

  const valueDisplay = document.createElement('div');
  valueDisplay.textContent = 'Value: 50';
  valueDisplay.style.marginBottom = '20px';

  const knob = document.createElement('knob-element') as KnobElement;
  knob.setAttribute('min', '0');
  knob.setAttribute('max', '100');
  knob.setAttribute('value', '50');

  // Event listeners
  knob.addEventListener('input', (e: any) => {
    valueDisplay.textContent = `Value: ${Math.round(e.detail.value)}`;
  });

  knob.addEventListener('change', (e: any) => {
    // console.log('Final value:', e.detail.value);
  });

  app.appendChild(title);
  app.appendChild(valueDisplay);
  app.appendChild(knob);

  return app;
};

// Export for use
export { KnobElement, createApp };

// Usage:
// document.body.appendChild(createApp());
