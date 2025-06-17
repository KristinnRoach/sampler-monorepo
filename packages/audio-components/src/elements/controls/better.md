// Optimal Complex Envelope Scheduling using setValueCurveAtTime()

interface EnvelopePoint {
time: number; // 0-1 normalized
value: number; // 0-1 normalized
curve: 'linear' | 'exponential' | 'bezier';
controlPoint1?: { x: number; y: number };
controlPoint2?: { x: number; y: number };
}

interface EnvelopeConfig {
points: EnvelopePoint[];
loopStart?: number;
loopEnd?: number;
loopCount?: number;
sustainPoint?: number;
}

class OptimalEnvelopeScheduler {
// === MAIN SCHEDULING METHOD USING setValueCurveAtTime() ===
scheduleComplexEnvelope(
audioParam: AudioParam,
config: EnvelopeConfig,
startTime: number,
totalDuration: number,
sustainTime: number = 0,
releaseTime: number = 0.1,
sampleRate: number = 1000 // Samples per second for curve resolution
) {
audioParam.cancelScheduledValues(startTime);

    let currentTime = startTime;

    // 1. ATTACK/DECAY PHASE - Single curve until sustain/loop
    const sustainPoint = config.sustainPoint ?? config.points.length - 1;
    const loopStartTime = config.loopStart ?? 1.0;

    const attackDecayDuration = totalDuration * loopStartTime;
    const attackDecayPoints = config.points.filter(
      (p) => p.time <= loopStartTime
    );

    if (attackDecayPoints.length > 0) {
      const attackDecayCurve = this.generateCurveArray(
        attackDecayPoints,
        attackDecayDuration,
        sampleRate
      );

      audioParam.setValueCurveAtTime(
        attackDecayCurve,
        currentTime,
        attackDecayDuration
      );
      currentTime += attackDecayDuration;
    }

    // 2. LOOP PHASE using setValueCurveAtTime()
    if (
      config.loopStart !== undefined &&
      config.loopEnd !== undefined &&
      sustainTime > 0
    ) {
      const loopPoints = config.points.filter(
        (p) => p.time >= config.loopStart! && p.time <= config.loopEnd!
      );

      if (loopPoints.length > 0) {
        const loopDuration =
          (config.loopEnd - config.loopStart) * totalDuration;
        const numberOfLoops = Math.ceil(sustainTime / loopDuration);

        // Generate single loop curve
        const singleLoopCurve = this.generateCurveArray(
          this.normalizeLoopPoints(
            loopPoints,
            config.loopStart,
            config.loopEnd
          ),
          loopDuration,
          sampleRate
        );

        // Create extended curve by repeating the loop
        const fullLoopCurve = this.createLoopedCurve(
          singleLoopCurve,
          numberOfLoops,
          sustainTime,
          loopDuration,
          sampleRate
        );

        audioParam.setValueCurveAtTime(fullLoopCurve, currentTime, sustainTime);
        currentTime += sustainTime;
      }
    } else if (sustainTime > 0 && config.sustainPoint !== undefined) {
      // Simple sustain - hold constant value
      const sustainValue = config.points[config.sustainPoint].value;
      audioParam.setValueAtTime(sustainValue, currentTime);
      currentTime += sustainTime;
    }

    // 3. RELEASE PHASE
    if (releaseTime > 0) {
      const releasePoints = config.points.filter(
        (p) => p.time > (config.loopEnd ?? loopStartTime)
      );

      if (releasePoints.length > 0) {
        const releaseCurve = this.generateCurveArray(
          this.normalizeReleasePoints(
            releasePoints,
            config.loopEnd ?? loopStartTime
          ),
          releaseTime,
          sampleRate
        );

        audioParam.setValueCurveAtTime(releaseCurve, currentTime, releaseTime);
      } else {
        // Simple exponential release
        audioParam.exponentialRampToValueAtTime(
          0.001,
          currentTime + releaseTime
        );
      }
    }

}

// === CURVE GENERATION CORE ===
private generateCurveArray(
points: EnvelopePoint[],
duration: number,
sampleRate: number
): Float32Array {
const numSamples = Math.max(2, Math.floor(duration \* sampleRate));
const curve = new Float32Array(numSamples);

    if (points.length === 0) {
      curve.fill(0);
      return curve;
    }

    if (points.length === 1) {
      curve.fill(Math.max(points[0].value, 0.001));
      return curve;
    }

    // Sort points by time
    const sortedPoints = [...points].sort((a, b) => a.time - b.time);

    for (let i = 0; i < numSamples; i++) {
      const normalizedTime = i / (numSamples - 1); // 0 to 1
      const value = this.interpolateValue(sortedPoints, normalizedTime);
      curve[i] = Math.max(value, 0.001); // Prevent zero for exponential curves
    }

    return curve;

}

// === INTERPOLATION BETWEEN POINTS ===
private interpolateValue(points: EnvelopePoint[], time: number): number {
// Find surrounding points
let leftIndex = 0;
let rightIndex = points.length - 1;

    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        leftIndex = i;
        rightIndex = i + 1;
        break;
      }
    }

    const leftPoint = points[leftIndex];
    const rightPoint = points[rightIndex];

    if (leftIndex === rightIndex) {
      return leftPoint.value;
    }

    // Calculate interpolation factor
    const segmentDuration = rightPoint.time - leftPoint.time;
    const t =
      segmentDuration === 0 ? 0 : (time - leftPoint.time) / segmentDuration;

    // Apply curve type
    switch (leftPoint.curve) {
      case 'linear':
        return this.linearInterpolation(leftPoint.value, rightPoint.value, t);

      case 'exponential':
        return this.exponentialInterpolation(
          leftPoint.value,
          rightPoint.value,
          t
        );

      case 'bezier':
        return this.bezierInterpolation(leftPoint, rightPoint, t);

      default:
        return this.linearInterpolation(leftPoint.value, rightPoint.value, t);
    }

}

