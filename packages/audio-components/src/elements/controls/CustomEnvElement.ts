// EnvelopeElement.ts - Hybrid VanJS + Manual DOM approach
import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import gsap from 'gsap';

const { div, button } = van.tags;
const { svg, path, line, g } = van.tags('http://www.w3.org/2000/svg');

// Envelope point structure
interface EnvelopePoint {
  time: number; // 0-1 normalized time
  value: number;
  curve?: 'linear' | 'exponential'; // Curve type to next point
}

interface EnvelopeData {
  points: EnvelopePoint[];
  loop?: boolean;
}

// Audio envelope controller
export class AudioEnvelopeController {
  private points: EnvelopePoint[] = [
    { time: 0, value: 0, curve: 'linear' },
    { time: 1, value: 0, curve: 'linear' },
  ];
  private loop = false;
  private previewTimeline: gsap.core.Timeline | null = null;

  public updateTrigger: State<number> = van.state(0);
  public previewValue: State<number> = van.state(0);

  constructor() {
    this.setupPreviewAnimation();
  }

  getEnvelopeData() {
    return {
      points: this.points,
      loop: this.loop, // Just a boolean property
    };
  }

  addPoint(
    time: number,
    value: number,
    curve: 'linear' | 'exponential' = 'linear'
  ) {
    const insertIndex = this.points.findIndex((p) => p.time > time);
    const newPoint = { time, value, curve };

    if (insertIndex === -1) {
      this.points.push(newPoint);
    } else {
      this.points.splice(insertIndex, 0, newPoint);
    }

    this.updateTrigger.val++;
    this.updatePreviewAnimation();
  }

  updatePoint(index: number, time: number, value: number) {
    if (index >= 0 && index < this.points.length) {
      if (index === 0) {
        this.points[index] = { ...this.points[index], value };
      } else if (index === this.points.length - 1) {
        this.points[index] = { ...this.points[index], value };
      } else {
        this.points[index] = { ...this.points[index], time, value };
      }

      this.updateTrigger.val++;
      this.updatePreviewAnimation();
    }
  }

  deletePoint(index: number) {
    if (index > 0 && index < this.points.length - 1) {
      this.points.splice(index, 1);
      this.updateTrigger.val++;
      this.updatePreviewAnimation();
    }
  }

  getPoints(): EnvelopePoint[] {
    return [...this.points];
  }

  // Web Audio scheduling

  // TODO: Just send values to SamplePlayer and store there for next play()!
  applyToAudioParam(
    audioParam: AudioParam,
    startTime: number,
    duration: number,
    minValue: number = 0.001,
    loop = true
  ) {
    audioParam.cancelScheduledValues(startTime);

    // Generate curve array
    const sampleRate = 1000; // 1000 samples per second
    const numSamples = Math.max(2, Math.floor(duration * sampleRate));
    const curve = new Float32Array(numSamples);

    // Fill the curve array by sampling the envelope
    for (let i = 0; i < numSamples; i++) {
      // const normalizedTime = i / (numSamples - 1); // 0 to 1
      const normalizedTime = loop
        ? (i / (numSamples - 1)) % 1 // Wraps 0→1→0→1→0...
        : i / (numSamples - 1); // Normal 0→1

      const value = this.interpolateValueAtTime(normalizedTime);
      curve[i] = Math.max(value, minValue);
    }

    audioParam.setValueCurveAtTime(curve, startTime, duration);
  }

  //   applyEnvelopeToParam(audioParam: AudioParam, envelopeData, duration) {
  //   const curve = envelopeData.loop
  //     ? this.generateLoopedCurve(envelopeData.points, duration)
  //     : this.generateCurveFromPoints(envelopeData.points, duration);

  //   audioParam.setValueCurveAtTime(curve, this.context.currentTime, duration);
  // }

  // generateLoopedCurve(points, totalDuration) {
  //   const sampleRate = 1000;
  //   const totalSamples = Math.floor(totalDuration * sampleRate);

  //   // Generate one cycle of the envelope
  //   const cycleLength = 500; // 0.5 seconds per cycle (adjust as needed)
  //   const oneCycle = new Float32Array(cycleLength);

  //   for (let i = 0; i < cycleLength; i++) {
  //     const normalizedTime = i / (cycleLength - 1);
  //     oneCycle[i] = this.interpolateValueAtTime(points, normalizedTime);
  //   }

  //   // Repeat the cycle to fill total duration
  //   const curve = new Float32Array(totalSamples);
  //   for (let i = 0; i < totalSamples; i++) {
  //     curve[i] = oneCycle[i % cycleLength];
  //   }

  //   return curve;
  // }

