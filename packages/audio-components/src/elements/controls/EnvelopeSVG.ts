// EnvelopeSVG.ts
import van from '@repo/vanjs-core';
import type { EnvelopePoint, EnvelopeType } from '@repo/audiolib';
import { generateMidiNoteColors } from '../../utils/generateColors';
import { gsap, MotionPathPlugin, DrawSVGPlugin, CustomEase } from 'gsap/all';

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, CustomEase);

const { svg, path, line, g, div, circle } = van.tags(
  'http://www.w3.org/2000/svg'
);

export const EnvelopeSVG = (
  envelopeType: EnvelopeType,
  initialPoints: EnvelopePoint[],
  maxDurationInSeconds: number,
  onPointUpdate: (
    envType: EnvelopeType,
    index: number,
    time: number,
    value: number
  ) => void,
  width: string = '100%',
  height: string = '120px',
  snapToValues: { y?: number[]; x?: number[] } = { y: [0], x: [0, 1] },
  snapThreshold = 0.025,
  multiColorPlayheads = false
) => {
  if (!initialPoints.length) {
    const emptyDiv = div(
      {
        style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;`,
      },
      'No envelope data'
    );
    return {
      element: emptyDiv as unknown as SVGSVGElement,
      triggerPlayAnimation: () => {},
      releaseAnimation: () => {},
      updateMaxDuration: () => {},
      updateEnvelopeDuration: () => {},
      cleanup: () => {},
    };
  }

  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 200;

  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;
  let envelopePath: SVGPathElement;

  const activeTweens: Map<number, gsap.core.Tween> = new Map();
  const playheads: Map<number, Element> = new Map();
  // let currentEase: string | null = null;
  const easeCache = new Map<string, string>(); // ease key -> ease name

  let noteColor: string | Record<number, string>;
  if (multiColorPlayheads)
    noteColor = generateMidiNoteColors('none', [40, 90], true);
  else noteColor = 'red';

  // UI states
  const maxDurationSeconds = van.state(maxDurationInSeconds);
  const currentDurationSeconds = van.state(maxDurationInSeconds);

  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);
  const points = van.state(initialPoints); // Reactive - Overwrites current state if receives new props !
  // const points = van.state([...initialEnvValues.points]); // Use this instead if values never change
  const currentEase = van.state<string | null>(null);

  // Helper to generate SVG path from points
  const generateSVGPath = (pts: EnvelopePoint[]): string => {
    if (pts.length < 2) return `M0,200 L400,200`;

    const sortedPoints = [...pts].sort((a, b) => a.time - b.time);
    let path = `M${sortedPoints[0].time * SVG_WIDTH},${(1 - sortedPoints[0].value) * SVG_HEIGHT}`;

    for (let i = 1; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      const prevPoint = sortedPoints[i - 1];

      const x = point.time * SVG_WIDTH;
      const y = (1 - point.value) * SVG_HEIGHT;

      if (prevPoint.curve === 'exponential') {
        const prevX = prevPoint.time * SVG_WIDTH;
        const prevY = (1 - prevPoint.value) * SVG_HEIGHT;
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
      style: () => `pointer-events: none`,
      id: `playhead-${voiceId}`,
      cx: 2.5,
      cy: 197.5,
      r: 5,
      fill: 'transparent',
      'stroke-width': 2,
      class: 'playhead',
      tabIndex: -1,
    }) as SVGCircleElement;

  let clickCounts: Record<number, number> = {};
  const activeTimeouts = new Set<number>();

  const updateControlPoints = () => {
    if (!pointsGroup) return;

    // Clear all existing timeouts before destroying circles
    activeTimeouts.forEach(clearTimeout);
    activeTimeouts.clear();

    pointsGroup.innerHTML = '';
    const pts = points.val;

    pts.forEach((point, index) => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      circle.setAttribute('cx', (point.time * SVG_WIDTH).toString());
      circle.setAttribute('cy', ((1 - point.value) * SVG_HEIGHT).toString());
      circle.setAttribute('r', '4');
      circle.setAttribute(
        'fill',
        selectedPoint.val === index ? '#ff6b6b' : '#4ade80'
      );
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.style.cursor = 'pointer';

      // Special case for start/end points
      if (index === 0 || index === pts.length - 1) {
        // Update duration based on time span of envelope points
        const timeSpan = pts[pts.length - 1].time - pts[0].time;
        const newDuration = timeSpan * maxDurationSeconds.val; // Convert back to seconds
        if (Math.abs(currentDurationSeconds.val - newDuration) > 0.001) {
          currentDurationSeconds.val = newDuration;
        }

        circle.setAttribute('fill', '#ff9500'); // Orange for duration handles
        circle.setAttribute('r', '6'); // Slightly bigger
      }

      // Mouse down - start drag
      // Current approach is a somewhat convoluted way to allow using single click
      // for moving a point and double click for adding a point (only one that worked)

      // const activeTimeouts = new Set<number>();
      let clickTimeout: number;

      circle.addEventListener('mousedown', (e: MouseEvent) => {
        const currentCount = (clickCounts[index] || 0) + 1;
        clickCounts = { ...clickCounts, [index]: currentCount };

        // First click - start drag immediately and start timer
        isDragging.val = true;
        selectedPoint.val = index;

        // Clear existing timeout
        clearTimeout(clickTimeout);

        if (currentCount === 1) {
          // 250ms time given to double click
          clickTimeout = setTimeout(() => {
            clickCounts = { ...clickCounts, [index]: 0 };
            activeTimeouts.delete(clickTimeout);
          }, 250);
          activeTimeouts.add(clickTimeout);
        } else if (currentCount === 2) {
          // Second click - delete and stop dragging
          isDragging.val = false;
          if (index > 0 && index < pts.length - 1) {
            const newPoints = points.val.filter((_, i) => i !== index);
            points.val = newPoints;
            onPointUpdate(envelopeType, index, -1, -1);
          }
          clickCounts = { ...clickCounts, [index]: 0 };
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
    viewBox: `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`,
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
      const x = (i / 5) * SVG_WIDTH;
      return line({
        x1: x,
        y1: 0,
        x2: x,
        y2: SVG_HEIGHT,
        stroke: '#333',
        'stroke-width': 1,
      });
    }),
    ...Array.from({ length: 6 }, (_, i) => {
      const y = (i / 5) * SVG_HEIGHT;
      return line({
        x1: 0,
        y1: y,
        x2: SVG_WIDTH,
        y2: y,
        stroke: '#333',
        'stroke-width': 1,
      });
    })
  );

  // Envelope path
  envelopePath = path({
    id: 'path',
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

    // setTimeout(() => refreshPlayingAnimations(), 0); // ensures path is updated

    setTimeout(() => {
      currentEase.val = createTimeBasedEase(envelopePath);
      refreshPlayingAnimations();
    }, 0);
  });

  // Update current points and durationwhen prop changes
  van.derive(() => {
    points.val = initialPoints;
  });

  van.derive(() => (maxDurationSeconds.val = maxDurationInSeconds));

  function createTimeBasedEase(pathElement: SVGPathElement): string | null {
    const pathData = pathElement.getAttribute('d');
    if (!pathData) return null;

    const cacheKey = `ease-${pathData}`;
    if (easeCache.has(cacheKey)) return easeCache.get(cacheKey) || null;

    try {
      const pathLength = pathElement.getTotalLength();
      const numSamples = 50;
      const samples = [];

      // Sample the path by progress (0 to 1)
      for (let i = 0; i <= numSamples; i++) {
        const progress = i / numSamples;
        const distance = progress * pathLength;
        const pt = pathElement.getPointAtLength(distance);
        const time = pt.x / SVG_WIDTH; // Map x to [0,1] time
        samples.push({ progress, time });
      }

      // For each target time, find the closest sample (monotonic in x)
      const easePoints = [];
      const numEasePoints = 10;
      for (let i = 0; i <= numEasePoints; i++) {
        const targetTime = i / numEasePoints;
        let closest = samples[0];
        for (const s of samples) {
          if (
            Math.abs(s.time - targetTime) < Math.abs(closest.time - targetTime)
          ) {
            closest = s;
          }
        }
        easePoints.push({ x: targetTime, y: closest.progress });
      }

      // Build the ease path string
      let pathStr = `M${easePoints[0].x},${easePoints[0].y}`;
      for (let i = 1; i < easePoints.length; i++) {
        pathStr += ` L${easePoints[i].x},${easePoints[i].y}`;
      }

      const easeName = `timeCorrection-${Date.now()}`;
      CustomEase.create(easeName, pathStr);
      easeCache.set(cacheKey, easeName);

      return easeName;
    } catch (e) {
      console.warn('Failed to create time-based ease:', e);
      return null;
    }
  }

  function triggerPlayAnimation(msg: any) {
    if (!currentEase.val) {
      console.debug('Had to create currentEase in triggerPlayAnimation!');
      currentEase.val = createTimeBasedEase(envelopePath) || 'none';
    }

    if (activeTweens.has(msg.voiceId)) {
      const existing = activeTweens.get(msg.voiceId);
      existing && existing.isActive() && existing.kill();
      activeTweens.delete(msg.voiceId);
    }

    if (!msg.envDurations[envelopeType]) return;

    // const envDuration = currentDurationSeconds.val;

    const envDuration = msg.envDurations[envelopeType];
    if (currentDurationSeconds.val !== envDuration)
      currentDurationSeconds.val = envDuration;

    const playhead = createPlayhead(msg.voiceId);
    svgElement.appendChild(playhead);

    const isLooping = msg.loopEnabled?.[envelopeType] ?? false;
    const easeToUse = currentEase.val ? currentEase.val : 'none';
    const color = multiColorPlayheads ? noteColor[msg.midiNote] : 'red';

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
      onStart: () => playhead.setAttribute('fill', color),
      onComplete: () => playhead.setAttribute('fill', 'transparent'),
    });

    playheads.set(msg.voiceId, playhead);
    activeTweens.set(msg.voiceId, newTween);
  }

  function releaseAnimation(msg: any) {
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

  function refreshPlayingAnimations() {
    // if (envelopePath && points.val.length) createTimeBasedEase(envelopePath);

    for (let [voiceId, tween] of activeTweens) {
      if (tween.isActive()) {
        // const progress = tween.progress();
        const totalTime = tween.time(); // <--- Capture absolute time
        const isLooping = tween.vars.repeat === -1;
        const tweenDuration = (tween.vars.duration as number) ?? 0;

        const currentDuration = currentDurationSeconds.val;

        // Always update path, but only update duration for loops if it changed
        const durationChanged =
          Math.abs(currentDuration - tweenDuration) > 0.001;
        const shouldUpdateDuration = isLooping && durationChanged;

        tween.kill();

        const playhead = playheads.get(voiceId);
        if (playhead) {
          const newTween = gsap.to(playhead, {
            motionPath: {
              path: envelopePath, // Always update path
              align: envelopePath,
              alignOrigin: [0.5, 0.5],
            },
            duration: shouldUpdateDuration ? currentDuration : tweenDuration,
            repeat: isLooping ? -1 : 0,
            ease: currentEase.val || 'none',
            onStart: () => playhead.setAttribute('fill', 'red'),
            onComplete: () => playhead.setAttribute('fill', 'transparent'),
          });

          // newTween.progress(progress);
          newTween.time(totalTime); // <--- Restore absolute time
          activeTweens.set(voiceId, newTween);
        }
      }
    }
  }

  const updateMaxDuration = (seconds: number) => {
    console.warn('updateMaxDuration', seconds);
    if (seconds !== maxDurationSeconds.val) maxDurationSeconds.val = seconds;
  };
  const updateEnvelopeDuration = (seconds: number) => {
    console.warn('updateEnvelopeDuration', seconds);
    if (seconds !== currentDurationSeconds.val)
      currentDurationSeconds.val = seconds;
  };

  // van.derive(() => {
  //   currentDurationSeconds.val;
  //   console.warn('derive currentDur:', currentDurationSeconds.val);
  // });

  return {
    element: svgElement,
    triggerPlayAnimation,
    releaseAnimation,
    updateMaxDuration,
    updateEnvelopeDuration,
    cleanup: () => activeTimeouts.forEach(clearTimeout),
  };
};

// === Ignore code comments below ===

// function updateDuration(msg: any) {
//   const { voiceID, envDurations, loopEnabled } = msg;

//   const newDuration = envDurations[envelopeType];
//   // const tween = activeTweens.get(voiceId);
//   for (let [voiceId, tween] of activeTweens) {
//     if (tween && tween.isActive() && tween.vars.repeat === -1) {
//       // Only looping animations
//       const progress = tween.progress();
//       tween.kill();

//       const playhead = playheads.get(voiceId);
//       if (playhead) {
//         const newTween = gsap.to(playhead, {
//           motionPath: {
//             path: envelopePath,
//             align: envelopePath,
//             alignOrigin: [0.5, 0.5],
//           },
//           duration: newDuration,
//           repeat: -1,
//           ease: currentEase || 'none',
//           onStart: () => playhead.setAttribute('fill', 'red'),
//           onComplete: () => playhead.setAttribute('fill', 'transparent'),
//         });

//         newTween.progress(progress);
//         activeTweens.set(voiceId, newTween);
//       }
//     }
//   }
// }

// function createTimeBasedEase(pathElement: SVGPathElement): string | null {
//   const pathData = pathElement.getAttribute('d');
//   if (!pathData) return null;

//   const cacheKey = `ease-${pathData}`;
//   if (easeCache.has(cacheKey)) return easeCache.get(cacheKey)!;

//   try {
//     const pathLength = pathElement.getTotalLength();

//     const numSamples = 50;
//     const samples = [];

//     for (let i = 0; i <= numSamples; i++) {
//       const progress = i / numSamples;
//       const distanceAlongPath = progress * pathLength;
//       const pointOnPath = pathElement.getPointAtLength(distanceAlongPath);
//       const timeValue = pointOnPath.x / SVG_WIDTH;

//       samples.push({ progress, time: timeValue });
//     }

//     const easePoints = [];
//     const numEasePoints = 10;

//     for (let i = 0; i <= numEasePoints; i++) {
//       const targetTime = i / numEasePoints;

//       let left = 0; // binary search
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

//     // Create path
//     let pathDataStr = `M0,${easePoints[0]}`;
//     for (let i = 1; i < easePoints.length; i++) {
//       const x = i / (easePoints.length - 1);
//       const y = easePoints[i];
//       pathDataStr += ` L${x},${y}`;
//     }

//     // Create and cache
//     const easeName = `timeCorrection-${Date.now()}`;
//     CustomEase.create(easeName, pathDataStr);
//     easeCache.set(cacheKey, easeName);

//     return easeName;
//   } catch (error) {
//     console.warn('Failed to create time-based ease:', error);
//     return null;
//   }
// }
