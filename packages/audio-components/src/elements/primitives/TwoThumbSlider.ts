export class TwoThumbSlider extends HTMLElement {
  static observedAttributes = [
    'min',
    'max',
    'step',
    'minimum-gap',
    'value-min',
    'value-max',
    'use-logarithmic-scaling',
  ];

  min: number;
  max: number;
  step: number;
  minimumGap: number;
  valueMin: number;
  valueMax: number;
  useLogarithmicScaling: boolean;
  activeThumb: 'min' | 'max' | null;

  constructor() {
    super();
    this.min = 0;
    this.max = 1;
    this.step = 0.001;
    this.minimumGap = 0.001;
    this.valueMin = 0;
    this.valueMax = 1;
    this.useLogarithmicScaling = false;
    this.activeThumb = null;
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
    this.updateSlider();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;
    if (newValue === null) return;

    const value = parseFloat(newValue);
    switch (name) {
      case 'min':
        this.min = value;
        break;
      case 'max':
        this.max = value;
        break;
      case 'step':
        this.step = value;
        break;
      case 'minimum-gap':
        this.minimumGap = value;
        break;
      case 'value-min':
        this.valueMin = value;
        break;
      case 'value-max':
        this.valueMax = value;
        break;
      case 'use-logarithmic-scaling':
        this.useLogarithmicScaling = newValue === 'true';
        break;
    }

    if (this.isConnected) {
      this.updateSlider();
    }
  }

  render(): void {
    this.innerHTML = `
      <div class="slider-track">
          <div class="slider-range"></div>
          <div class="slider-thumb thumb-min"></div>
          <div class="slider-thumb thumb-max"></div>
      </div>
    `;
  }

  setupEventListeners(): void {
    const thumbMin = this.querySelector('.thumb-min') as HTMLElement;
    const thumbMax = this.querySelector('.thumb-max') as HTMLElement;

    thumbMin.addEventListener('mousedown', (e) => this.startDrag(e, 'min'));
    thumbMax.addEventListener('mousedown', (e) => this.startDrag(e, 'max'));
    thumbMin.addEventListener('touchstart', (e) => this.startDrag(e, 'min'), {
      passive: false,
    });
    thumbMax.addEventListener('touchstart', (e) => this.startDrag(e, 'max'), {
      passive: false,
    });
  }

  startDrag(e: MouseEvent | TouchEvent, thumb: 'min' | 'max'): void {
    e.stopPropagation();
    e.preventDefault();
    this.activeThumb = thumb;

    const handleMove = (e: MouseEvent | TouchEvent) => this.handleDrag(e);
    const handleEnd = () => this.stopDrag(handleMove, handleEnd);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, {
      passive: false,
    });
    document.addEventListener('touchend', handleEnd);
  }

  handleDrag(e: MouseEvent | TouchEvent): void {
    if (!this.activeThumb) return;

    e.preventDefault();
    const clientX =
      'touches' in e && e.touches[0]
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;
    const track = this.querySelector('.slider-track') as HTMLElement;
    const rect = track.getBoundingClientRect();

    let position = Math.max(0, Math.min(clientX - rect.left, rect.width));
    let percentage = position / rect.width;

    // Calculate value based on scaling type
    let value;
    if (this.useLogarithmicScaling) {
      const logMin = Math.log(this.min);
      const logMax = Math.log(this.max);
      value = Math.exp(logMin + percentage * (logMax - logMin));
    } else {
      value = this.min + percentage * (this.max - this.min);
    }

    // Snap to step
    value = Math.round(value / this.step) * this.step;

    // Apply minimum gap constraint
    if (this.activeThumb === 'min') {
      value = Math.min(value, this.valueMax - this.minimumGap);
      this.valueMin = Math.max(value, this.min);
    } else {
      value = Math.max(value, this.valueMin + this.minimumGap);
      this.valueMax = Math.min(value, this.max);
    }

    this.updateSlider();
    this.dispatchChange();
  }

  stopDrag(
    handleMove: (e: MouseEvent | TouchEvent) => void,
    handleEnd: () => void
  ): void {
    this.activeThumb = null;
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);
  }

  updateSlider(): void {
    const rangeElement = this.querySelector(
      '.slider-range'
    ) as HTMLElement | null;
    const thumbMin = this.querySelector('.thumb-min') as HTMLElement | null;
    const thumbMax = this.querySelector('.thumb-max') as HTMLElement | null;

    if (!rangeElement || !thumbMin || !thumbMax) return;

    // Calculate positions as percentages based on scaling type
    let percentMin, percentMax;
    if (this.useLogarithmicScaling) {
      const logMin = Math.log(this.min);
      const logMax = Math.log(this.max);
      percentMin =
        ((Math.log(this.valueMin) - logMin) / (logMax - logMin)) * 100;
      percentMax =
        ((Math.log(this.valueMax) - logMin) / (logMax - logMin)) * 100;
    } else {
      percentMin = ((this.valueMin - this.min) / (this.max - this.min)) * 100;
      percentMax = ((this.valueMax - this.min) / (this.max - this.min)) * 100;
    }

    // Add visual padding when thumbs are too close
    const minVisualGap = 2; // Minimum visual gap in percentage points
    const actualGap = percentMax - percentMin;

    if (actualGap < minVisualGap) {
      const adjustment = (minVisualGap - actualGap) / 2;
      const adjustedPercentMin = Math.max(0, percentMin - adjustment);
      const adjustedPercentMax = Math.min(100, percentMax + adjustment);

      thumbMin.style.left = `${adjustedPercentMin}%`;
      thumbMax.style.left = `${adjustedPercentMax}%`;
    } else {
      thumbMin.style.left = `${percentMin}%`;
      thumbMax.style.left = `${percentMax}%`;
    }

    // Range element always uses actual values (no padding)
    rangeElement.style.left = `${percentMin}%`;
    rangeElement.style.width = `${percentMax - percentMin}%`;
  }

  dispatchChange(): void {
    this.dispatchEvent(
      new CustomEvent('range-change', {
        detail: {
          min: this.valueMin,
          max: this.valueMax,
        },
        bubbles: true,
      })
    );
  }

  setValues(min: number, max: number): void {
    this.valueMin = Math.max(this.min, Math.min(min, this.max));
    this.valueMax = Math.max(this.min, Math.min(max, this.max));

    // Ensure minimum gap
    if (this.valueMax - this.valueMin < this.minimumGap) {
      this.valueMax = this.valueMin + this.minimumGap;
    }

    this.updateSlider();
    this.dispatchChange();
  }
}