// === INTERPOLATION METHODS ===
private linearInterpolation(start: number, end: number, t: number): number {
return start + (end - start) \* t;
}

private exponentialInterpolation(
start: number,
end: number,
t: number
): number {
if (start <= 0 || end <= 0) {
return this.linearInterpolation(start, end, t);
}

    // Exponential interpolation: start * (end/start)^t
    return start * Math.pow(end / start, t);

}

private bezierInterpolation(
startPoint: EnvelopePoint,
endPoint: EnvelopePoint,
t: number
): number {
const p0 = startPoint.value;
const p3 = endPoint.value;

    // Use control points if available, otherwise create smooth curve
    const p1 = startPoint.controlPoint1?.y ?? p0 + (p3 - p0) * 0.33;
    const p2 = endPoint.controlPoint2?.y ?? p0 + (p3 - p0) * 0.66;

    return this.cubicBezier(p0, p1, p2, p3, t);

}

private cubicBezier(
p0: number,
p1: number,
p2: number,
p3: number,
t: number
): number {
const oneMinusT = 1 - t;
return (
oneMinusT _ oneMinusT _ oneMinusT _ p0 +
3 _ oneMinusT _ oneMinusT _ t _ p1 +
3 _ oneMinusT _ t _ t _ p2 +
t _ t _ t _ p3
);
}

// === LOOP UTILITIES ===
private normalizeLoopPoints(
points: EnvelopePoint[],
loopStart: number,
loopEnd: number
): EnvelopePoint[] {
return points.map((p) => ({
...p,
time: (p.time - loopStart) / (loopEnd - loopStart),
}));
}

private normalizeReleasePoints(
points: EnvelopePoint[],
releaseStart: number
): EnvelopePoint[] {
return points.map((p) => ({
...p,
time: (p.time - releaseStart) / (1 - releaseStart),
}));
}

private createLoopedCurve(
singleLoopCurve: Float32Array,
numberOfLoops: number,
totalSustainTime: number,
singleLoopDuration: number,
sampleRate: number
): Float32Array {
const totalSamples = Math.floor(totalSustainTime \* sampleRate);
const loopSamples = singleLoopCurve.length;
const result = new Float32Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
      const loopIndex = i % loopSamples;
      result[i] = singleLoopCurve[loopIndex];
    }

    return result;

}

// === USER-DRAWN CURVE SUPPORT ===
static fromUserDrawnCurve(
drawnPoints: { x: number; y: number }[], // Raw mouse/touch coordinates
canvasWidth: number,
canvasHeight: number
): EnvelopePoint[] {
return drawnPoints.map((point) => ({
time: point.x / canvasWidth,
value: 1 - point.y / canvasHeight, // Invert Y (canvas Y increases downward)
curve: 'linear' as const,
}));
}

// === DIRECT CURVE ARRAY SUPPORT ===
static scheduleDirectCurve(
audioParam: AudioParam,
curveArray: Float32Array,
startTime: number,
duration: number
) {
audioParam.cancelScheduledValues(startTime);
audioParam.setValueCurveAtTime(curveArray, startTime, duration);
}
}

