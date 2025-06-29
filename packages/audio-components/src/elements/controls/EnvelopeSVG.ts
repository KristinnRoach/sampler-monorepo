// EnvelopeSVG.ts
import van from '@repo/vanjs-core';
import type { EnvelopePoint, EnvelopeData, EnvelopeType } from '@repo/audiolib';
// import { gsap } from 'gsap/gsap-core';
import { gsap, MotionPathPlugin, DrawSVGPlugin } from 'gsap/all';

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin);

const { svg, path, line, g, div, circle } = van.tags(
  'http://www.w3.org/2000/svg'
);

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

let svgElement: SVGSVGElement;
let pointsGroup: SVGGElement;
let envelopePath: SVGPathElement;

let playDuration = 0;
const updatePlayDuration = (startPoint: number, endPoint: number) => {
  playDuration = endPoint * 100 - startPoint * 100;
};

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
) => {
  if (!initialEnvValues || !initialEnvValues.points.length) {
    return div(
      {
        style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;`,
      },
      'No envelope data'
    );
  }

  // UI states
  const envType = van.state<EnvelopeType>(envelopeType);
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

        updatePlayDuration(pts[0].time, pts[1].time);
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
            onPointUpdate(envType.val, index, -1, -1);
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
      onPointUpdate(envType.val, selectedPoint.val, time, value);
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
    onPointUpdate(envType.val, -1, time, value);

    updatePlayDuration(newPoints[0].time, newPoints[1].time);
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
  });

  // Update points when prop changes
  van.derive(() => {
    points.val = initialEnvValues.points;
    updatePlayDuration(
      initialEnvValues.points[0].time,
      initialEnvValues.points[1].time
    );

    // playhead.setAttribute('x', initialEnvValues.points[0].time.toString());
    // playhead.setAttribute('y', initialEnvValues.points[0].value.toString());
  });

  return svgElement;
};

let activeTweens: Map<number, gsap.core.Tween> = new Map();
let playheads: Map<number, Element> = new Map();

export function triggerPlayAnimation(msg: any, sampleDuration: number) {
  if (activeTweens.has(msg.voiceId)) {
    const existing = activeTweens.get(msg.voiceId);
    existing && existing.isActive() && existing.kill();
    activeTweens.delete(msg.voiceId);
  }

  const playhead = createPlayhead(msg.voiceId);
  svgElement.appendChild(playhead);

  // todo: send msg from env with actual env duration
  // todo: handle looping!
  const duration = sampleDuration;

  console.warn(sampleDuration);

  const newTween = gsap.to(playhead, {
    id: msg.voiceId,
    motionPath: {
      path: envelopePath,
      align: envelopePath,
      alignOrigin: [0.5, 0.5],
      autoRotate: true,
    },
    transformOrigin: '50% 50%',
    duration: duration, // playDuration,
    ease: 'none',
    onStart: () => playhead.setAttribute('fill', 'red'),
    onComplete: () => playhead.setAttribute('fill', 'transparent'),
  });

  playheads.set(msg.voiceId, playhead);
  activeTweens.set(msg.voiceId, newTween);
}

export function releaseAnimation(msg: any) {
  if (activeTweens.has(msg.voiceId)) {
    const existing = activeTweens.get(msg.voiceId);
    existing && existing.isActive() && existing.kill();
    activeTweens.delete(msg.voiceId);
  }

  if (playheads.has(msg.voiceId)) {
    const head = playheads.get(msg.voiceId);
    head && svgElement.removeChild(head);
    playheads.delete(msg.voiceId);
  }
}
