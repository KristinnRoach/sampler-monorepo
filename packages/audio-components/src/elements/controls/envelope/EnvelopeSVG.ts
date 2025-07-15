// EnvelopeSVG.ts
import van from '@repo/vanjs-core';
import {
  CustomEnvelope,
  EnvelopePoint,
  EnvelopeType,
  SamplePlayer,
} from '@repo/audiolib';
import { gsap, MotionPathPlugin, DrawSVGPlugin, CustomEase } from 'gsap/all';

import { TimeScaleKnob, LabeledTimeScaleKnob } from './TimeScaleKnob.ts';

import {
  generateSVGPath,
  applySnapping,
  screenXToSeconds,
  screenYToValue,
  secondsToScreenX,
} from './env-utils.ts';

import { EnvToggleButtons } from './env-buttons.ts';
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
  drawWaveform: (audiobuffer: AudioBuffer) => void;
  cleanup: () => void;
}

export const EnvelopeSVG = (
  instrument: SamplePlayer,
  envType: EnvelopeType,
  width: string = '100%',
  height: string = '120px',
  snapToValues: { y?: number[]; x?: number[] } = { y: [0] },
  snapThreshold = 0.025,
  multiColorPlayheads = true
): EnvelopeSVG => {
  if (!instrument.getEnvelope(envType).points.length) {
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
      drawWaveform: () => {},
      cleanup: () => {},
    };
  }

  // Get envelope properties
  const envelopeInfo: CustomEnvelope = instrument.getEnvelope(envType);
  const envelopeType = envType;
  const [minValue, maxValue] = envelopeInfo.valueRange;

  // Value conversion helpers
  const normalizeValue = (displayValue: number): number => {
    return (displayValue - minValue) / (maxValue - minValue);
  };

  const denormalizeValue = (normalizedValue: number): number => {
    return minValue + normalizedValue * (maxValue - minValue);
  };

  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 200;

  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;
  let envelopePath: SVGPathElement;
  let waveformPath: SVGPathElement | null = null;
  let playheadManager: PlayheadManager;

  // UI states
  const enabled = van.state<boolean>(envelopeInfo.isEnabled);
  const loopEnabled = van.state<boolean>(envelopeInfo.loopEnabled);
  const syncedToPlaybackRate = van.state<boolean>(
    envelopeInfo.syncedToPlaybackRate
  );

  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);

  let clickCounts: Record<number, number> = {};
  const activeTimeouts = new Set<number>();

  const updateControlPoints = () => {
    if (!pointsGroup) return;

    activeTimeouts.forEach(clearTimeout);
    activeTimeouts.clear();

    pointsGroup.replaceChildren();

    const pts = envelopeInfo.points;

    pts.forEach((point, index) => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      circle.setAttribute(
        'cx',
        secondsToScreenX(
          point.time,
          envelopeInfo.fullDuration,
          SVG_WIDTH
        ).toString()
      );
      circle.setAttribute('cy', ((1 - point.value) * SVG_HEIGHT).toString());
      circle.setAttribute('r', '4');
      circle.setAttribute(
        'fill',
        selectedPoint.val === index
          ? '#ff6b6b'
          : envelopeInfo.isEnabled
            ? '#4ade80'
            : '#666'
      );
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.style.cursor = 'pointer';
      circle.style.zIndex = '999';

      // Special case for start/end points
      if (index === 0 || index === pts.length - 1) {
        circle.setAttribute(
          'fill',
          envelopeInfo.isEnabled ? '#ff9500' : '#666'
        ); // Orange
        circle.setAttribute('r', '6'); // Slightly bigger
      }

      if (index === envelopeInfo.sustainPointIndex) {
        circle.setAttribute(
          'fill',
          envelopeInfo.isEnabled ? '#ff2211' : '#666'
        );
        circle.setAttribute('r', '6');
      }

      // Mouse down - start drag
      // Current approach is a somewhat convoluted way to allow using single click
      // for moving a point and double click for adding a point (only one that worked)

      let clickTimeout: number;

      circle.addEventListener('mousedown', (e: MouseEvent) => {
        if (!envelopeInfo.isEnabled) return;

        if (e.altKey) {
          e.preventDefault();

          instrument.setEnvelopeSustainPoint(envType, index);

          playheadManager.refreshSustainPoint();

          updateControlPoints();

          envelopePath.setAttribute(
            'd',
            generateSVGPath(
              envelopeInfo.points,
              envelopeInfo.fullDuration,
              SVG_WIDTH,
              SVG_HEIGHT
            )
          );

          return;
        }

        const currentCount = (clickCounts[index] || 0) + 1;
        clickCounts = { ...clickCounts, [index]: currentCount };

        // First click - start drag immediately and start timer
        isDragging.val = true;
        selectedPoint.val = index;

        // Clear existing timeout
        clearTimeout(clickTimeout);

        if (currentCount === 1) {
          // 200ms time given to double click
          clickTimeout = setTimeout(() => {
            clickCounts = { ...clickCounts, [index]: 0 };
            activeTimeouts.delete(clickTimeout);
          }, 200);
          activeTimeouts.add(clickTimeout);
        } else if (currentCount === 2) {
          // Second click - delete and stop dragging
          isDragging.val = false;
          if (index > 0 && index < pts.length - 1) {
            const currentSustainIndex = envelopeInfo.sustainPointIndex;

            instrument.deleteEnvelopePoint(envelopeType, index);

            if (index === currentSustainIndex) {
              instrument.setEnvelopeSustainPoint(envType, null);
            } else if (currentSustainIndex && index < currentSustainIndex) {
              instrument.setEnvelopeSustainPoint(
                envType,
                currentSustainIndex - 1
              );
            }

            playheadManager.refreshSustainPoint();

            updateControlPoints();

            envelopePath.setAttribute(
              'd',
              generateSVGPath(
                envelopeInfo.points,
                envelopeInfo.fullDuration,
                SVG_WIDTH,
                SVG_HEIGHT
              )
            );
          }

          clickCounts = { ...clickCounts, [index]: 0 };
        }
        e.preventDefault();
      });

      pointsGroup.appendChild(circle);
    });
  };

  // Create SVG element
  svgElement = svg({
    viewBox: `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`,
    preserveAspectRatio: 'none',
    style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px;`,
  }) as SVGSVGElement;

  const controlButtons = EnvToggleButtons(
    enabled,
    loopEnabled,
    syncedToPlaybackRate
  );

  van.derive(() => {
    if (enabled.val) instrument.enableEnvelope(envelopeType);
    else if (!enabled.val) instrument.disableEnvelope(envelopeType);
  });

  van.derive(() => instrument.setEnvelopeLoop(envelopeType, loopEnabled.val));

  van.derive(() =>
    instrument.setEnvelopeSync(envelopeType, syncedToPlaybackRate.val)
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
  const timeScaleKnob = LabeledTimeScaleKnob({
    onTimeScaleChange: instrument.setEnvelopeTimeScale,
    envelopeType,
    minValue: 1, // ? make one in the middle (up position) ?
    maxValue: 20,
    defaultValue: 1,
    snapIncrement: 0.01,
    label: 'Speed',
  });

  container.appendChild(timeScaleKnob);

  // Grid
  const gridGroup = createEnvelopeGrid(SVG_WIDTH, SVG_HEIGHT);

  // Envelope path
  envelopePath = path({
    id: 'envelope-path',
    d: () => {
      //   envelope.getSVGPath(SVG_WIDTH, SVG_HEIGHT, envelope.fullDuration);
      return generateSVGPath(
        envelopeInfo.points,
        envelopeInfo.fullDuration,
        SVG_WIDTH,
        SVG_HEIGHT
      );
    },
    fill: 'none',
    stroke: () => (enabled.val ? '#4ade80' : '#666'),
    'stroke-width': 2,
  }) as SVGPathElement;

  // Control points group
  pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'control-points');

  // Animated Playheads
  playheadManager = Playheads(
    svgElement,
    envelopePath,
    envelopeInfo,
    SVG_WIDTH,
    multiColorPlayheads
  );

  playheadManager.refreshSustainPoint();

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
      stroke: () => (enabled.val ? '#3467bc' : '#333'),
      'stroke-width': 1,
      style: 'z-index: -999; pointer-events: none; ',
      'pointer-events': 'none', // SVG attribute, not CSS
    }) as SVGPathElement;

    // Insert waveform before points group
    svgElement.insertBefore(waveformPath, pointsGroup);
  }

  // EVENT HANDLERS

  const handleMouseMove = (e: MouseEvent) => {
    if (!envelopeInfo.isEnabled) return;

    if (isDragging.val && selectedPoint.val !== null) {
      const pts = envelopeInfo.points;
      const isStartPoint = selectedPoint.val === 0;
      const isEndPoint = selectedPoint.val === pts.length - 1;

      const rect = svgElement.getBoundingClientRect();

      let time = screenXToSeconds(
        e.clientX - rect.left,
        rect.width,
        envelopeInfo.fullDuration
      );
      let value = screenYToValue(e.clientY - rect.top, rect.height);
      value = applySnapping(value, snapToValues.y, snapThreshold);

      // Handle fixed start/end times
      if (isStartPoint) {
        time = 0;
      } else if (isEndPoint) {
        time = envelopeInfo.fullDuration;
      } else {
        time = applySnapping(time, snapToValues.x, snapThreshold);
      }

      instrument.updateEnvelopePoint(
        envelopeType,
        selectedPoint.val,
        time,
        value
      );
      updateControlPoints();

      // update the path:
      envelopePath.setAttribute(
        'd',
        generateSVGPath(
          envelopeInfo.points,
          envelopeInfo.fullDuration,
          SVG_WIDTH,
          SVG_HEIGHT
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (!envelopeInfo.isEnabled) return;
    isDragging.val = false;
    selectedPoint.val = null;
  };

  const handleDoubleClick = (e: MouseEvent) => {
    if (!envelopeInfo.isEnabled) return;
    e.stopPropagation(); // Prevent bubbling

    if (isDragging.val) return;
    const rect = svgElement.getBoundingClientRect();

    const time = screenXToSeconds(
      e.clientX - rect.left,
      rect.width,
      envelopeInfo.fullDuration
    );
    const value = screenYToValue(e.clientY - rect.top, rect.height);

    if (
      envelopeInfo.sustainPointIndex &&
      time < envelopeInfo.points[envelopeInfo.sustainPointIndex].time
    ) {
      instrument.setEnvelopeSustainPoint(
        envelopeType,
        envelopeInfo.sustainPointIndex + 1
      );
    }

    instrument.addEnvelopePoint(envelopeType, time, value);
    updateControlPoints();

    envelopePath.setAttribute(
      'd',
      generateSVGPath(
        envelopeInfo.points,
        envelopeInfo.fullDuration,
        SVG_WIDTH,
        SVG_HEIGHT
      )
    );
  };

  // Add event listeners
  svgElement.addEventListener('mousemove', handleMouseMove);
  svgElement.addEventListener('mouseup', handleMouseUp);
  svgElement.addEventListener('mouseleave', handleMouseUp);
  svgElement.addEventListener('dblclick', handleDoubleClick);

  // Assemble SVG
  svgElement.appendChild(gridGroup);
  svgElement.appendChild(envelopePath);
  svgElement.appendChild(pointsGroup);

  updateControlPoints();

  return {
    element: container,

    triggerPlayAnimation: (msg: AnimationMessage) =>
      playheadManager.triggerPlayAnimation(msg, envelopeType),

    releaseAnimation: (msg: AnimationMessage) =>
      playheadManager.releaseAnimation(msg),

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