// === INTEGRATION WITH YOUR ENVELOPE CONTROLLER ===

class AudioEnvelopeController {
private scheduler = new OptimalEnvelopeScheduler();
private points: EnvelopePoint[] = [];

// Enhanced scheduling using setValueCurveAtTime
applyOptimalEnvelope(
audioParam: AudioParam,
startTime: number,
noteDuration: number,
sustainTime: number = 0,
releaseTime: number = 0.1,
curveResolution: number = 1000 // Samples per second
) {
const config: EnvelopeConfig = {
points: this.points,
loopStart: this.loopStart?.val,
loopEnd: this.loopEnd?.val,
sustainPoint: this.findSustainPoint(),
};

    this.scheduler.scheduleComplexEnvelope(
      audioParam,
      config,
      startTime,
      noteDuration,
      sustainTime,
      releaseTime,
      curveResolution
    );

}

// Support for user-drawn envelopes
loadUserDrawnCurve(
drawnPoints: { x: number; y: number }[],
canvasWidth: number,
canvasHeight: number
) {
this.points = OptimalEnvelopeScheduler.fromUserDrawnCurve(
drawnPoints,
canvasWidth,
canvasHeight
);
this.updateTrigger.val++;
}

// Direct curve scheduling for maximum performance
applyDirectCurve(
audioParam: AudioParam,
startTime: number,
duration: number
) {
const curve = this.scheduler.generateCurveArray(
this.points,
duration,
1000
);
OptimalEnvelopeScheduler.scheduleDirectCurve(
audioParam,
curve,
startTime,
duration
);
}

private findSustainPoint(): number | undefined {
return this.points.findIndex((p) => (p as any).sustainPoint);
}
}

// === USAGE EXAMPLES ===

const examples = {
// Complex ADSR with custom curves
complexADSR: () => {
const envelope = new AudioEnvelopeController();

    // Define complex envelope with different curve types
    envelope.points = [
      { time: 0, value: 0, curve: 'linear' },
      { time: 0.1, value: 1, curve: 'exponential' }, // Fast attack
      {
        time: 0.3,
        value: 0.7,
        curve: 'bezier', // Smooth decay
        controlPoint1: { x: 0.15, y: 0.9 },
        controlPoint2: { x: 0.25, y: 0.8 },
      },
      { time: 0.7, value: 0.6, curve: 'linear' }, // Sustain variation
      { time: 1.0, value: 0, curve: 'exponential' }, // Release
    ];

    // Apply with looping sustain
    envelope.applyOptimalEnvelope(
      gainNode.gain,
      audioContext.currentTime,
      1.0, // 1 second base duration
      2.0, // 2 seconds sustain (with looping)
      0.5 // 0.5 second release
    );

},

// User-drawn envelope
userDrawn: (
canvas: HTMLCanvasElement,
mousePoints: { x: number; y: number }[]
) => {
const envelope = new AudioEnvelopeController();

    // Convert mouse drawing to envelope
    envelope.loadUserDrawnCurve(mousePoints, canvas.width, canvas.height);

    // Apply immediately
    envelope.applyDirectCurve(gainNode.gain, audioContext.currentTime, 2.0);

},

// Maximum performance for simple curves
directCurve: () => {
// Pre-calculate curve for repeated use
const curve = new Float32Array(1000);
for (let i = 0; i < 1000; i++) {
const t = i / 999;
curve[i] = Math.exp(-t _ 3) _ Math.sin(t _ Math.PI _ 4); // Damped oscillation
}

    // Apply directly
    OptimalEnvelopeScheduler.scheduleDirectCurve(
      gainNode.gain,
      curve,
      audioContext.currentTime,
      2.0
    );

},
};

/\*
=== ADVANTAGES OF THIS APPROACH ===

✅ NATIVE WEB AUDIO: Uses setValueCurveAtTime() - the optimal method
✅ ARBITRARY CURVES: Supports any curve shape (Bezier, exponential, user-drawn)
✅ LOOP SUPPORT: True looping via curve repetition
✅ HIGH PERFORMANCE: Single automation call per phase
✅ SAMPLE ACCURATE: Web Audio handles interpolation on audio thread
✅ FLEXIBLE RESOLUTION: Adjustable curve sampling rate
✅ USER INTERACTION: Direct support for mouse/touch drawn curves

=== PERFECT FOR YOUR USE CASE ===
This approach gives you everything you wanted:

- Custom envelope shapes ✅
- Adjustable curves (linear, exponential, bezier) ✅
- Loop points ✅
- Professional audio quality ✅
- User interaction support ✅
  \*/
