export class KnobElement extends HTMLElement {
  private _value: number = 50;
  private rotation: number = 0;
  private isDragging: boolean = false;

  static get observedAttributes() {
    return ['value', 'min', 'max'];
  }

  get value(): number {
    return this._value;
  }
  set value(v: number) {
    this._value = Math.max(this.min, Math.min(this.max, v));
    this.updateRotation();
    this.dispatchEvent(new Event('change'));
  }

  get min(): number {
    return parseInt(this.getAttribute('min') || '0');
  }
  get max(): number {
    return parseInt(this.getAttribute('max') || '100');
  }

  constructor() {
    super();
    this.innerHTML = `<div class="knob"></div>`;
  }

  connectedCallback() {
    this.setupEventListeners();
    this.updateRotation();
  }

  private setupEventListeners() {
    (this.querySelector('.knob') as HTMLElement)!.addEventListener(
      'mousedown',
      this.startDrag.bind(this)
    );
    window.addEventListener('mousemove', this.handleDrag.bind(this));
    window.addEventListener('mouseup', this.endDrag.bind(this));
  }

  private startDrag(e: MouseEvent) {
    this.isDragging = true;
    e.preventDefault();
  }

  private handleDrag(e: MouseEvent) {
    if (!this.isDragging) return;
    const rect = this.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const centerX = rect.left + rect.width / 2;
    const angle =
      (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
    this.rotation = angle;
    this.value = this.calculateValueFromRotation();
    this.updateRotation();
  }

  private endDrag() {
    this.isDragging = false;
  }

  private calculateValueFromRotation(): number {
    const range = this.max - this.min;
    const normalized = ((this.rotation + 150) % 360) / 240;
    return Math.round(this.min + Math.min(1, Math.max(0, normalized)) * range);
  }

  private updateRotation() {
    const knob = this.querySelector('.knob') as HTMLElement;
    const rotation =
      ((this.value - this.min) / (this.max - this.min)) * 240 - 150;
    knob.style.transform = `rotate(${rotation}deg)`;
  }

  attributeChangedCallback() {
    this.value = this._value;
  }
}

customElements.define('knob-element', KnobElement);

//   <style>
//     value-knob {
//       display: inline-block;
//       width: 50px;
//       height: 50px;
//     }
//     .knob {
//       width: 100%;
//       height: 100%;
//       border-radius: 50%;
//       background: #eee;
//       border: 2px solid #999;
//       cursor: pointer;
//     }
//     .knob::before {
//       content: '';
//       display: block;
//       width: 20%;
//       height: 20%;
//       background: #333;
//       position: absolute;
//       top: 10%;
//       left: 50%;
//       transform: translateX(-50%);
//       border-radius: 50%;
//     }
//   </style>
// </head>
// <body>
//   <h1>Knob Test</h1>
//   <value-knob value="30" min="0" max="100"></value-knob>
//   <p>Current value: <span id="value-output">30</span></p>
// </body>
// </html>