customElements.define('two-thumb-slider', TwoThumbSlider);

declare global {
  interface HTMLElementTagNameMap {
    'two-thumb-slider': TwoThumbSlider;
  }
}

const style = document.createElement('style');
style.textContent = `
two-thumb-slider {
  height: 20px;
  width: 100%;
  position: relative;
}

.slider-track {
  position: relative;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
}

.slider-range {
  position: absolute;
  height: 8px;
  background: #4285f4;
  border-radius: 4px;
}

.slider-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #fff;
  border: 1px solid #4285f4;
  border-radius: 40%;
  top: -4px;
  margin-left: -8px;
  cursor: pointer;
}
`;
document.head.append(style);

// Maniggi:
// export class TwoThumbSlider extends HTMLElement {
//   static observedAttributes = [
//     'min',
//     'max',
//     'step',
//     'minimum-gap',
//     'value-min',
//     'value-max',
//   ];

//   min: number;
//   max: number;
//   step: number;
//   minimumGap: number;
//   valueMin: number;
//   valueMax: number;
//   activeThumb: 'min' | 'max' | null;

//   constructor() {
//     super();
//     this.min = 0;
//     this.max = 1;
//     this.step = 0.001;
//     this.minimumGap = 0.001;
//     this.valueMin = 0;
//     this.valueMax = 1;
//     this.activeThumb = null;
//   }

//   connectedCallback(): void {
//     this.render();
//     this.setupEventListeners();
//     this.updateSlider();
//   }

//   attributeChangedCallback(
//     name: string,
//     oldValue: string | null,
//     newValue: string | null
//   ): void {
//     if (oldValue === newValue) return;
//     if (newValue === null) return;

//     const value = parseFloat(newValue);
//     switch (name) {
//       case 'min':
//         this.min = value;
//         break;
//       case 'max':
//         this.max = value;
//         break;
//       case 'step':
//         this.step = value;
//         break;
//       case 'minimum-gap':
//         this.minimumGap = value;
//         break;
//       case 'value-min':
//         this.valueMin = value;
//         break;
//       case 'value-max':
//         this.valueMax = value;
//         break;
//     }

//     if (this.isConnected) {
//       this.updateSlider();
//     }
//   }

//   render(): void {
//     this.innerHTML = `
//       <div class="slider-track">
//           <div class="slider-range"></div>
//           <div class="slider-thumb thumb-min"></div>
//           <div class="slider-thumb thumb-max"></div>
//       </div>
//     `;
//   }

//   setupEventListeners(): void {
//     const thumbMin = this.querySelector('.thumb-min') as HTMLElement;
//     const thumbMax = this.querySelector('.thumb-max') as HTMLElement;

