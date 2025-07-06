import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

class SliderGSAP extends HTMLElement {
  svg!: SVGElement;
  thumbs!: SVGCircleElement[];
  track!: SVGLineElement;

  positionsPixels: number[];
  sliderMinPx: number = 10;
  sliderMaxPx: number = 210;
  sliderWidthPx: number = 200;

  constructor() {
    super();
    this.positionsPixels = [10, 210];
  }

  connectedCallback() {
    this.innerHTML = `
      <style>
        .slider-container {
          position: relative;
          width: 220px;
          height: 20px;
          margin: 20px auto;
        }

        .slider-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .slider-thumb {
          cursor: pointer;
          fill: #2196f3;
          stroke: #fff;
          stroke-width: 2;
        }

        .slider-thumb:hover {
          fill: #1976d2;
        }

        .slider-track {
          stroke: #ddd;
          stroke-width: 4;
          stroke-linecap: round;
        }

        .output-values {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 5px;
          background:rgb(100, 100, 100);
          border: 1px solid #ddd;
          border-radius: 4px;

          margin: 5px 0;
          margin-top: 10px;
          font-family: Arial, sans-serif;
          font-size: 14px;
        }
      </style>
      
      <div class="slider-container">
        <svg class="slider-svg" viewBox="0 0 220 20">
          <line class="slider-track" x1="10" y1="10" x2="210" y2="10"></line>
            <circle class="slider-thumb" r="8" cx="0" cy="10" data-thumb="0"></circle>
            <circle class="slider-thumb" r="8" cx="0" cy="10" data-thumb="1"></circle>
        </svg>
      </div>

      <!--
      <div class="output-values">
        <span>Thumb:</span>
        <span>%</span>
        <span>First:</span>
        <span id="value-0">${this.positionsPixels[0].toFixed(2)}</span>
        <span>Second:</span>
        <span id="value-1">${this.positionsPixels[1].toFixed(2)}</span>
      </div>
        -->
    `;

    this.svg = this.querySelector('.slider-svg')!;
    this.track = this.querySelector('.slider-track')!;
    this.thumbs = Array.from(
      this.querySelectorAll('.slider-thumb')
    ) as SVGCircleElement[];

    this.initializeGSAP();
    this.updateThumbs();
  }

  initializeGSAP() {
    if (typeof gsap === 'undefined') {
      console.error('GSAP is not loaded');
      return;
    }
    gsap.registerPlugin(Draggable);

    // Set initial positions
    gsap.set(this.thumbs[0], { x: this.positionsPixels[0] });
    gsap.set(this.thumbs[1], { x: this.positionsPixels[1] });

    // Create draggable instances for each thumb
    this.thumbs.forEach((thumb, index) => {
      Draggable.create(thumb, {
        type: 'x',
        bounds: { minX: this.sliderMinPx, maxX: this.sliderMaxPx },
        onDrag: () => this.onDrag(index),
        onThrowUpdate: () => this.onDrag(index),
        throwProps: true,
      });
    });
  }

  snapToEdges = gsap.utils.snap({
    values: [0, 1],
    radius: 0.001,
  });

  norm = gsap.utils.mapRange(this.sliderMinPx, this.sliderMaxPx, 0, 1);

  onDrag(thumbIndex: number) {
    // Get normalized positions from GSAP
    let thumb0X = gsap.getProperty(this.thumbs[0], 'x') as number;
    let thumb1X = gsap.getProperty(this.thumbs[1], 'x') as number;

    // Prevent crossing
    const minDistance = 2; // 2px minimum
    if (thumb0X > thumb1X - minDistance) {
      if (thumbIndex === 0) thumb0X = thumb1X - minDistance;
      else thumb1X = thumb0X + minDistance;

      gsap.set(this.thumbs[thumbIndex], {
        x: thumbIndex === 0 ? thumb0X : thumb1X,
      });
    }

    this.positionsPixels[0] = thumb0X;
    this.positionsPixels[1] = thumb1X;

    this.dispatchChangeEvent();
  }

  dispatchChangeEvent() {
    // Get base normalized positions (always 0-1)
    const firstPos =
      (this.positionsPixels[0] - this.sliderMinPx) / this.sliderWidthPx;
    const secondPos =
      (this.positionsPixels[1] - this.sliderMinPx) / this.sliderWidthPx;

    this.dispatchEvent(
      new CustomEvent('range-change', {
        detail: { min: firstPos, max: secondPos },
      })
    );
  }

  updateThumbs() {
    if (typeof gsap === 'undefined') return;

    // Animate thumbs to their positions
    this.thumbs.forEach((thumb, index) => {
      gsap.to(thumb, {
        x: this.positionsPixels[index],
        duration: 0.3,
        ease: 'power2.out',
      });
    });

    this.dispatchChangeEvent();
  }

  refreshDisplay() {
    this.thumbs.forEach((thumb, index) => {
      const valueSpan = this.querySelector(
        `#value-${index}`
      ) as HTMLSpanElement;
      if (valueSpan) {
        valueSpan.textContent = this.positionsPixels[index].toFixed(0);
      }
    });
  }

  // Public API methods - value is normalized (0 to 1)
  setPosition(thumbIndex: number, normalizedValue: number) {
    if (thumbIndex >= 0 && thumbIndex < this.positionsPixels.length) {
      this.positionsPixels[thumbIndex] =
        this.sliderMinPx + normalizedValue * this.sliderWidthPx;
      this.updateThumbs();
    }
  }

  getPosition(thumbIndex: number): number {
    return this.positionsPixels[thumbIndex] || 0;
  }

  getPositions(): number[] {
    return [...this.positionsPixels];
  }
}

// Register the custom element
customElements.define('slider-gsap', SliderGSAP);
