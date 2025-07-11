// EnvelopeSVG.ts
import van, { State } from '@repo/vanjs-core';
import type { EnvelopePoint, EnvelopeType } from '@repo/audiolib';
import { generateMidiNoteColors } from '../../../utils/generateColors.ts';
import { gsap, MotionPathPlugin, DrawSVGPlugin, CustomEase } from 'gsap/all';

import { TimeScaleKnob, LabeledTimeScaleKnob } from './TimeScaleKnob.ts';

import {
  generateSVGPath,
  applySnapping,
  screenToTime,
  screenToValue,
  timeToScreenX,
} from './env-utils.ts';

import { createEnvelopeControlButtons } from './env-buttons.ts';
import { createEnvelopeGrid } from './env-grid.ts';
import { getWaveformSVGData } from '../../../utils/waveform-utils.ts';

import {
  Playheads,
  type AnimationMessage,
  type PlayheadManager,
} from './env-playheads.ts';

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, CustomEase);

const { div } = van.tags;
const { svg, path } = van.tags('http://www.w3.org/2000/svg');

export interface EnvelopeSVG {
  element: Element | SVGSVGElement;
  triggerPlayAnimation: (msg: any) => void;
  releaseAnimation: (msg: any) => void;
  updateEnvelopeDuration: (seconds: number) => void;
  drawWaveform: (audiobuffer: AudioBuffer) => void;
  cleanup: () => void;
}