//     thumbMin.addEventListener('mousedown', (e) => this.startDrag(e, 'min'));
//     thumbMax.addEventListener('mousedown', (e) => this.startDrag(e, 'max'));
//     thumbMin.addEventListener('touchstart', (e) => this.startDrag(e, 'min'), {
//       passive: false,
//     });
//     thumbMax.addEventListener('touchstart', (e) => this.startDrag(e, 'max'), {
//       passive: false,
//     });
//   }

//   startDrag(e: MouseEvent | TouchEvent, thumb: 'min' | 'max'): void {
//     e.stopPropagation();
//     e.preventDefault();
//     this.activeThumb = thumb;

//     const handleMove = (e: MouseEvent | TouchEvent) => this.handleDrag(e);
//     const handleEnd = () => this.stopDrag(handleMove, handleEnd);

//     document.addEventListener('mousemove', handleMove);
//     document.addEventListener('mouseup', handleEnd);
//     document.addEventListener('touchmove', handleMove, {
//       passive: false,
//     });
//     document.addEventListener('touchend', handleEnd);
//   }

//   handleDrag(e: MouseEvent | TouchEvent): void {
//     if (!this.activeThumb) return;

//     e.preventDefault();
//     const clientX =
//       'touches' in e && e.touches[0]
//         ? e.touches[0].clientX
//         : (e as MouseEvent).clientX;
//     const track = this.querySelector('.slider-track') as HTMLElement;
//     const rect = track.getBoundingClientRect();

//     let position = Math.max(0, Math.min(clientX - rect.left, rect.width));
//     let percentage = position / rect.width;

//     // Calculate value based on full range
//     let value = this.min + percentage * (this.max - this.min);

//     // Snap to step
//     value = Math.round(value / this.step) * this.step;

//     // Apply minimum gap constraint
//     if (this.activeThumb === 'min') {
//       value = Math.min(value, this.valueMax - this.minimumGap);
//       this.valueMin = Math.max(value, this.min);
//     } else {
//       value = Math.max(value, this.valueMin + this.minimumGap);
//       this.valueMax = Math.min(value, this.max);
//     }

//     this.updateSlider();
//     this.dispatchChange();
//   }

//   stopDrag(
//     handleMove: (e: MouseEvent | TouchEvent) => void,
//     handleEnd: () => void
//   ): void {
//     this.activeThumb = null;
//     document.removeEventListener('mousemove', handleMove);
//     document.removeEventListener('mouseup', handleEnd);
//     document.removeEventListener('touchmove', handleMove);
//     document.removeEventListener('touchend', handleEnd);
//   }

//   updateSlider(): void {
//     const rangeElement = this.querySelector(
//       '.slider-range'
//     ) as HTMLElement | null;
//     const thumbMin = this.querySelector('.thumb-min') as HTMLElement | null;
//     const thumbMax = this.querySelector('.thumb-max') as HTMLElement | null;

//     if (!rangeElement || !thumbMin || !thumbMax) return;

//     // Calculate positions as percentages within full range
//     const percentMin =
//       ((this.valueMin - this.min) / (this.max - this.min)) * 100;
//     const percentMax =
//       ((this.valueMax - this.min) / (this.max - this.min)) * 100;

//     // Use percentages for positioning
//     thumbMin.style.left = `${percentMin}%`;
//     thumbMax.style.left = `${percentMax}%`;
//     rangeElement.style.left = `${percentMin}%`;
//     rangeElement.style.width = `${percentMax - percentMin}%`;
//   }

//   dispatchChange(): void {
//     this.dispatchEvent(
//       new CustomEvent('range-change', {
//         detail: {
//           min: this.valueMin,
//           max: this.valueMax,
//         },
//         bubbles: true,
//       })
//     );
//   }

//   setValues(min: number, max: number): void {
//     this.valueMin = Math.max(this.min, Math.min(min, this.max));
//     this.valueMax = Math.max(this.min, Math.min(max, this.max));

//     // Ensure minimum gap
//     if (this.valueMax - this.valueMin < this.minimumGap) {
//       this.valueMax = this.valueMin + this.minimumGap;
//     }

//     this.updateSlider();
//     this.dispatchChange();
//   }
// }

// customElements.define('two-thumb-slider', TwoThumbSlider);

// declare global {
//   interface HTMLElementTagNameMap {
//     'two-thumb-slider': TwoThumbSlider;
//   }
// }

// const style = document.createElement('style');
// style.textContent = `
// two-thumb-slider {
//   height: 20px;
//   width: 100%;
//   position: relative;
// }