  private interpolateValueAtTime(normalizedTime: number): number {
    const sortedPoints = [...this.points].sort((a, b) => a.time - b.time);

    if (sortedPoints.length === 0) return 0;
    if (sortedPoints.length === 1) return sortedPoints[0].value;

    // Handle time outside bounds
    if (normalizedTime <= sortedPoints[0].time) {
      return sortedPoints[0].value;
    }
    if (normalizedTime >= sortedPoints[sortedPoints.length - 1].time) {
      return sortedPoints[sortedPoints.length - 1].value;
    }

    // Find surrounding points
    let leftIndex = 0;
    let rightIndex = sortedPoints.length - 1;

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      if (
        normalizedTime >= sortedPoints[i].time &&
        normalizedTime <= sortedPoints[i + 1].time
      ) {
        leftIndex = i;
        rightIndex = i + 1;
        break;
      }
    }

    const leftPoint = sortedPoints[leftIndex];
    const rightPoint = sortedPoints[rightIndex];

    if (leftIndex === rightIndex) {
      return leftPoint.value;
    }

    // Calculate interpolation factor
    const segmentDuration = rightPoint.time - leftPoint.time;
    const t =
      segmentDuration === 0
        ? 0
        : (normalizedTime - leftPoint.time) / segmentDuration;

    // Apply curve type
    switch (leftPoint.curve) {
      case 'exponential':
        if (leftPoint.value > 0 && rightPoint.value > 0) {
          // Exponential interpolation: start * (end/start)^t
          return (
            leftPoint.value * Math.pow(rightPoint.value / leftPoint.value, t)
          );
        }
        // Fallback to linear if values are problematic
        return leftPoint.value + (rightPoint.value - leftPoint.value) * t;

      case 'linear':
      default:
        // Linear interpolation
        return leftPoint.value + (rightPoint.value - leftPoint.value) * t;
    }
  }

  getSVGPath(width: number = 400, height: number = 200): string {
    if (this.points.length < 2) return `M0,${height} L${width},${height}`;

    const sortedPoints = [...this.points].sort((a, b) => a.time - b.time);
    let path = `M${sortedPoints[0].time * width},${(1 - sortedPoints[0].value) * height}`;

    for (let i = 1; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      const prevPoint = sortedPoints[i - 1];

      const x = point.time * width;
      const y = (1 - point.value) * height;

      if (prevPoint.curve === 'exponential') {
        const prevX = prevPoint.time * width;
        const prevY = (1 - prevPoint.value) * height;
        const cp1X = prevX + (x - prevX) * 0.3;
        const cp1Y = prevY;
        const cp2X = prevX + (x - prevX) * 0.7;
        const cp2Y = y;

        path += ` C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${x},${y}`;
      } else {
        path += ` L${x},${y}`;
      }
    }

    return path;
  }

  private setupPreviewAnimation() {
    this.previewTimeline = gsap.timeline({ paused: true });
  }

  private updatePreviewAnimation() {
    if (!this.previewTimeline) return;

    this.previewTimeline.clear();

    const sortedPoints = [...this.points].sort((a, b) => a.time - b.time);

    sortedPoints.forEach((point, index) => {
      if (index === 0) {
        this.previewTimeline?.set(
          this.previewValue,
          { val: point.value },
          point.time
        );
      } else {
        const ease =
          sortedPoints[index - 1].curve === 'exponential'
            ? 'power2.out'
            : 'none';
        this.previewTimeline?.to(
          this.previewValue,
          {
            val: point.value,
            duration: point.time - sortedPoints[index - 1].time,
            ease,
          },
          point.time
        );
      }
    });
  }

  startPreview() {
    if (this.previewTimeline) {
      this.previewTimeline.restart();
    }
  }

  loadPreset(preset: 'adsr' | 'pluck' | 'pad' | 'organ') {
    const presets = {
      adsr: [
        { time: 0, value: 0, curve: 'linear' as const },
        { time: 0.2, value: 1, curve: 'exponential' as const },
        { time: 0.4, value: 0.7, curve: 'linear' as const },
        { time: 0.8, value: 0.7, curve: 'exponential' as const },
        { time: 1, value: 0, curve: 'linear' as const },
      ],
      pluck: [
        { time: 0, value: 0, curve: 'linear' as const },
        { time: 0.05, value: 1, curve: 'exponential' as const },
        { time: 1, value: 0, curve: 'exponential' as const },
      ],
      pad: [
        { time: 0, value: 0, curve: 'exponential' as const },
        { time: 0.6, value: 1, curve: 'linear' as const },
        { time: 0.8, value: 0.8, curve: 'exponential' as const },
        { time: 1, value: 0, curve: 'exponential' as const },
      ],
      organ: [
        { time: 0, value: 0, curve: 'linear' as const },
        { time: 0.1, value: 1, curve: 'linear' as const },
        { time: 0.9, value: 1, curve: 'linear' as const },
        { time: 1, value: 0, curve: 'linear' as const },
      ],
    };

    this.points = presets[preset];
    this.updateTrigger.val++;
    this.updatePreviewAnimation();
  }
}