export const EnvelopeSVG = (
  envelopeType: EnvelopeType,
  initialPoints: EnvelopePoint[],
  maxDurationSeconds: State<number>,
  onPointUpdate: (
    envType: EnvelopeType,
    index: number,
    time: number,
    value: number
  ) => void,
  onEnable: (envType: EnvelopeType) => void,
  onDisable: (envType: EnvelopeType) => void,
  onLoopChange: (envType: EnvelopeType, enabled: boolean) => void,
  onSyncChange: (envType: EnvelopeType, enabled: boolean) => void,
  setEnvelopeTimeScale?: (envType: EnvelopeType, timeScale: number) => void,
  width: string = '100%',
  height: string = '120px',
  snapToValues: { y?: number[]; x?: number[] } = { y: [0], x: [0, 1] },
  snapThreshold = 0.025,
  enabled = true,
  initialLoopState = false,
  multiColorPlayheads = true,
  fixedStartEndTimes = true
): EnvelopeSVG => {
  if (!initialPoints.length) {
    const emptyDiv = div(
      {
        style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;`,
      },
      'No envelope data'
    );
    return {
      element: emptyDiv,
      triggerPlayAnimation: () => {},
      releaseAnimation: () => {},
      updateEnvelopeDuration: () => {},
      drawWaveform: () => {},
      cleanup: () => {},
    };
  }

  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 200;

  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;
  let envelopePath: SVGPathElement;
  let waveformPath: SVGPathElement | null = null;
  let playheadManager: PlayheadManager;

  let noteColor: string | Record<number, string>;
  if (multiColorPlayheads)
    noteColor = generateMidiNoteColors('none', [40, 90], true);
  else noteColor = 'red';

  // UI states
  const isEnabled = van.state(enabled);
  const isLooping = van.state(initialLoopState);
  const syncToPlaybackRate = van.state(false);

  const currentDurationSeconds = van.state(maxDurationSeconds.rawVal);

  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);

  const initializePoints = (inputPoints: EnvelopePoint[]): EnvelopePoint[] => {
    if (!fixedStartEndTimes) return [...inputPoints];

    const pts = [...inputPoints];
    if (pts.length >= 2) {
      // Force first point to time 0
      pts[0] = { ...pts[0], time: 0 };
      // Force last point to max duration
      pts[pts.length - 1] = {
        ...pts[pts.length - 1],
        time: maxDurationSeconds.rawVal,
      };
    }
    return pts;
  };

  const points = van.state(initializePoints(initialPoints));
  const currentEase = van.state<string | null>(null);

  let clickCounts: Record<number, number> = {};
  const activeTimeouts = new Set<number>();

  const updateControlPoints = () => {
    if (!pointsGroup) return;

    activeTimeouts.forEach(clearTimeout);
    activeTimeouts.clear();

    pointsGroup.replaceChildren();

    const pts = points.val;

    pts.forEach((point, index) => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      circle.setAttribute(
        'cx',
        timeToScreenX(
          point.time,
          maxDurationSeconds.rawVal,
          SVG_WIDTH
        ).toString()
      );
      circle.setAttribute('cy', ((1 - point.value) * SVG_HEIGHT).toString());
      circle.setAttribute('r', '4');
      circle.setAttribute(
        'fill',
        selectedPoint.val === index
          ? '#ff6b6b'
          : isEnabled.val
            ? '#4ade80'
            : '#666'
      );
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.style.cursor = 'pointer';

      // Special case for start/end points
      if (index === 0 || index === pts.length - 1) {
        if (!fixedStartEndTimes) {
          // Update duration based on time span of envelope points
          const timeSpan = pts[pts.length - 1].time - pts[0].time;
          const newDuration = timeSpan;
          if (Math.abs(currentDurationSeconds.val - newDuration) > 0.001) {
            currentDurationSeconds.val = newDuration;
          }
        }

        circle.setAttribute('fill', isEnabled.val ? '#ff9500' : '#666'); // Orange for duration handles
        circle.setAttribute('r', '6'); // Slightly bigger
      }

      // Mouse down - start drag
      // Current approach is a somewhat convoluted way to allow using single click
      // for moving a point and double click for adding a point (only one that worked)

      // const activeTimeouts = new Set<number>();
      let clickTimeout: number;

      circle.addEventListener('mousedown', (e: MouseEvent) => {
        if (!isEnabled.val) return;

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
    if (!isEnabled.val) return;

    if (isDragging.val && selectedPoint.val !== null) {
      const pts = points.val;
      const isStartPoint = selectedPoint.val === 0;
      const isEndPoint = selectedPoint.val === pts.length - 1;

      const rect = svgElement.getBoundingClientRect();

      let time = screenToTime(
        e.clientX - rect.left,
        rect.width,
        maxDurationSeconds.rawVal
      );
      let value = screenToValue(e.clientY - rect.top, rect.height);
      value = applySnapping(value, snapToValues.y, snapThreshold);

      // Handle fixed start/end times
      if (fixedStartEndTimes) {
        if (isStartPoint) time = 0;
        else if (isEndPoint) time = maxDurationSeconds.val;
      } else {
        time = applySnapping(time, snapToValues.x, snapThreshold);
      }

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
    if (!isEnabled.val) return;
    isDragging.val = false;
    selectedPoint.val = null;
  };

  const handleDoubleClick = (e: MouseEvent) => {
    if (!isEnabled.val) return;
    e.stopPropagation(); // Prevent bubbling

    if (isDragging.val) return;
    const rect = svgElement.getBoundingClientRect();

    const time = screenToTime(
      e.clientX - rect.left,
      rect.width,
      maxDurationSeconds.val
    );
    const value = screenToValue(e.clientY - rect.top, rect.height);

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

  const controlButtons = createEnvelopeControlButtons(
    isEnabled,
    isLooping,
    syncToPlaybackRate
  );

  // Create container div
  const container = div(
    {
      style: `position: relative; display: inline-block; width: ${width}; height: ${height}; `,
    },
    controlButtons.enabledToggle,
    controlButtons.loopToggle,
    controlButtons.syncToggle
  );

  // Manually append the SVG element to avoid namespace issues
  container.appendChild(svgElement);

  // Add time scale knob if callback provided
  if (setEnvelopeTimeScale !== undefined) {
    const timeScaleKnob = LabeledTimeScaleKnob({
      envelopeType,
      onTimeScaleChange: setEnvelopeTimeScale,
      minValue: 1, // ? make one in the middle (up position) ?
      maxValue: 100,
      defaultValue: 1,
      snapIncrement: 0.01,
      label: 'Speed',
    });
    container.appendChild(timeScaleKnob);
  }

  // Add event listeners
  svgElement.addEventListener('mousemove', handleMouseMove);
  svgElement.addEventListener('mouseup', handleMouseUp);
  svgElement.addEventListener('mouseleave', handleMouseUp);
  svgElement.addEventListener('dblclick', handleDoubleClick);

  // Grid
  const gridGroup = createEnvelopeGrid(SVG_WIDTH, SVG_HEIGHT);

  // Envelope path
  envelopePath = path({
    id: 'envelope-path',
    d: () => {
      maxDurationSeconds.val; // Dependency
      return generateSVGPath(
        points.val,
        maxDurationSeconds.val,
        SVG_WIDTH,
        SVG_HEIGHT
      );
    },
    fill: 'none',
    stroke: () => (isEnabled.val ? '#4ade80' : '#666'),
    'stroke-width': 2,
  }) as SVGPathElement;

  // Control points group
  pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'control-points');

  // Assemble SVG
  svgElement.appendChild(gridGroup);
  svgElement.appendChild(envelopePath);
  svgElement.appendChild(pointsGroup);

  // Animated Playheads
  playheadManager = Playheads(
    svgElement,
    envelopePath,
    isEnabled,
    currentDurationSeconds,
    currentEase,
    maxDurationSeconds,
    SVG_WIDTH,
    multiColorPlayheads
  );

  // === WAVEFORM ===

  function drawWaveform(audiobuffer: AudioBuffer) {
    // Remove previous waveform path if it exists
    if (waveformPath && waveformPath.parentNode === svgElement) {
      svgElement.removeChild(waveformPath);
      waveformPath = null;
    }

    const waveformSVGData = getWaveformSVGData(
      audiobuffer,
      SVG_WIDTH,
      SVG_HEIGHT
    );

    waveformPath = path({
      id: 'waveform-path',
      d: waveformSVGData.trim(),
      fill: 'none',
      stroke: () => (isEnabled.val ? '#3467bc' : '#333'),
      'stroke-width': 1,
    }) as SVGPathElement;

    svgElement.appendChild(waveformPath);
  }

  const updateEnvelopeDuration = (seconds: number) => {
    if (seconds !== currentDurationSeconds.val)
      currentDurationSeconds.val = seconds;
  };

  // 1. First derive: Update duration
  van.derive(() => {
    const newMaxDuration = maxDurationSeconds.val;
    currentDurationSeconds.val = newMaxDuration;
    points.val = initialPoints; //initializePoints(points.val);
  });

  // 2. Second derive: Update UI when points, selection, or duration changes
  van.derive(() => {
    points.val;
    selectedPoint.val;
    maxDurationSeconds.val;

    updateControlPoints();

    setTimeout(() => {
      playheadManager.refreshPlayingAnimations();
    }, 0);
  });

  van.derive(() => {
    onLoopChange(envelopeType, isLooping.val);
  });

  van.derive(() => {
    onSyncChange(envelopeType, syncToPlaybackRate.val);
  });

  van.derive(() => {
    if (!isEnabled.val) {
      playheadManager.hideAllPlayheads();
      onDisable(envelopeType);
    } else {
      onEnable(envelopeType);
    }
  });

  return {
    element: container,

    triggerPlayAnimation: (msg: AnimationMessage) =>
      playheadManager.triggerPlayAnimation(msg, envelopeType),

    releaseAnimation: (msg: AnimationMessage) =>
      playheadManager.releaseAnimation(msg),

    updateEnvelopeDuration,
    drawWaveform,
    cleanup: () => {
      playheadManager.cleanup();
      activeTimeouts.forEach(clearTimeout);
      if (waveformPath && waveformPath.parentNode === svgElement) {
        svgElement.removeChild(waveformPath);
      }
    },
  };
};

// // ! === ! TESTING TimeScale ! == (cleanup after!)
// if (setEnvelopeTimeScale !== undefined) {
//   defineElement('knob-element', KnobElement);
//   const knobElement: HTMLElement = document.createElement('knob-element');
//   knobElement.setAttribute('min-value', '1');
//   knobElement.setAttribute('max-value', '10'); // Todo: set the scaling (undo the 'curve' used for looppoints)
//   knobElement.setAttribute('snap-increment', '0.1');
//   knobElement.setAttribute('width', '45');
//   knobElement.setAttribute('height', '45');
//   knobElement.setAttribute('default-value', '1');
//   knobElement.style.marginTop = '10px';
//   knobElement.className = 'time-scale';

//   (knobElement as HTMLElement).addEventListener(
//     'knob-change',
//     (e: CustomEvent) => {
//       if (!knobElement) return;
//       const msg: KnobChangeEventDetail = e.detail;
//       setEnvelopeTimeScale(envelopeType, msg.value);
//     }
//   );
//   container.appendChild(knobElement);
// }
// // ! === ! END TESTING TimeScale ! == (cleanup after!)
