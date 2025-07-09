import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

// TODO1: Shift + click to drag both thumbs at the same time
// TODO2: Check for leftover redundant normalization / convertion

class SliderGSAP extends HTMLElement {
  svg!: SVGElement;
  thumbs!: SVGCircleElement[];
  track!: SVGLineElement;

  minValue: number = 0;
  maxValue: number = 1;
  rampTime: number = 0.5;

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

  snapToEdges = gsap.utils.snap({
    values: [0, 1],
    radius: 0.001,
  });

  norm = gsap.utils.mapRange(this.sliderMinPx, this.sliderMaxPx, 0, 1);

  // normalized -> 0 to 1
  valueToNormalized(value: number): number {
    return (value - this.minValue) / (this.maxValue - this.minValue);
  }

  normalizedToValue(normalized: number): number {
    return this.minValue + normalized * (this.maxValue - this.minValue);
  }

  normalizedToPixels(normalized: number): number {
    return this.sliderMinPx + normalized * this.sliderWidthPx;
  }

  pixelsToNormalized(pixels: number): number {
    return (pixels - this.sliderMinPx) / this.sliderWidthPx;
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
        onPress: (e) => this.onPress(e, index),
        onThrowUpdate: () => this.onDrag(index),
        throwProps: true,
      });
    });
  }

  private isShiftDragging = false;
  private dragStartPositions: number[] = [];

  onPress(event: PointerEvent, thumbIndex: number) {
    this.isShiftDragging = event.shiftKey;
    if (this.isShiftDragging) {
      this.rampTime = 0;
      // Store current positions at drag start
      this.dragStartPositions = [
        gsap.getProperty(this.thumbs[0], 'x') as number,
        gsap.getProperty(this.thumbs[1], 'x') as number,
      ];
    } else {
      this.rampTime = 0.5; // todo: use passed in value or state
    }
  }

  onDrag(thumbIndex: number) {
    let thumb0X = gsap.getProperty(this.thumbs[0], 'x') as number;
    let thumb1X = gsap.getProperty(this.thumbs[1], 'x') as number;

    if (this.isShiftDragging) {
      // Calculate how much the dragged thumb moved
      const draggedThumbDelta =
        (thumbIndex === 0 ? thumb0X : thumb1X) -
        this.dragStartPositions[thumbIndex];

      // Move both thumbs by the same delta
      const newThumb0X = this.dragStartPositions[0] + draggedThumbDelta;
      const newThumb1X = this.dragStartPositions[1] + draggedThumbDelta;

      // Apply bounds checking
      const constrainedThumb0X = Math.max(
        this.sliderMinPx,
        Math.min(this.sliderMaxPx, newThumb0X)
      );
      const constrainedThumb1X = Math.max(
        this.sliderMinPx,
        Math.min(this.sliderMaxPx, newThumb1X)
      );

      // Update both thumbs
      gsap.set(this.thumbs[0], { x: constrainedThumb0X });
      gsap.set(this.thumbs[1], { x: constrainedThumb1X });

      this.positionsPixels[0] = constrainedThumb0X;
      this.positionsPixels[1] = constrainedThumb1X;
    } else {
      // Existing single-thumb logic
      const minDistance = 2;
      if (thumb0X > thumb1X - minDistance) {
        if (thumbIndex === 0) thumb0X = thumb1X - minDistance;
        else thumb1X = thumb0X + minDistance;

        gsap.set(this.thumbs[thumbIndex], {
          x: thumbIndex === 0 ? thumb0X : thumb1X,
        });
      }

      this.positionsPixels[0] = thumb0X;
      this.positionsPixels[1] = thumb1X;
    }

    this.dispatchChangeEvent();
  }

  // onDrag(thumbIndex: number) {
  //   // Get normalized positions from GSAP
  //   let thumb0X = gsap.getProperty(this.thumbs[0], 'x') as number;
  //   let thumb1X = gsap.getProperty(this.thumbs[1], 'x') as number;

  //   // Prevent crossing
  //   const minDistance = 2; // 2px minimum
  //   if (thumb0X > thumb1X - minDistance) {
  //     if (thumbIndex === 0) thumb0X = thumb1X - minDistance;
  //     else thumb1X = thumb0X + minDistance;

  //     gsap.set(this.thumbs[thumbIndex], {
  //       x: thumbIndex === 0 ? thumb0X : thumb1X,
  //     });
  //   }

  //   this.positionsPixels[0] = thumb0X;
  //   this.positionsPixels[1] = thumb1X;

  //   this.dispatchChangeEvent();
  // }

  dispatchChangeEvent() {
    const firstNormalized = this.pixelsToNormalized(this.positionsPixels[0]);
    const secondNormalized = this.pixelsToNormalized(this.positionsPixels[1]);

    const firstValue = this.normalizedToValue(firstNormalized);
    const secondValue = this.normalizedToValue(secondNormalized);

    this.dispatchEvent(
      new CustomEvent('range-change', {
        detail: {
          min: firstValue,
          max: secondValue,
          rampTime: this.rampTime,
          isShiftDragging: this.isShiftDragging,
          // Also provide normalized values if needed
          minNormalized: firstNormalized,
          maxNormalized: secondNormalized,
        },
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

  // Public API methods

  setRange(min: number, max: number) {
    this.minValue = min;
    this.maxValue = max;
    this.updateThumbs();
  }

  setRampTime(value: number) {
    this.rampTime = value;
  }

  // Accept actual values instead of normalized
  setPosition(thumbIndex: number, value: number) {
    if (thumbIndex >= 0 && thumbIndex < this.positionsPixels.length) {
      const normalized = this.valueToNormalized(value);
      this.positionsPixels[thumbIndex] = this.normalizedToPixels(normalized);
      this.updateThumbs();
    }
  }

  // Return actual values instead of pixels
  getPosition(thumbIndex: number): number {
    const normalized = this.pixelsToNormalized(
      this.positionsPixels[thumbIndex]
    );
    return this.normalizedToValue(normalized);
  }

  getPositionsInPx(): number[] {
    return [...this.positionsPixels];
  }
}

// Register the custom element
customElements.define('slider-gsap', SliderGSAP);