// .slider-track {
//   position: relative;
//   height: 8px;
//   background: #ddd;
//   border-radius: 4px;
// }

// .slider-range {
//   position: absolute;
//   height: 8px;
//   background: #4285f4;
//   border-radius: 4px;
// }

// .slider-thumb {
//   position: absolute;
//   width: 14px;
//   height: 14px;
//   background: #fff;
//   border: 1px solid #4285f4;
//   border-radius: 40%;
//   top: -4px;
//   margin-left: -8px;
//   cursor: pointer;
// }
// `;
// document.head.append(style);

// With zooom crap:
// export class TwoThumbSlider extends HTMLElement {
//   static observedAttributes = [
//     'min',
//     'max',
//     'step',
//     'minimum-gap',
//     'value-min',
//     'value-max',
//     'zoom-factor',
//   ];

//   min: number;
//   max: number;
//   step: number;
//   minimumGap: number;
//   valueMin: number;
//   valueMax: number;
//   zoomFactor: number; // 0 = no zoom, 1 = full zoom
//   activeThumb: 'min' | 'max' | null;

//   constructor() {
//     super();
//     this.min = 0;
//     this.max = 1;
//     this.step = 0.001;
//     this.minimumGap = 0.001;
//     this.valueMin = 0;
//     this.valueMax = 1;
//     this.zoomFactor = 0.5;
//     this.activeThumb = null;
//   }

//   connectedCallback(): void {
//     this.render();
//     this.setupEventListeners();
//     this.updateSlider();
//   }

//   attributeChangedCallback(
//     name: string,
//     oldValue: string | null,
//     newValue: string | null
//   ): void {
//     if (oldValue === newValue) return;
//     if (newValue === null) return;

//     const value = parseFloat(newValue);
//     switch (name) {
//       case 'min':
//         this.min = value;
//         break;
//       case 'max':
//         this.max = value;
//         break;
//       case 'step':
//         this.step = value;
//         break;
//       case 'minimum-gap':
//         this.minimumGap = value;
//         break;
//       case 'value-min':
//         this.valueMin = value;
//         break;
//       case 'value-max':
//         this.valueMax = value;
//         break;
//       case 'zoom-factor':
//         this.zoomFactor = Math.max(0, Math.min(1, value)); // Clamp 0-1
//         break;
//     }

//     if (this.isConnected) {
//       this.updateSlider();
//     }
//   }

//   render(): void {
//     this.innerHTML = `
//       <div class="slider-track">
//           <div class="slider-range"></div>
//           <div class="slider-thumb thumb-min"></div>
//           <div class="slider-thumb thumb-max"></div>
//       </div>
//     `;
//   }

//   setupEventListeners(): void {
//     const thumbMin = this.querySelector('.thumb-min') as HTMLElement;
//     const thumbMax = this.querySelector('.thumb-max') as HTMLElement;

//     thumbMin.addEventListener('mousedown', (e) => this.startDrag(e, 'min'));
//     thumbMax.addEventListener('mousedown', (e) => this.startDrag(e, 'max'));
//     thumbMin.addEventListener('touchstart', (e) => this.startDrag(e, 'min'), {
//       passive: false,
//     });
//     thumbMax.addEventListener('touchstart', (e) => this.startDrag(e, 'max'), {
//       passive: false,
//     });
//   }

//   startDrag(e: MouseEvent | TouchEvent, thumb: 'min' | 'max'): void {
//     e.stopPropagation();
//     e.preventDefault();
//     this.activeThumb = thumb;

//     const handleMove = (e: MouseEvent | TouchEvent) => this.handleDrag(e);
//     const handleEnd = () => this.stopDrag(handleMove, handleEnd);

//     document.addEventListener('mousemove', handleMove);
//     document.addEventListener('mouseup', handleEnd);
//     document.addEventListener('touchmove', handleMove, {
//       passive: false,
//     });
//     document.addEventListener('touchend', handleEnd);
//   }

//   // Get zoomed bounds for visual scaling
//   getZoomedBounds() {
//     if (this.zoomFactor === 0) {
//       return { min: this.min, max: this.max }; // No zoom
//     }

//     const currentRange = this.valueMax - this.valueMin;
//     const totalRange = this.max - this.min;

//     // Simple zoom: interpolate between full range and current range
//     const zoomAmount = this.zoomFactor;
//     const zoomedRange =
//       totalRange * (1 - zoomAmount) + currentRange * zoomAmount;

//     // Center the zoom on current selection
//     const center = (this.valueMin + this.valueMax) / 2;
//     const halfZoomedRange = zoomedRange / 2;

