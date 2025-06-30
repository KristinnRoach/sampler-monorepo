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
  durationSeconds: number,
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
      releaseAnimation: () => {}, // No-ops
    };
  }

  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 200;

  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;
  let envelopePath: SVGPathElement;

  const activeTweens: Map<number, gsap.core.Tween> = new Map();

  const playheads: Map<number, Element> = new Map();

  let noteColor: string | Record<number, string>;
  if (multiColorPlayheads)
    noteColor = generateMidiNoteColors('none', [40, 90], true);
  else noteColor = 'red';

  // UI states
  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);
  const points = van.state(initialPoints); // Reactive - Overwrites current state if receives new props !
  const duration = van.state(durationSeconds);
  // const points = van.state([...initialEnvValues.points]); // Use this instead if values never change

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

      // Special styling for start/end points
      if (index === 0 || index === pts.length - 1) {
        circle.setAttribute('fill', '#ff9500'); // Orange for duration handles
        circle.setAttribute('r', '6'); // Slightly bigger
      }

      // Mouse down - start drag
      // Current approach is a somewhat convoluted way to allow using single click
      // for moving a point and double click for adding a point (only one that worked)
      const activeTimeouts = new Set<number>();
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
    duration.val;
    selectedPoint.val;
    updateControlPoints();
    refreshPlayingAnimations();

    setTimeout(() => {
      // Precompute ease when envelope changes
      if (envelopePath && points.val.length) precomputeEase();
    }, 0); // ensures path is updated and initial values received
  });

  // Update current points and durationwhen prop changes
  van.derive(() => (points.val = initialPoints));
  van.derive(() => (duration.val = durationSeconds));

  const easeCache = new Map<string, string>(); // ease key -> ease name

  function createTimeBasedEase(pathElement: SVGPathElement): string | null {
    const pathData = pathElement.getAttribute('d') || '';
    const cacheKey = `ease-${pathData}`;

    if (easeCache.has(cacheKey)) return easeCache.get(cacheKey)!;

    try {
      const pathLength = pathElement.getTotalLength();

      const numSamples = 20;
      const samples = [];

      for (let i = 0; i <= numSamples; i++) {
        const progress = i / numSamples;
        const distanceAlongPath = progress * pathLength;
        const pointOnPath = pathElement.getPointAtLength(distanceAlongPath);
        const timeValue = pointOnPath.x / SVG_WIDTH;

        samples.push({ progress, time: timeValue });
      }

      const easePoints = [];
      const numEasePoints = 10;

      for (let i = 0; i <= numEasePoints; i++) {
        const targetTime = i / numEasePoints;

        let left = 0; // binary search
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

      // Create and cache
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

  function precomputeEase() {
    currentEase = createTimeBasedEase(envelopePath);
  }

  function triggerPlayAnimation(msg: any) {
    if (!currentEase) currentEase = createTimeBasedEase(envelopePath);

    if (activeTweens.has(msg.voiceId)) {
      const existing = activeTweens.get(msg.voiceId);
      existing && existing.isActive() && existing.kill();
      activeTweens.delete(msg.voiceId);
    }

    const playhead = createPlayhead(msg.voiceId);
    svgElement.appendChild(playhead);

    const envDuration = msg.envDurations[envelopeType] ?? 0;
    const isLooping = msg.loopEnabled?.[envelopeType] ?? false;

    const easeToUse = currentEase ? currentEase : 'none';
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

  function refreshPlayingAnimations() {
    for (let [voiceId, tween] of activeTweens) {
      if (tween.isActive()) {
        const progress = tween.progress();
        const isLooping = tween.vars.repeat === -1;
        const currentDuration = duration.val;
        const tweenDuration = (tween.vars.duration as number) ?? 0;

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
            ease: currentEase || 'none',
            onStart: () => playhead.setAttribute('fill', 'red'),
            onComplete: () => playhead.setAttribute('fill', 'transparent'),
          });

          newTween.progress(progress);
          activeTweens.set(voiceId, newTween);
        }
      }
    }
  }

  return {
    element: svgElement,
    triggerPlayAnimation,
    releaseAnimation,
    // cleanup: () => activeTimeouts.forEach(clearTimeout)
  };
};

// === Ignore code comments below ===
// function refreshPlayingAnimations() {
//   for (let [voiceId, tween] of activeTweens) {
//     if (tween.isActive() && tween.vars.repeat === -1) {
//       // Query actual envelope duration directly
//       const currentDuration = initialEnvValues.durationSeconds;
//       const tweenDuration = (tween.vars.duration as number) ?? 0; // Type assertion with fallback

//       // Only update if duration actually changed
//       if (Math.abs(currentDuration - tweenDuration) > 0.001) {
//         const progress = tween.progress();
//         tween.kill();

//         const playhead = playheads.get(voiceId);
//         if (playhead) {
//           const newTween = gsap.to(playhead, {
//             duration: currentDuration, // Synced with audio
//             repeat: -1, // ? use msg.islooping ?
//             ease: currentEase || 'none',
//             motionPath: {
//               path: envelopePath,
//               align: envelopePath,
//               alignOrigin: [0.5, 0.5],
//             },
//           });
//           newTween.progress(progress);
//           activeTweens.set(voiceId, newTween);
//         }
//       }
//     }
//   }
// }

// function refreshPlayingAnimations() {
//   for (let [voiceId, tween] of activeTweens) {
//     if (tween.isActive()) {
//       const progress = tween.progress();
//       const envDuration = tween.vars.duration || 1; // or initialEnvValues.durationSeconds; <-- Dynamic? // was -> tween.vars.duration || 1;
//       const isLooping = tween.vars.repeat === -1;

//       tween.kill();

//       const playhead = playheads.get(voiceId);
//       if (playhead) {
//         const newTween = gsap.to(playhead, {
//           motionPath: {
//             path: envelopePath,
//             align: envelopePath,
//             alignOrigin: [0.5, 0.5],
//           },
//           duration: envDuration,
//           repeat: isLooping ? -1 : 0,
//           ease: currentEase || 'none',
//         });

//         // Progress needs to be set after creating tween
//         newTween.progress(progress);
//         activeTweens.set(voiceId, newTween);
//       }
//     }
//   }
// }

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