// VanJS Element with hybrid approach
const EnvelopeElement = (attributes: ElementProps) => {
  const envelope = new AudioEnvelopeController();

  // UI states
  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);

  // === MANUAL DOM MANAGEMENT FOR CONTROL POINTS ===
  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;

  const updateControlPoints = () => {
    if (!pointsGroup) return;

    // Clear existing points
    pointsGroup.innerHTML = '';

    const points = envelope.getPoints();
    points.forEach((point, index) => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      // Set attributes
      circle.setAttribute('cx', (point.time * 400).toString());
      circle.setAttribute('cy', ((1 - point.value) * 200).toString());
      circle.setAttribute('r', '6');
      circle.setAttribute(
        'fill',
        selectedPoint.val === index ? '#ff6b6b' : '#4ade80'
      );
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';

      // Event handling
      circle.addEventListener('mousedown', (e: MouseEvent) => {
        selectedPoint.val = index;
        isDragging.val = true;
        e.preventDefault();
      });

      // Double-click to delete (except first/last points)
      if (index > 0 && index < points.length - 1) {
        circle.addEventListener('dblclick', () => {
          envelope.deletePoint(index);
        });
      }

      pointsGroup.appendChild(circle);
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.val && selectedPoint.val !== null) {
      const rect = svgElement.getBoundingClientRect();

      // // Debug logging
      // console.log('SVG rect:', {
      //   width: rect.width,
      //   height: rect.height,
      //   ratio: rect.width / rect.height,
      // });
      // console.log('Mouse:', {
      //   clientX: e.clientX,
      //   clientY: e.clientY,
      //   relativeX: e.clientX - rect.left,
      //   relativeY: e.clientY - rect.top,
      // });

      const time = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const value = Math.max(
        0,
        Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
      );

      // console.log('Calculated:', { time, value });
      // console.log('Will set circle at:', {
      //   cx: time * 400,
      //   cy: (1 - value) * 200,
      // });

      envelope.updatePoint(selectedPoint.val, time, value);
    }
  };

  const handleMouseUp = () => {
    isDragging.val = false;
    selectedPoint.val = null;
  };

  // Double-click to add point
  const handleDoubleClick = (e: MouseEvent) => {
    if (isDragging.val) return; // Don't add point while dragging

    const rect = svgElement.getBoundingClientRect();

    // Direct conversion to normalized coordinates (0-1)
    const time = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const value = Math.max(
      0,
      Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
    );

    envelope.addPoint(time, value);
  };

  // Audio test function
  async function testEnvelope() {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.type = 'sine';

    // Use Web Audio scheduling
    envelope.applyToAudioParam(gainNode.gain, audioContext.currentTime, 2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2);

    envelope.startPreview();
  }

  // Create the hybrid element
  const element = div(
    {
      class: 'envelope-element',
      style: 'background: #2a2a2a; border-radius: 8px; padding: 16px;',
    },

    // Control buttons (VanJS)
    div(
      {
        style: 'margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap;',
      },

      button(
        {
          onclick: testEnvelope,
          style:
            'padding: 8px 16px; background: #60a5fa; border: none; border-radius: 4px; color: black;',
        },
        'Test Audio'
      ),

      button(
        {
          onclick: () => envelope.startPreview(),
          style:
            'padding: 8px 16px; background: #fbbf24; border: none; border-radius: 4px; color: black;',
        },
        'Preview UI'
      ),

      // Preset buttons
      button(
        {
          onclick: () => envelope.loadPreset('adsr'),
          style:
            'padding: 6px 12px; background: #374151; border: none; border-radius: 4px; color: white;',
        },
        'ADSR'
      ),
      button(
        {
          onclick: () => envelope.loadPreset('pluck'),
          style:
            'padding: 6px 12px; background: #374151; border: none; border-radius: 4px; color: white;',
        },
        'Pluck'
      ),
      button(
        {
          onclick: () => envelope.loadPreset('pad'),
          style:
            'padding: 6px 12px; background: #374151; border: none; border-radius: 4px; color: white;',
        },
        'Pad'
      ),
      button(
        {
          onclick: () => envelope.loadPreset('organ'),
          style:
            'padding: 6px 12px; background: #374151; border: none; border-radius: 4px; color: white;',
        },
        'Organ'
      )
    ),

    // === SVG EDITOR (HYBRID APPROACH) ===
    (() => {
      // Create SVG with VanJS
      svgElement = svg({
        viewBox: '0 0 400 200',
        style:
          'width: 100%; aspect-ratio: 2/1; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; margin-bottom: 15px;',
      }) as SVGSVGElement;

      // Add mouse event listeners directly to the SVG element
      svgElement.addEventListener('mousemove', handleMouseMove);
      svgElement.addEventListener('mouseup', handleMouseUp);
      svgElement.addEventListener('mouseleave', handleMouseUp);
      svgElement.addEventListener('dblclick', handleDoubleClick);

      // Add static grid with VanJS
      const gridGroup = g(
        { class: 'grid' },
        // Vertical lines
        ...Array.from({ length: 11 }, (_, i) => {
          const x = (i / 10) * 400;
          return line({
            x1: x,
            y1: 0,
            x2: x,
            y2: 200,
            stroke: '#333',
            'stroke-width': 1,
          });
        }),
        // Horizontal lines
        ...Array.from({ length: 11 }, (_, i) => {
          const y = (i / 10) * 200;
          return line({
            x1: 0,
            y1: y,
            x2: 400,
            y2: y,
            stroke: '#333',
            'stroke-width': 1,
          });
        })
      );

      // Add envelope path with VanJS (reactive)
      const envelopePath = path({
        d: () => {
          envelope.updateTrigger.val; // Dependency
          return envelope.getSVGPath(400, 200);
        },
        fill: 'none',
        stroke: '#4ade80',
        'stroke-width': 2,
      });

      // Create manual DOM group for control points
      pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pointsGroup.setAttribute('class', 'control-points');

      // Assemble SVG
      svgElement.appendChild(gridGroup);
      svgElement.appendChild(envelopePath);
      svgElement.appendChild(pointsGroup);

      // Set up reactivity for manual DOM updates
      van.derive(() => {
        envelope.updateTrigger.val; // Dependency on envelope changes
        selectedPoint.val; // Dependency on selection changes
        updateControlPoints();
      });

      return svgElement;
    })(),

    // Info displays (VanJS)
    div(
      {
        style:
          'margin-top: 8px; font-family: monospace; color: #888; font-size: 14px;',
      },
      'Preview Value: ',
      () => envelope.previewValue.val.toFixed(3)
    ),

    div(
      {
        style:
          'margin-top: 4px; font-family: monospace; color: #666; font-size: 12px;',
      },
      () =>
        `Points: ${envelope.getPoints().length} | Double-click to add, double-click point to delete`
    )
  );

  // Store envelope controller reference for external access
  (element as any).envelopeController = envelope;

  return element;
};

