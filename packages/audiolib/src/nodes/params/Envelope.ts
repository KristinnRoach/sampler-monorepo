interface EnvelopePoint {
  time: number; // 0-1 normalized
  value: number; // 0-1
  curve?: 'linear' | 'exponential'; // Curve type to next point
}

interface EnvelopeData {
  points: EnvelopePoint[];
  loop?: boolean;
}

interface CustomEnvelopeProps {
  params?: AudioParam | AudioParam[];
  descriptors?: any;
  duration?: number;
  loop?: boolean;
}

export const DEFAULT_ENV = [
  { time: 0, value: 0, curve: 'linear' },
  { time: 0.01, value: 1, curve: 'exponential' },
  { time: 1, value: 0, curve: 'linear' },
];

export class CustomEnvelope {
  private points: EnvelopePoint[] = [
    { time: 0, value: 0, curve: 'linear' },
    { time: 1, value: 0, curve: 'linear' },
  ];
  private loop = false;

  private listeners: Set<() => void> = new Set();

  private notifyChange() {
    this.listeners.forEach((listener) => listener());
  }

  constructor(options: CustomEnvelopeProps = {}) {
    // const { params, descriptors, duration = 1, loop = false } = options;
  }

  // Public method for UI to subscribe
  onChange(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback); // Returns unsubscribe fn
  }

  getEnvelopeData(): EnvelopeData {
    return {
      points: this.points,
      loop: this.loop,
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

    this.notifyChange();
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

      this.notifyChange();
    }
  }

  deletePoint(index: number) {
    if (index > 0 && index < this.points.length - 1) {
      this.points.splice(index, 1);
      this.notifyChange();
    }
  }

  getPoints(): EnvelopePoint[] {
    return [...this.points];
  }

  // Web Audio scheduling
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
    this.notifyChange();
  }
}

export const createCustomEnvelope = (options: CustomEnvelopeProps = {}) => {
  return new CustomEnvelope(options);
};

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