//     return {
//       min: Math.max(this.min, center - halfZoomedRange),
//       max: Math.min(this.max, center + halfZoomedRange),
//     };
//   }

//   handleDrag(e: MouseEvent | TouchEvent): void {
//     if (!this.activeThumb) return;

//     e.preventDefault();
//     const clientX =
//       'touches' in e && e.touches[0]
//         ? e.touches[0].clientX
//         : (e as MouseEvent).clientX;
//     const track = this.querySelector('.slider-track') as HTMLElement;
//     const rect = track.getBoundingClientRect();

//     let position = Math.max(0, Math.min(clientX - rect.left, rect.width));
//     let percentage = position / rect.width;

//     // Use zoomed bounds for calculation
//     const bounds = this.getZoomedBounds();
//     let value = bounds.min + percentage * (bounds.max - bounds.min);

//     // Snap to step
//     value = Math.round(value / this.step) * this.step;

//     // Apply minimum gap constraint
//     if (this.activeThumb === 'min') {
//       value = Math.min(value, this.valueMax - this.minimumGap);
//       this.valueMin = Math.max(value, this.min);
//     } else {
//       value = Math.max(value, this.valueMin + this.minimumGap);
//       this.valueMax = Math.min(value, this.max);
//     }

//     this.updateSlider();
//     this.dispatchChange();
//   }

//   stopDrag(
//     handleMove: (e: MouseEvent | TouchEvent) => void,
//     handleEnd: () => void
//   ): void {
//     this.activeThumb = null;
//     document.removeEventListener('mousemove', handleMove);
//     document.removeEventListener('mouseup', handleEnd);
//     document.removeEventListener('touchmove', handleMove);
//     document.removeEventListener('touchend', handleEnd);
//   }

//   updateSlider(): void {
//     const rangeElement = this.querySelector(
//       '.slider-range'
//     ) as HTMLElement | null;
//     const thumbMin = this.querySelector('.thumb-min') as HTMLElement | null;
//     const thumbMax = this.querySelector('.thumb-max') as HTMLElement | null;

//     if (!rangeElement || !thumbMin || !thumbMax) return;

//     // Use zoomed bounds for positioning
//     const bounds = this.getZoomedBounds();

//     // Calculate positions as percentages within zoomed bounds
//     const percentMin =
//       ((this.valueMin - bounds.min) / (bounds.max - bounds.min)) * 100;
//     const percentMax =
//       ((this.valueMax - bounds.min) / (bounds.max - bounds.min)) * 100;

//     // Use percentages for positioning
//     thumbMin.style.left = `${percentMin}%`;
//     thumbMax.style.left = `${percentMax}%`;
//     rangeElement.style.left = `${percentMin}%`;
//     rangeElement.style.width = `${percentMax - percentMin}%`;
//   }

//   dispatchChange(): void {
//     this.dispatchEvent(
//       new CustomEvent('range-change', {
//         detail: {
//           min: this.valueMin,
//           max: this.valueMax,
//           zoomedBounds: this.getZoomedBounds(), // Include zoom info for debugging
//         },
//         bubbles: true,
//       })
//     );
//   }

//   setZoomFactor(factor: number): void {
//     this.zoomFactor = Math.max(0, Math.min(1, factor));
//     this.updateSlider();
//   }

//   setValues(min: number, max: number): void {
//     this.valueMin = Math.max(this.min, Math.min(min, this.max));
//     this.valueMax = Math.max(this.min, Math.min(max, this.max));

//     // Ensure minimum gap
//     if (this.valueMax - this.valueMin < this.minimumGap) {
//       this.valueMax = this.valueMin + this.minimumGap;
//     }

//     this.updateSlider();
//     this.dispatchChange();
//   }
// }

// customElements.define('two-thumb-slider', TwoThumbSlider);

// declare global {
//   interface HTMLElementTagNameMap {
//     'two-thumb-slider': TwoThumbSlider;
//   }
// }

// const style = document.createElement('style');
// style.textContent = `
// two-thumb-slider {
//   height: 20px;
//   width: 100%;
//   position: relative;
// }

// .slider-track {
//   position: relative;
//   height: 8px;
//   background: #ddd;
//   border-radius: 4px;
// }

// .slider-range {
//   position: absolute;
//   height: 8px;
//   background: #4285f4;
//   border-radius: 4px;
// }

// .slider-thumb {
//   position: absolute;
//   width: 14px;
//   height: 14px;
//   background: #fff;
//   border: 1px solid #4285f4;
//   border-radius: 40%;
//   top: -4px;
//   margin-left: -8px;
//   cursor: pointer;
// }
// `;
// document.head.append(style);