// Integration helper for SamplerElement
export const createAudioEnvelopeController = () =>
  new AudioEnvelopeController();

export const defineEnvelope = (elementName: string = 'envelope-element') => {
  define(elementName, EnvelopeElement, false);
};

//   const handleMouseMove = (e: MouseEvent) => {
//     if (isDragging.val && selectedPoint.val !== null) {
//       const rect = svgElement.getBoundingClientRect();

//       // Direct conversion to normalized coordinates (0-1)
//       const time = Math.max(
//         0,
//         Math.min(1, (e.clientX - rect.left) / rect.width)
//       );
//       const value = Math.max(
//         0,
//         Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
//       );

//       envelope.updatePoint(selectedPoint.val, time, value);
//     }
//   };

// applyToAudioParam(
//   audioParam: AudioParam,
//   startTime: number,
//   duration: number,
//   minValue: number = 0.001
// ) {
//   audioParam.cancelScheduledValues(startTime);

//   const sortedPoints = [...this.points].sort((a, b) => a.time - b.time);

//   sortedPoints.forEach((point, index) => {
//     const absoluteTime = startTime + point.time * duration;
//     const safeValue = Math.max(point.value, minValue);

//     if (index === 0) {
//       audioParam.setValueAtTime(safeValue, absoluteTime);
//     } else {
//       const prevPoint = sortedPoints[index - 1];

//       if (
//         prevPoint.curve === 'exponential' &&
//         point.value > 0 &&
//         prevPoint.value > 0
//       ) {
//         audioParam.exponentialRampToValueAtTime(safeValue, absoluteTime);
//       } else {
//         audioParam.linearRampToValueAtTime(safeValue, absoluteTime);
//       }
//     }
//   });
// }

// export const IntegrateWithSampler = (
//   samplePlayer: any,
//   envelopeController: AudioEnvelopeController
// ) => {
//   const originalTrigger = samplePlayer.trigger?.bind(samplePlayer);

//   if (originalTrigger) {
//     samplePlayer.trigger = (note: number, velocity: number = 1) => {
//       const result = originalTrigger(note, velocity);

//       if (samplePlayer.gainNode && samplePlayer.audioContext) {
//         const currentTime = samplePlayer.audioContext.currentTime;
//         const duration = 2;

//         envelopeController.applyToAudioParam(
//           samplePlayer.gainNode.gain,
//           currentTime,
//           duration
//         );
//       }

//       return result;
//     };
//   }
// };
