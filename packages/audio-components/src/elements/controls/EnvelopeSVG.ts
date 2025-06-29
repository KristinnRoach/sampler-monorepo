// EnvelopeSVG.ts
import van from '@repo/vanjs-core';
import type { EnvelopePoint, EnvelopeData, EnvelopeType } from '@repo/audiolib';
import { gsap, MotionPathPlugin, DrawSVGPlugin, CustomEase } from 'gsap/all';

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, CustomEase);

const { svg, path, line, g, div, circle } = van.tags(
  'http://www.w3.org/2000/svg'
);

export const EnvelopeSVG = (
  envelopeType: EnvelopeType,
  initialEnvValues: EnvelopeData,
  onPointUpdate: (
    envType: EnvelopeType,
    index: number,
    time: number,
    value: number
  ) => void,
  width: string = '100%',
  height: string = '120px',
  snapToValues: { y?: number[]; x?: number[] } = { y: [0], x: [0, 1] },
  snapThreshold = 0.025
  // maxDuration = 1,
  // currentDuration = 1
) => {
  if (!initialEnvValues.points.length) {
    const emptyDiv = div(
      {
        style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;`,
      },
      'No envelope data'
    );
    return {
      element: emptyDiv as SVGSVGElement, // Type assertion needed
      triggerPlayAnimation: () => {}, // No-op
      releaseAnimation: () => {}, // No-op
    };
  }

  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;
  let envelopePath: SVGPathElement;
  let activeTweens: Map<number, gsap.core.Tween> = new Map();
  let playheads: Map<number, Element> = new Map();

  // UI states
  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);
  const points = van.state(initialEnvValues.points);

  // Helper to generate SVG path from points
  const generateSVGPath = (pts: EnvelopePoint[]): string => {
    if (pts.length < 2) return `M0,200 L400,200`;

    const sortedPoints = [...pts].sort((a, b) => a.time - b.time);
    let path = `M${sortedPoints[0].time * 400},${(1 - sortedPoints[0].value) * 200}`;

    for (let i = 1; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      const prevPoint = sortedPoints[i - 1];

      const x = point.time * 400;
      const y = (1 - point.value) * 200;

      if (prevPoint.curve === 'exponential') {
        const prevX = prevPoint.time * 400;
        const prevY = (1 - prevPoint.value) * 200;
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
  };

  // Playback position indicator
  const createPlayhead = (voiceId: string) =>
    circle({
      id: `playhead-${voiceId}`,
      cx: 2.5,
      cy: 197.5,
      r: 5,
      fill: 'tranparent',
      'stroke-width': 2,
      class: 'playhead',
    });

  const clickCounts = van.state<Record<number, number>>({});

  const updateControlPoints = () => {
    if (!pointsGroup) return;

    pointsGroup.innerHTML = '';
    const pts = points.val;

    pts.forEach((point, index) => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      circle.setAttribute('cx', (point.time * 400).toString());
      circle.setAttribute('cy', ((1 - point.value) * 200).toString());
      circle.setAttribute('r', '4');
      circle.setAttribute(
        'fill',
        selectedPoint.val === index ? '#ff6b6b' : '#4ade80'
      );
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.style.cursor = 'pointer';

      // Special styling for start/end points
      if (index === 0 || index === pts.length - 1) {
        circle.setAttribute('fill', '#ff9500'); // Orange for duration handles
        circle.setAttribute('r', '6'); // Slightly bigger
      }

      // Mouse down - start drag

      // Current approach is a somewhat convoluted way to allow using single click
      // for moving a point and double click for adding a point (only one that worked)

      let clickTimeout: number;

      circle.addEventListener('mousedown', (e: MouseEvent) => {
        const currentCount = (clickCounts.val[index] || 0) + 1;
        clickCounts.val = { ...clickCounts.val, [index]: currentCount };

        // First click - start drag immediately and start timer
        isDragging.val = true;
        selectedPoint.val = index;

        // Clear existing timeout
        clearTimeout(clickTimeout);

        if (currentCount === 1) {
          // 250ms time given to double click
          clickTimeout = setTimeout(() => {
            clickCounts.val = { ...clickCounts.val, [index]: 0 };
          }, 250);
        } else if (currentCount === 2) {
          // Second click - delete and stop dragging
          isDragging.val = false;
          if (index > 0 && index < pts.length - 1) {
            const newPoints = points.val.filter((_, i) => i !== index);
            points.val = newPoints;
            onPointUpdate(envelopeType, index, -1, -1);
          }
          clickCounts.val = { ...clickCounts.val, [index]: 0 };
        }
        e.preventDefault();
      });

      pointsGroup.appendChild(circle);
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.val && selectedPoint.val !== null) {
      const rect = svgElement.getBoundingClientRect();

      let time = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      let value = Math.max(
        0,
        Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
      );

      const closestSnapY = snapToValues.y?.find(
        (v) => Math.abs(v - value) < snapThreshold
      );

      const closestSnapX = snapToValues.x?.find(
        (v) => Math.abs(v - time) < snapThreshold
      );

      if (closestSnapY) value = closestSnapY;
      if (closestSnapX) time = closestSnapX;

      // Update UI state
      const newPoints = [...points.val];

      newPoints[selectedPoint.val] = {
        ...newPoints[selectedPoint.val],
        time,
        value,
      };

      points.val = newPoints;

      // Update audio logic via callback
      onPointUpdate(envelopeType, selectedPoint.val, time, value);
    }
  };

  const handleMouseUp = () => {
    isDragging.val = false;
    selectedPoint.val = null;
  };

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling

    if (isDragging.val) return;
    const rect = svgElement.getBoundingClientRect();
    const time = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const value = Math.max(
      0, // todo: if click is near the current envelope line it should likely be exactly on the line when created
      Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
    );
    // Update UI state
    const newPoint = { time, value, curve: 'exponential' as const };
    const newPoints = [...points.val, newPoint].sort((a, b) => a.time - b.time);
    points.val = newPoints;
    // Update audio logic via callback
    onPointUpdate(envelopeType, -1, time, value);
  };

  // Create SVG element
  svgElement = svg({
    viewBox: '0 0 400 200',
    preserveAspectRatio: 'none',
    style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px;`,
  }) as SVGSVGElement;

  // Add event listeners
  svgElement.addEventListener('mousemove', handleMouseMove);
  svgElement.addEventListener('mouseup', handleMouseUp);
  svgElement.addEventListener('mouseleave', handleMouseUp);
  svgElement.addEventListener('dblclick', handleDoubleClick);

  // Grid
  const gridGroup = g(
    { class: 'grid' },
    ...Array.from({ length: 6 }, (_, i) => {
      const x = (i / 5) * 400;
      return line({
        x1: x,
        y1: 0,
        x2: x,
        y2: 200,
        stroke: '#333',
        'stroke-width': 1,
      });
    }),
    ...Array.from({ length: 6 }, (_, i) => {
      const y = (i / 5) * 200;
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

  // Envelope path
  envelopePath = path({
    id: '#path',
    d: () => generateSVGPath(points.val),
    fill: 'none',
    stroke: '#4ade80',
    'stroke-width': 2,
  }) as SVGPathElement;

  // Control points group
  pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'control-points');

  // Assemble SVG
  svgElement.appendChild(gridGroup);
  svgElement.appendChild(envelopePath);
  svgElement.appendChild(pointsGroup);

  // Update when points change
  van.derive(() => {
    points.val;
    selectedPoint.val;
    updateControlPoints();
    // Precompute ease when envelope changes
    setTimeout(() => precomputeEase(), 0); // Slight delay to ensure path is updated
  });

  // Update points when prop changes
  van.derive(() => {
    points.val = initialEnvValues.points;
  });

  // Add caching to avoid recomputing the same ease multiple times
  const easeCache = new Map<string, string>(); // Store ease names, not objects

  function createTimeBasedEase(pathElement: SVGPathElement): string | null {
    // Return ease name
    // Create cache key from path data
    const pathData = pathElement.getAttribute('d') || '';
    const cacheKey = `ease-${pathData}`;

    // Return cached ease if it exists
    if (easeCache.has(cacheKey)) {
      return easeCache.get(cacheKey)!;
    }

    try {
      const pathLength = pathElement.getTotalLength();

      const numSamples = 20;
      const samples = [];

      for (let i = 0; i <= numSamples; i++) {
        const progress = i / numSamples;
        const distanceAlongPath = progress * pathLength;
        const pointOnPath = pathElement.getPointAtLength(distanceAlongPath);
        const timeValue = pointOnPath.x / 400;

        samples.push({ progress, time: timeValue });
      }

      const easePoints = [];
      const numEasePoints = 10;

      for (let i = 0; i <= numEasePoints; i++) {
        const targetTime = i / numEasePoints;

        // binary search
        let left = 0;
        let right = samples.length - 1;
        let closestSample = samples[0];

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const midSample = samples[mid];

          if (
            Math.abs(midSample.time - targetTime) <
            Math.abs(closestSample.time - targetTime)
          ) {
            closestSample = midSample;
          }

          if (midSample.time < targetTime) {
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        easePoints.push(closestSample.progress);
      }

      // Create path
      let pathDataStr = `M0,${easePoints[0]}`;
      for (let i = 1; i < easePoints.length; i++) {
        const x = i / (easePoints.length - 1);
        const y = easePoints[i];
        pathDataStr += ` L${x},${y}`;
      }

      // Create and cache the ease
      const easeName = `timeCorrection-${Date.now()}`;
      CustomEase.create(easeName, pathDataStr);
      easeCache.set(cacheKey, easeName);

      return easeName;
    } catch (error) {
      console.warn('Failed to create time-based ease:', error);
      return null;
    }
  }

  let currentEase: string | null = null;

  // Called whenever envelope points change
  function precomputeEase() {
    currentEase = createTimeBasedEase(envelopePath);
  }

  function triggerPlayAnimation(msg: any) {
    if (activeTweens.has(msg.voiceId)) {
      const existing = activeTweens.get(msg.voiceId);
      existing && existing.isActive() && existing.kill();
      activeTweens.delete(msg.voiceId);
    }

    const playhead = createPlayhead(msg.voiceId);
    svgElement.appendChild(playhead);

    const envDuration = msg.envDurations[envelopeType] ?? 0;
    const isLooping = msg.loopEnabled?.[envelopeType] ?? false;

    // ! Remove if all env-types should use time correction (other wise only compute if being used (in van.derive at top))
    const shouldUseTimeCorrection = true; // envelopeType === 'amp-env';
    const easeToUse = shouldUseTimeCorrection ? currentEase || 'none' : 'none';

    const newTween = gsap.to(playhead, {
      id: msg.voiceId,
      motionPath: {
        path: envelopePath,
        align: envelopePath,
        alignOrigin: [0.5, 0.5],
      },
      duration: envDuration,
      repeat: isLooping ? -1 : 0,
      ease: easeToUse,
      onStart: () => playhead.setAttribute('fill', 'red'),
      onComplete: () => playhead.setAttribute('fill', 'transparent'),
    });

    playheads.set(msg.voiceId, playhead);
    activeTweens.set(msg.voiceId, newTween);
  }

  function releaseAnimation(msg: any) {
    // console.table({ releaseAnimation: msg });

    if (activeTweens.has(msg.voiceId)) {
      const existing = activeTweens.get(msg.voiceId);
      existing && existing.isActive() && existing.kill();
      activeTweens.delete(msg.voiceId);
    }
    if (playheads.has(msg.voiceId)) {
      const head = playheads.get(msg.voiceId);
      if (head && head.parentNode === svgElement) {
        svgElement.removeChild(head);
      }
      playheads.delete(msg.voiceId);
    }
  }

  return {
    element: svgElement,
    triggerPlayAnimation,
    releaseAnimation,
  };
};

// Functioning timing-wise but JANKY animation:
// function triggerPlayAnimation(msg: any) {
//   if (activeTweens.has(msg.voiceId)) {
//     const existing = activeTweens.get(msg.voiceId);
//     existing && existing.isActive() && existing.kill();
//     activeTweens.delete(msg.voiceId);
//   }

//   const playhead = createPlayhead(msg.voiceId);
//   svgElement.appendChild(playhead);

//   const envDuration = msg.envDurations[envelopeType] ?? 0;
//   const isLooping = msg.loopEnabled?.[envelopeType] ?? false;

//   // Create custom object to animate
//   const animationProgress = { progress: 0 };

//   const newTween = gsap.to(animationProgress, {
//     progress: 1,
//     duration: envDuration,
//     repeat: isLooping ? -1 : 0,
//     ease: 'none',
//     onUpdate: () => {
//       // Calculate position based on x-axis time (not path distance)
//       const currentTime = animationProgress.progress;
//       const position = getPositionAtTime(currentTime, points.val);

//       // Update playhead position
//       playhead.setAttribute('cx', position.x.toString());
//       playhead.setAttribute('cy', position.y.toString());
//     },
//     onStart: () => playhead.setAttribute('fill', 'red'),
//     onComplete: () => playhead.setAttribute('fill', 'transparent'),
//   });

//   playheads.set(msg.voiceId, playhead);
//   activeTweens.set(msg.voiceId, newTween);
// }

// // Helper function to get position at specific time (0-1)
// function getPositionAtTime(
//   time: number,
//   pts: EnvelopePoint[]
// ): { x: number; y: number } {
//   const sortedPoints = [...pts].sort((a, b) => a.time - b.time);

//   // Find the two points we're between
//   let beforePoint = sortedPoints[0];
//   let afterPoint = sortedPoints[sortedPoints.length - 1];

//   for (let i = 0; i < sortedPoints.length - 1; i++) {
//     if (time >= sortedPoints[i].time && time <= sortedPoints[i + 1].time) {
//       beforePoint = sortedPoints[i];
//       afterPoint = sortedPoints[i + 1];
//       break;
//     }
//   }

//   // Handle edge cases
//   if (time <= beforePoint.time) {
//     return {
//       x: beforePoint.time * 400,
//       y: (1 - beforePoint.value) * 200,
//     };
//   }
//   if (time >= afterPoint.time) {
//     return {
//       x: afterPoint.time * 400,
//       y: (1 - afterPoint.value) * 200,
//     };
//   }

//   // Linear interpolation between the two points based on TIME, not distance
//   const timeDiff = afterPoint.time - beforePoint.time;
//   const localProgress = (time - beforePoint.time) / timeDiff;

//   return {
//     x:
//       beforePoint.time * 400 +
//       (afterPoint.time - beforePoint.time) * 400 * localProgress,
//     y:
//       (1 - beforePoint.value) * 200 +
//       (1 - afterPoint.value - (1 - beforePoint.value)) * 200 * localProgress,
//   };
// }

// // Add caching to avoid recomputing the same ease multiple times
// const easeCache = new Map<string, string>(); // Store ease names, not objects

// function createTimeBasedEase(pathElement: SVGPathElement): string | null {
//   // Return ease name
//   // Create cache key from path data
//   const pathData = pathElement.getAttribute('d') || '';
//   const cacheKey = `ease-${pathData}`;

//   // Return cached ease if it exists
//   if (easeCache.has(cacheKey)) {
//     return easeCache.get(cacheKey)!;
//   }

//   try {
//     const pathLength = pathElement.getTotalLength();

//     // OPTIMIZATION 1: Reduce samples (20 is usually enough)
//     const numSamples = 20; // Reduced from 50
//     const samples = [];

//     for (let i = 0; i <= numSamples; i++) {
//       const progress = i / numSamples;
//       const distanceAlongPath = progress * pathLength;
//       const pointOnPath = pathElement.getPointAtLength(distanceAlongPath);
//       const timeValue = pointOnPath.x / 400;

//       samples.push({ progress, time: timeValue });
//     }

//     // OPTIMIZATION 2: Reduce ease points (10 is usually enough)
//     const easePoints = [];
//     const numEasePoints = 10; // Reduced from 20

//     for (let i = 0; i <= numEasePoints; i++) {
//       const targetTime = i / numEasePoints;

//       // OPTIMIZATION 3: Simple binary search instead of linear search
//       let left = 0;
//       let right = samples.length - 1;
//       let closestSample = samples[0];

//       while (left <= right) {
//         const mid = Math.floor((left + right) / 2);
//         const midSample = samples[mid];

//         if (
//           Math.abs(midSample.time - targetTime) <
//           Math.abs(closestSample.time - targetTime)
//         ) {
//           closestSample = midSample;
//         }

//         if (midSample.time < targetTime) {
//           left = mid + 1;
//         } else {
//           right = mid - 1;
//         }
//       }

//       easePoints.push(closestSample.progress);
//     }

//     // Create path with fewer points
//     let pathDataStr = `M0,${easePoints[0]}`;
//     for (let i = 1; i < easePoints.length; i++) {
//       const x = i / (easePoints.length - 1);
//       const y = easePoints[i];
//       pathDataStr += ` L${x},${y}`;
//     }

//     // Create and cache the ease
//     const easeName = `timeCorrection-${Date.now()}`;
//     CustomEase.create(easeName, pathDataStr);
//     easeCache.set(cacheKey, easeName);

//     return easeName;
//   } catch (error) {
//     console.warn('Failed to create time-based ease:', error);
//     return null;
//   }
// }

// // OPTIMIZATION 4: Precompute ease when envelope changes, not during animation
// let currentEase: string | null = null;

// // Call this whenever envelope points change (in your updateControlPoints or similar)
// function precomputeEase() {
//   currentEase = createTimeBasedEase(envelopePath);
// }

// // Simplified triggerPlayAnimation - no computation during animation
// function triggerPlayAnimation(msg: any) {
//   if (activeTweens.has(msg.voiceId)) {
//     const existing = activeTweens.get(msg.voiceId);
//     existing && existing.isActive() && existing.kill();
//     activeTweens.delete(msg.voiceId);
//   }

//   const playhead = createPlayhead(msg.voiceId);
//   svgElement.appendChild(playhead);

//   const envDuration = msg.envDurations[envelopeType] ?? 0;
//   const isLooping = msg.loopEnabled?.[envelopeType] ?? false;

//   // OPTIMIZATION 5: Use precomputed ease (no computation during animation)
//   const newTween = gsap.to(playhead, {
//     id: msg.voiceId,
//     motionPath: {
//       path: envelopePath,
//       align: envelopePath,
//       alignOrigin: [0.5, 0.5],
//     },
//     duration: envDuration,
//     repeat: isLooping ? -1 : 0,
//     ease: currentEase || 'none',
//     onStart: () => playhead.setAttribute('fill', 'red'),
//     onComplete: () => playhead.setAttribute('fill', 'transparent'),
//   });

//   playheads.set(msg.voiceId, playhead);
//   activeTweens.set(msg.voiceId, newTween);
// }
