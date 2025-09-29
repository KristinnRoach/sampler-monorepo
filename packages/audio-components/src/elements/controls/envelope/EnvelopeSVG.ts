// EnvelopeSVG.ts
import van, { State } from '@repo/vanjs-core';
import { CustomEnvelope, EnvelopeType, SamplePlayer } from '@repo/audiolib';
import { gsap, MotionPathPlugin, DrawSVGPlugin, CustomEase } from 'gsap/all';

import { TimeScaleKnob } from './TimeScaleKnob';

import {
  applySnapping,
  screenXToSeconds,
  secondsToScreenX,
  applySnappingAbsolute,
  screenYToAbsoluteValue,
  absoluteValueToNormalized,
  generateSVGPath,
} from './env-utils';

import { EnvToggleButtons } from './env-buttons';
import { createGrid } from './env-grid';
import { getWaveformSVGData } from '../../../shared/utils/visual/waveform-utils';

import { createPlayheads, type PlayheadManager } from './env-playheads';

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, CustomEase);

const { div } = van.tags;
const { svg, path } = van.tags('http://www.w3.org/2000/svg');

export interface EnvelopeSettings {
  points: Array<{ time: number; value: number; curve?: string }>;
  sustainPointIndex?: number | null;
  releasePointIndex?: number;
  isEnabled: boolean;
  loopEnabled: boolean;
  syncedToPlaybackRate: boolean;
  timeScale?: number;
}

function applyEnvelopeStateToInstrument(
  instrument: SamplePlayer,
  envType: EnvelopeType,
  state: EnvelopeSettings
) {
  // Clear existing points first
  const currentEnv = instrument.getEnvelope(envType);
  const pointCount = currentEnv.points.length;
  for (let i = pointCount - 1; i >= 0; i--) {
    instrument.deleteEnvelopePoint(envType, i);
  }

  // Add restored points
  state.points.forEach((point, index) => {
    if (index === 0) {
      // Update first point instead of adding
      instrument.updateEnvelopePoint(envType, 0, point.time, point.value);
    } else {
      instrument.addEnvelopePoint(envType, point.time, point.value);
    }
  });

  // Apply other envelope settings
  if (state.sustainPointIndex !== undefined) {
    instrument.setEnvelopeSustainPoint(envType, state.sustainPointIndex);
  }
  if (state.releasePointIndex !== undefined) {
    instrument.setEnvelopeReleasePoint(envType, state.releasePointIndex);
  }

  // Apply boolean states
  if (state.isEnabled) {
    instrument.enableEnvelope(envType);
  } else {
    instrument.disableEnvelope(envType);
  }

  instrument.setEnvelopeLoop(envType, state.loopEnabled);
  instrument.setEnvelopeSync(envType, state.syncedToPlaybackRate);

  if (state.timeScale) {
    instrument.setEnvelopeTimeScale(envType, state.timeScale);
  }
}

export interface EnvelopeSVG {
  element: Element | SVGSVGElement;
  timeScaleKnob: HTMLElement;
  drawWaveform: (audiobuffer: AudioBuffer) => void;
  refresh: () => void; // Always updates in place, never returns a new instance
  restoreState: (settings: EnvelopeSettings) => void; // Restore envelope state after creation
  cleanup: () => void;
}

export const EnvelopeSVG = (
  instrument: SamplePlayer,
  envType: EnvelopeType,
  width: string = '100%',
  height: string = '120px',
  snapToValues: { y?: number[]; x?: number[] } = {},
  snapThreshold = 0.025,
  multiColorPlayheads = true,
  restoreSavedSettings?: EnvelopeSettings,
  bgColor?: string
): EnvelopeSVG => {
  // If saved state is provided, apply it to the instrument BEFORE getting envelope info
  if (restoreSavedSettings) {
    applyEnvelopeStateToInstrument(instrument, envType, restoreSavedSettings);
  }

  let envelopeInfo: CustomEnvelope = instrument.getEnvelope(envType);
  const envelopeType = envType;

  // If no points, return a simple placeholder that can be refreshed later
  if (!envelopeInfo.points.length) {
    const emptyContainer = div(
      {
        style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;`,
      },
      'Record or load a sample to start'
    );

    const result: EnvelopeSVG = {
      element: emptyContainer,
      timeScaleKnob: emptyContainer,
      drawWaveform: () => {},
      refresh: () => {
        envelopeInfo = instrument.getEnvelope(envType);
      },
      restoreState: (settings: EnvelopeSettings) => {
        // Apply settings and refresh - this will trigger envelope creation if needed
        applyEnvelopeStateToInstrument(instrument, envType, settings);
      },
      cleanup: () => {},
    };
    return result;
  }

  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 200;
  const CIRCLE_PADDING = 8;
  const TOP_BTNS_PADDING = 16;

  const paddedWidth = SVG_WIDTH - 2 * CIRCLE_PADDING;
  const paddedHeight = SVG_HEIGHT - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING;
  
  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;
  let envelopePath: SVGPathElement;
  let waveformPath: SVGPathElement | null = null;

  // UI states
  const enabled = van.state<boolean>(envelopeInfo.isEnabled);
  const envLoopEnabled = van.state<boolean>(envelopeInfo.loopEnabled);
  const syncedToPlaybackRate = van.state<boolean>(
    envelopeInfo.syncedToPlaybackRate
  );

  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);

  const loopEnabled = van.state(instrument.loopEnabled);

  const sampleStartSeconds = van.state(instrument.getStartPoint());
  const sampleEndSeconds = van.state(instrument.getEndPoint());
  const loopStartSeconds = van.state(instrument.loopStart);
  const loopEndSeconds = van.state(instrument.loopEnd);

  const indicatorSecToXpos = (seconds: number) => {
    return (
      secondsToScreenX(seconds, envelopeInfo.baseDuration, paddedWidth) +
      CIRCLE_PADDING
    );
  };

  const startXpos = van.state(indicatorSecToXpos(sampleStartSeconds.val));
  const endXpos = van.state(indicatorSecToXpos(sampleEndSeconds.val));
  const loopStartXpos = van.state(indicatorSecToXpos(loopStartSeconds.val));
  const loopEndXpos = van.state(indicatorSecToXpos(envelopeInfo.baseDuration));

  // Click handling
  interface PointInteractionState {
    dragThreshold: number;
    clickStartTime: number;
    clickStartPos: { x: number; y: number };
    hasMoved: boolean;
    doubleClickTimer: number | null;
  }

  const pointStates = new Map<number, PointInteractionState>();
  const DRAG_THRESHOLD = 3; // pixels
  const DOUBLE_CLICK_DELAY = 300; // ms

  // Helper to get coordinates from mouse or touch event
  const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  };

  const handlePointMouseDown = (e: MouseEvent | TouchEvent, index: number) => {
    if (!envelopeInfo.isEnabled) return;

    e.preventDefault();

    // Handle modifier key shortcuts (only for mouse events)
    if ('altKey' in e && e.altKey) {
      if (index === envelopeInfo.sustainPointIndex) {
        instrument.setEnvelopeSustainPoint(envType, null);
      } else {
        instrument.setEnvelopeSustainPoint(envType, index);
      }
      updateControlPoints();
      updateEnvelopePath();
      return;
    }

    if ('metaKey' in e && (e.metaKey || e.ctrlKey)) {
      if (
        index === envelopeInfo.releasePointIndex &&
        envelopeInfo.sustainPointIndex
      ) {
        instrument.setEnvelopeReleasePoint(
          envType,
          envelopeInfo.sustainPointIndex
        );
      } else {
        instrument.setEnvelopeReleasePoint(envType, index);
      }
      updateControlPoints();
      updateEnvelopePath();
      return;
    }

    // Initialize or get point state
    const state: PointInteractionState = pointStates.get(index) || {
      dragThreshold: DRAG_THRESHOLD,
      clickStartTime: 0,
      clickStartPos: { x: 0, y: 0 },
      hasMoved: false,
      doubleClickTimer: null,
    };

    const now = Date.now();
    const isDoubleClick =
      state.doubleClickTimer !== null &&
      now - state.clickStartTime < DOUBLE_CLICK_DELAY;

    if (isDoubleClick) {
      // Handle double click - delete point
      if (state.doubleClickTimer) {
        clearTimeout(state.doubleClickTimer);
        state.doubleClickTimer = null;
      }

      if (index > 0 && index < envelopeInfo.points.length - 1) {
        const currentSustainIndex = envelopeInfo.sustainPointIndex;
        const currentReleaseIndex = envelopeInfo.releasePointIndex;

        instrument.deleteEnvelopePoint(envelopeType, index);

        // Adjust sustain point index if needed
        if (index === currentSustainIndex) {
          instrument.setEnvelopeSustainPoint(envType, null);
        } else if (currentSustainIndex && index < currentSustainIndex) {
          instrument.setEnvelopeSustainPoint(envType, currentSustainIndex - 1);
        }

        // Adjust release point index if needed
        if (currentReleaseIndex && index < currentReleaseIndex) {
          instrument.setEnvelopeReleasePoint(envType, currentReleaseIndex - 1);
        }

        updateControlPoints();
        updateEnvelopePath();
      }

      pointStates.delete(index);
      return;
    }

    // Single click - prepare for potential drag
    const coords = getEventCoordinates(e);
    state.clickStartTime = now;
    state.clickStartPos = coords;
    state.hasMoved = false;

    // Set up double click detection
    state.doubleClickTimer = setTimeout(() => {
      // This was a single click, start dragging if we haven't moved much
      if (!state.hasMoved) {
        isDragging.val = true;
        selectedPoint.val = index;
      }
      state.doubleClickTimer = null;
    }, DOUBLE_CLICK_DELAY);

    pointStates.set(index, state);

    // Add global mouse/touch listeners for this interaction
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const state = pointStates.get(index);
      if (!state) return;

      const coords = getEventCoordinates(e);
      const deltaX = Math.abs(coords.x - state.clickStartPos.x);
      const deltaY = Math.abs(coords.y - state.clickStartPos.y);

      if (
        !state.hasMoved &&
        (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)
      ) {
        state.hasMoved = true;

        // If we haven't started dragging yet, start now
        if (!isDragging.val) {
          isDragging.val = true;
          selectedPoint.val = index;

          // Cancel double click timer since we're dragging
          if (state.doubleClickTimer) {
            clearTimeout(state.doubleClickTimer);
            state.doubleClickTimer = null;
          }
        }
      }
    };

    const handleGlobalEnd = () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);

      const state = pointStates.get(index);
      if (state && !state.hasMoved && state.doubleClickTimer === null) {
        // Clean single click without drag
        pointStates.delete(index);
      }
    };

    // Add both mouse and touch listeners
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    // Use passive: false for touchmove since we might need preventDefault for dragging
    document.addEventListener('touchmove', handleGlobalMove, {
      passive: false,
    });
    document.addEventListener('touchend', handleGlobalEnd);
  };

  function updateControlPoints() {
    if (!pointsGroup) return;

    // Refresh envelope info before updating
    envelopeInfo = instrument.getEnvelope(envType);

    // Only remove circle elements (control points), not all children
    const circles = pointsGroup.querySelectorAll('circle');
    circles.forEach((circle) => circle.remove());

    const pts = envelopeInfo.points;

    pts.forEach((point, index) => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      circle.setAttribute(
        'cx',
        (
          secondsToScreenX(
            point.time,
            envelopeInfo.baseDuration,
            SVG_WIDTH - 2 * CIRCLE_PADDING
          ) + CIRCLE_PADDING
        ).toString()
      );

      // Convert absolute value to normalized for Y positioning (use absolute point.value everywhere else)
      const normalizedValue = absoluteValueToNormalized(
        point.value,
        envelopeInfo.envPointValueRange
      );

      circle.setAttribute(
        'cy',
        (
          (1 - normalizedValue) *
            (SVG_HEIGHT - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING) +
          CIRCLE_PADDING +
          TOP_BTNS_PADDING
        ).toString()
      );

      circle.setAttribute('r', '4');

      // Default color
      let fillColor =
        selectedPoint.val === index
          ? '#ff6b6b'
          : envelopeInfo.isEnabled
            ? '#4ade80'
            : '#666';

      if (index === envelopeInfo.sustainPointIndex) {
        circle.setAttribute(
          'fill',
          envelopeInfo.isEnabled ? '#ff2211' : '#666'
        );
        circle.setAttribute('r', '6');
      }

      // Sustain point (red)
      if (index === envelopeInfo.sustainPointIndex) {
        fillColor = envelopeInfo.isEnabled ? '#ff2211' : '#666';
        circle.setAttribute('r', '6');
      }

      // Release point (blue)
      if (index === envelopeInfo.releasePointIndex) {
        fillColor = envelopeInfo.isEnabled ? '#2196f3' : '#666';
        circle.setAttribute('r', '6');
      }

      // Same point (purple)
      if (
        index === envelopeInfo.sustainPointIndex &&
        index === envelopeInfo.releasePointIndex
      ) {
        fillColor = envelopeInfo.isEnabled ? '#9c27b0' : '#666';
      }

      circle.setAttribute('fill', fillColor);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.style.cursor = 'pointer';
      circle.style.zIndex = '999';

      // Attach optimized click/touch handler
      circle.addEventListener('mousedown', (e: MouseEvent) => {
        handlePointMouseDown(e, index);
      });
      // Use passive: false since we call preventDefault in the handler
      circle.addEventListener(
        'touchstart',
        (e: TouchEvent) => {
          handlePointMouseDown(e, index);
        },
        { passive: false }
      );

      pointsGroup.appendChild(circle);
    });
  }

  // Create SVG element
  svgElement = svg({
    viewBox: `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`,
    preserveAspectRatio: 'none',
    style: `width: ${width}; height: ${height}; background-color: transparent; border: 1px solid #444; border-radius: 4px; overflow: visible; `,
  }) as SVGSVGElement;

  const controlButtons = EnvToggleButtons(
    enabled,
    envLoopEnabled,
    syncedToPlaybackRate
  );

  // Add time scale knob if callback provided
  const timeScaleKnob = TimeScaleKnob({
    label: 'Env Speed',
    onChange: ({ envelopeType, timeScale }) =>
      instrument.setEnvelopeTimeScale(envelopeType, timeScale),
    envelopeType,
    height: 25,
    width: 25,
  });

  // Create container div with control buttons and timescale knob at the top
  const container = div(
    {
      style: `position: relative; width: ${width}; height: ${height};`,
    },
    // Timescale knob positioned to the left of control buttons
    div(
      {
        style: 'position: absolute; top: 4px; right: 65px; z-index: 10;',
      },
      timeScaleKnob
    ),
    // Control buttons keep their absolute positioning
    controlButtons.enabledToggle,
    controlButtons.loopToggle,
    controlButtons.syncToggle
  );

  // Minimal tooltip element
  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.background = 'rgba(30,30,30,0.85)';
  tooltip.style.color = '#eee';
  tooltip.style.padding = '2px 8px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.zIndex = '9999';
  tooltip.style.display = 'none';

  // Grid
  const gridHeight = SVG_HEIGHT - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING;
  const offsetY = CIRCLE_PADDING + TOP_BTNS_PADDING;

  const gridGroup = createGrid(SVG_WIDTH - 2 * CIRCLE_PADDING, gridHeight, {
    offsetX: CIRCLE_PADDING,
    offsetY: offsetY,
  });

  // Envelope path
  function updateEnvelopePath() {
    envelopeInfo = instrument.getEnvelope(envType);

    envelopePath.setAttribute(
      'd',
      generateSVGPath(
        envelopeInfo.points,
        envelopeInfo.baseDuration,
        SVG_WIDTH - 2 * CIRCLE_PADDING,
        SVG_HEIGHT - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING,
        envelopeInfo.envPointValueRange,
        'linear',
        CIRCLE_PADDING,
        CIRCLE_PADDING + TOP_BTNS_PADDING
      )
    );
  }

  envelopePath = path({
    id: 'envelope-path',
    fill: 'none',
    stroke: () => (enabled.val ? '#4ade80' : '#666'),
    'stroke-width': 2,
  }) as SVGPathElement;

  updateEnvelopePath();

  // Control points group
  pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'control-points');

  // Animated Playheads
  const playheadManager: PlayheadManager = createPlayheads(
    svgElement,
    pointsGroup,
    envelopeInfo,
    instrument,
    envelopeType,
    SVG_WIDTH,
    SVG_HEIGHT
  );

  // === WAVEFORM ===

  function drawWaveform(audiobuffer: AudioBuffer) {
    if (waveformPath && waveformPath.parentNode === svgElement) {
      svgElement.removeChild(waveformPath);
      waveformPath = null;
    }

    const offsetX = CIRCLE_PADDING;
    const offsetY = CIRCLE_PADDING + TOP_BTNS_PADDING;

    const waveformSVGData = getWaveformSVGData(
      audiobuffer,
      paddedWidth,
      paddedHeight,
      offsetY
    );

    waveformPath = path({
      id: 'waveform-path',
      d: waveformSVGData.trim(),
      fill: 'none',
      stroke: () =>
        enabled.val ? 'rgba(52, 103, 188, 0.8)' : 'rgba(51, 51, 51, 0.8)',
      'stroke-width': 1,
      style: `z-index: -999; pointer-events: none;`,
      'pointer-events': 'none',
      transform: `translate(${offsetX},0)`,
    }) as SVGPathElement;

    // Insert waveform after grid but before envelope path
    svgElement.insertBefore(waveformPath, envelopePath);

    gsap.from(waveformPath, {
      duration: 0.5,
      drawSVG: 0,
      ease: 'none',
    });
  }

  // === LOOP START/END INDICATORS ===

  let sampleStartLine: SVGLineElement | null = null;
  let sampleEndLine: SVGLineElement | null = null;
  let loopStartLine: SVGLineElement | null = null;
  let loopEndLine: SVGLineElement | null = null;

  const sampleStartColor = 'rgba(200, 50, 0, 0.6)';
  const sampleEndColor = 'rgba(200, 50, 0, 0.6)';
  const loopStartColor = '#6699dd';
  const loopEndColor = '#6699dd';
  const loopDisabledColor = '#666';

  function updateLoopIndicators() {
    // Update loop start line
    if (
      loopStartXpos.val >= CIRCLE_PADDING &&
      loopStartXpos.val <= SVG_WIDTH - CIRCLE_PADDING
    ) {
      loopStartLine!.setAttribute('x1', loopStartXpos.val.toString());
      loopStartLine!.setAttribute('x2', loopStartXpos.val.toString());
      loopStartLine!.style.display = 'block';
    } else {
      loopStartLine!.style.display = 'none';
      console.log('Loop start line out of bounds');
    }

    // Update loop end line
    if (
      loopEndXpos.val >= CIRCLE_PADDING &&
      loopEndXpos.val <= SVG_WIDTH - CIRCLE_PADDING
    ) {
      loopEndLine!.setAttribute('x1', loopEndXpos.val.toString());
      loopEndLine!.setAttribute('x2', loopEndXpos.val.toString());
      loopEndLine!.style.display = 'block';
    } else {
      loopEndLine!.style.display = 'none';
      console.log('Loop end line out of bounds');
    }
  }

  function updateSampleIndicators() {
    if (sampleStartLine && sampleEndLine) {
      sampleStartLine.setAttribute('x1', startXpos.val.toString());
      sampleStartLine.setAttribute('x2', startXpos.val.toString());

      sampleEndLine.setAttribute('x1', endXpos.val.toString());
      sampleEndLine.setAttribute('x2', endXpos.val.toString());
    }
  }

  function updateLoopIndicatorsEnabled() {
    if (loopEnabled.val) {
      loopStartLine!.setAttribute('stroke', loopStartColor);
      loopEndLine!.setAttribute('stroke', loopEndColor);
    } else {
      loopStartLine!.setAttribute('stroke', loopDisabledColor);
      loopEndLine!.setAttribute('stroke', loopDisabledColor);
    }
  }

  const createSimpleIndicator = (color: string = '#ff0000'): SVGLineElement => {
    const lineElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
    lineElement.setAttribute(
      'y1',
      (CIRCLE_PADDING + TOP_BTNS_PADDING).toString()
    );
    lineElement.setAttribute('y2', (SVG_HEIGHT - CIRCLE_PADDING).toString());
    lineElement.setAttribute('stroke', color);
    lineElement.setAttribute('stroke-width', '2');
    lineElement.setAttribute('x1', CIRCLE_PADDING.toString());
    lineElement.setAttribute('x2', CIRCLE_PADDING.toString());
    lineElement.style.cursor = 'ew-resize';
    lineElement.style.pointerEvents = 'auto';

    return lineElement;
  };

  const makeIndicatorDraggable = (
    line: SVGLineElement,
    label: 'loop-start' | 'loop-end' | 'start' | 'end'
  ): (() => void) => {
    let isDragging = false;

    const labelText = {
      'loop-start': 'Loop Start',
      'loop-end': 'Loop End',
      start: 'Sample Start',
      end: 'Sample End',
    }[label];

    const showTooltip = () => {
      tooltip.textContent = labelText;
      tooltip.style.display = 'block';
      const vb = svgElement.viewBox.baseVal;
      const rect = svgElement.getBoundingClientRect();
      const x1 = Number(line.getAttribute('x1') || 0);
      const y1 = Number(line.getAttribute('y1') || 0);
      const pxX = ((x1 - vb.x) / vb.width) * rect.width - 30;
      const pxY = ((y1 - vb.y) / vb.height) * rect.height;
      tooltip.style.left = `${pxX}px`;
      tooltip.style.top = `${pxY - 20}px`;
    };

    const hideTooltip = () => {
      tooltip.style.display = 'none';
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      e.preventDefault();
      e.stopPropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      showTooltip();
      const rect = svgElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clampedX = Math.max(
        CIRCLE_PADDING,
        Math.min(x, SVG_WIDTH - CIRCLE_PADDING)
      );
      line.setAttribute('x1', clampedX.toString());
      line.setAttribute('x2', clampedX.toString());
      const seconds = screenXToSeconds(
        clampedX - CIRCLE_PADDING,
        paddedWidth,
        envelopeInfo.baseDuration
      );
      if (label === 'loop-start') {
        instrument.setLoopStart(seconds);
      } else if (label === 'loop-end') {
        instrument.setLoopEnd(seconds);
      } else if (label === 'start') {
        instrument.setSampleStartPoint(seconds);
      } else if (label === 'end') {
        instrument.setSampleEndPoint(seconds);
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      hideTooltip();
    };

    line.addEventListener('mouseover', showTooltip);
    line.addEventListener('mouseout', hideTooltip);
    line.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Return disposer function
    return () => {
      line.removeEventListener('mouseover', showTooltip);
      line.removeEventListener('mouseout', hideTooltip);
      line.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  };
  // Create and setup

  sampleStartLine = createSimpleIndicator(sampleStartColor);
  sampleEndLine = createSimpleIndicator(sampleEndColor);
  loopStartLine = createSimpleIndicator(loopStartColor);
  loopEndLine = createSimpleIndicator(loopEndColor);

  // Capture disposer functions for each indicator
  const indicatorDisposers: (() => void)[] = [];
  indicatorDisposers.push(makeIndicatorDraggable(loopStartLine, 'loop-start'));
  indicatorDisposers.push(makeIndicatorDraggable(loopEndLine, 'loop-end'));
  indicatorDisposers.push(makeIndicatorDraggable(sampleStartLine, 'start'));
  indicatorDisposers.push(makeIndicatorDraggable(sampleEndLine, 'end'));

  const loopPointsMessageCleanup = instrument.onMessage(
    'loop-points:updated',
    (msg: any) => {
      loopStartSeconds.val = msg.loopStart;
      loopEndSeconds.val = msg.loopEnd;
    }
  );

  // Add loop region background
  let loopRegionRect: SVGRectElement | null = null;

  // Create the background rectangle
  loopRegionRect = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'rect'
  );
  loopRegionRect.setAttribute(
    'y',
    (CIRCLE_PADDING + TOP_BTNS_PADDING).toString()
  );
  loopRegionRect.setAttribute(
    'height',
    (SVG_HEIGHT - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING).toString()
  );
  loopRegionRect.setAttribute('fill', 'rgba(255, 255, 255, 0.05)'); // Subtle bright overlay
  loopRegionRect.style.pointerEvents = 'none';

  // Update loop region function
  function updateLoopRegion() {
    if (loopRegionRect && loopEnabled.val) {
      const startX = Math.min(loopStartXpos.val, loopEndXpos.val);
      const endX = Math.max(loopStartXpos.val, loopEndXpos.val);
      const width = endX - startX;

      loopRegionRect.setAttribute('x', startX.toString());
      loopRegionRect.setAttribute('width', width.toString());
      loopRegionRect.style.display = width > 0 ? 'block' : 'none';
    } else if (loopRegionRect) {
      loopRegionRect.style.display = 'none';
    }
  }

  updateLoopIndicators();

  van.derive(() => {
    loopStartXpos.val = indicatorSecToXpos(loopStartSeconds.val);
    updateLoopIndicators();
    updateLoopRegion();
  });

  van.derive(() => {
    loopEndXpos.val = indicatorSecToXpos(loopEndSeconds.val);
    updateLoopIndicators();
    updateLoopRegion();
  });

  van.derive(() => {
    startXpos.val = indicatorSecToXpos(sampleStartSeconds.val);
    updateSampleIndicators();
    updateLoopRegion();
  });

  van.derive(() => {
    endXpos.val = indicatorSecToXpos(sampleEndSeconds.val);
    updateSampleIndicators();
  });

  // === EVENT HANDLERS ===

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!envelopeInfo.isEnabled) return;

    if (isDragging.val && selectedPoint.val !== null) {
      // Prevent default touch behavior during drag
      if ('touches' in e) {
        e.preventDefault();
      }
      const pts = envelopeInfo.points;
      const isStartPoint = selectedPoint.val === 0;
      const isEndPoint = selectedPoint.val === pts.length - 1;

      const rect = svgElement.getBoundingClientRect();
      const coords = getEventCoordinates(e);

      let time = screenXToSeconds(
        coords.x - rect.left - CIRCLE_PADDING,
        rect.width - 2 * CIRCLE_PADDING,
        envelopeInfo.baseDuration
      );

      let value = screenYToAbsoluteValue(
        coords.y - rect.top - CIRCLE_PADDING - TOP_BTNS_PADDING,
        rect.height - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING,
        envelopeInfo.envPointValueRange
      );

      value = applySnappingAbsolute(
        value,
        snapToValues.y,
        snapThreshold,
        envelopeInfo.envPointValueRange
      );

      // Handle fixed start/end times
      if (isStartPoint) {
        time = 0;
      } else if (isEndPoint) {
        time = envelopeInfo.baseDuration;
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
      updateEnvelopePath();
    }
  };

  const handleMouseUp = () => {
    if (!envelopeInfo.isEnabled) return;
    isDragging.val = false;
    selectedPoint.val = null;
    updateControlPoints();
  };

  const handleMouseLeave = () => {
    if (!envelopeInfo.isEnabled) return;
    isDragging.val = false;
    selectedPoint.val = null;
    updateControlPoints();
  };

  // Track last tap for double tap detection
  let lastTapTime = 0;
  let lastTapPos = { x: 0, y: 0 };
  const DOUBLE_TAP_DELAY = 300;
  const DOUBLE_TAP_THRESHOLD = 30;

  const handleDoubleClick = (e: MouseEvent | TouchEvent) => {
    if (!envelopeInfo.isEnabled) return;
    e.stopPropagation(); // Prevent bubbling
    e.preventDefault();

    if (isDragging.val) return;
    const rect = svgElement.getBoundingClientRect();
    const coords = getEventCoordinates(e);

    let time = screenXToSeconds(
      coords.x - rect.left - CIRCLE_PADDING,
      rect.width - 2 * CIRCLE_PADDING,
      envelopeInfo.baseDuration
    );

    let value = screenYToAbsoluteValue(
      coords.y - rect.top - CIRCLE_PADDING - TOP_BTNS_PADDING,
      rect.height - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING,
      envelopeInfo.envPointValueRange
    );

    // Apply snapping for consistency with drag behavior
    value = applySnappingAbsolute(
      value,
      snapToValues.y,
      snapThreshold,
      envelopeInfo.envPointValueRange
    );

    time = applySnapping(time, snapToValues.x, snapThreshold);

    instrument.addEnvelopePoint(envelopeType, time, value);
    updateControlPoints();
    updateEnvelopePath();
  };

  // Handle touch events for double tap
  const handleTouchStart = (e: TouchEvent) => {
    if (!envelopeInfo.isEnabled) return;

    const coords = getEventCoordinates(e);
    const now = Date.now();

    // Check if this is a double tap
    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
      const deltaX = Math.abs(coords.x - lastTapPos.x);
      const deltaY = Math.abs(coords.y - lastTapPos.y);

      if (deltaX < DOUBLE_TAP_THRESHOLD && deltaY < DOUBLE_TAP_THRESHOLD) {
        // This is a double tap - add a point
        handleDoubleClick(e);
        lastTapTime = 0; // Reset to prevent triple tap
        return;
      }
    }

    lastTapTime = now;
    lastTapPos = coords;
  };

  // Add event listeners for both mouse and touch
  svgElement.addEventListener('mousemove', handleMouseMove);
  svgElement.addEventListener('mouseup', handleMouseUp);
  svgElement.addEventListener('mouseleave', handleMouseLeave);
  svgElement.addEventListener('dblclick', handleDoubleClick);

  // Touch events - use passive: false where we need preventDefault
  svgElement.addEventListener('touchmove', handleMouseMove, { passive: false });
  svgElement.addEventListener('touchend', handleMouseUp);
  svgElement.addEventListener('touchstart', handleTouchStart, {
    passive: false,
  });

  // Assemble SVG
  container.appendChild(svgElement);
  container.appendChild(tooltip);

  svgElement.appendChild(gridGroup);
  svgElement.appendChild(loopRegionRect);
  svgElement.appendChild(loopStartLine);
  svgElement.appendChild(loopEndLine);
  svgElement.appendChild(sampleStartLine);
  svgElement.appendChild(sampleEndLine);
  svgElement.appendChild(envelopePath);
  svgElement.appendChild(pointsGroup);

  const animateIntro = () => {
    let tl = gsap.timeline();
    tl.from(
      gridGroup.children,
      {
        duration: 0.25,
        drawSVG: 0,
        ease: 'none',
        stagger: 0.1,
      },
      0.1
    )
      .from(
        envelopePath,
        {
          duration: 0.25,
          drawSVG: 0,
          ease: 'none',
        },
        0.2
      )
      .from(
        pointsGroup,
        {
          opacity: 0,
          duration: 0.25,
          ease: 'none',
        },
        '-=0.2'
      );
  };

  animateIntro();

  // Refresh function to update envelope display when data changes
  const refresh = () => {
    envelopeInfo = instrument.getEnvelope(envType);

    enabled.val = envelopeInfo.isEnabled;
    envLoopEnabled.val = envelopeInfo.loopEnabled;
    syncedToPlaybackRate.val = envelopeInfo.syncedToPlaybackRate;

    updateControlPoints();
    updateEnvelopePath();
    // updateLoopIndicators();
    // updateLoopIndicatorsEnabled();
    // updateLoopRegion();
    // animateIntro();
  };

  // === LISTENERS ===

  // Listen for envelope created/updated messages
  const envelopeMessageCleanup = instrument.onMessage(
    `${envType}:created`,
    () => {
      refresh();
    }
  );

  // Listen for sample loaded to redraw waveform
  const sampleLoadedCleanup = instrument.onMessage('sample:loaded', () => {
    if (instrument.audiobuffer) {
      drawWaveform(instrument.audiobuffer);
    }
    loopStartSeconds.val = instrument.loopStart;
    loopEndSeconds.val = instrument.loopEnd;

    // Update background color to the proper envelope background
    svgElement.style.backgroundColor = bgColor || '#1a1a1a';

    refresh();
  });

  // Listen for start/end point updates
  const startPointMessageCleanup = instrument.onMessage(
    'start-point:updated',
    (msg: any) => (sampleStartSeconds.val = msg.startPoint)
  );

  const endPointMessageCleanup = instrument.onMessage(
    'end-point:updated',
    (msg: any) => (sampleEndSeconds.val = msg.endPoint)
  );

  let momentarySustainForLoop = false;

  const loopEnabledMessageCleanup = instrument.onMessage(
    'loop:enabled',
    (msg: any) => {
      loopEnabled.val = msg.enabled;

      if (envType === 'amp-env') {
        if (msg.enabled && !envelopeInfo.sustainEnabled) {
          momentarySustainForLoop = true;

          // TODO: Use last-used sustainPoint index.
          // Temp safe solution for now:
          const env = instrument.getEnvelope(envType);
          const numPoints = env.points.length;
          const sustainIdx = env.sustainPointIndex ?? numPoints - 2; // Default to second-to-last point

          instrument.setEnvelopeSustainPoint(envType, sustainIdx);
          updateControlPoints();
          updateEnvelopePath();
        } else if (!msg.enabled && momentarySustainForLoop) {
          momentarySustainForLoop = false;
          instrument.setEnvelopeSustainPoint(envType, null);
          updateControlPoints();
          updateEnvelopePath();
        }
      }
    }
  );

  van.derive(() => {
    loopEnabled.val;
    updateLoopIndicatorsEnabled();
  });

  const cleanupListeners = () => {
    // ? is this not already automatically handled by audiolib's Messages?
    envelopeMessageCleanup();
    sampleLoadedCleanup();
    startPointMessageCleanup();
    endPointMessageCleanup();
    loopPointsMessageCleanup();
    loopEnabledMessageCleanup();
  };

  // === DERIVED STATES ===

  van.derive(() => {
    if (enabled.val) {
      instrument.enableEnvelope(envelopeType);
    } else {
      instrument.disableEnvelope(envelopeType);
    }
    updateControlPoints();
    updateEnvelopePath();
  });

  van.derive(() =>
    instrument.setEnvelopeLoop(envelopeType, envLoopEnabled.val)
  );

  van.derive(() =>
    instrument.setEnvelopeSync(envelopeType, syncedToPlaybackRate.val)
  );

  return {
    element: container,
    timeScaleKnob,
    drawWaveform,
    refresh,
    restoreState: (settings: EnvelopeSettings) => {
      applyEnvelopeStateToInstrument(instrument, envType, settings);
      refresh(); // Update the UI to reflect the restored state
    },
    cleanup: () => {
      cleanupListeners();
      playheadManager.cleanup();
      pointStates.forEach((state) => {
        if (state.doubleClickTimer) {
          clearTimeout(state.doubleClickTimer);
        }
      });
      pointStates.clear();
      // Dispose indicator event listeners
      indicatorDisposers.forEach((dispose) => dispose());
      // Remove SVG elements
      if (waveformPath && waveformPath.parentNode === svgElement) {
        svgElement.removeChild(waveformPath);
      }
      if (loopStartLine && loopStartLine.parentNode === svgElement) {
        svgElement.removeChild(loopStartLine);
      }
      if (loopEndLine && loopEndLine.parentNode === svgElement) {
        svgElement.removeChild(loopEndLine);
      }
      if (sampleStartLine && sampleStartLine.parentNode === svgElement) {
        svgElement.removeChild(sampleStartLine);
      }
      if (sampleEndLine && sampleEndLine.parentNode === svgElement) {
        svgElement.removeChild(sampleEndLine);
      }
      if (loopRegionRect && loopRegionRect.parentNode === svgElement) {
        svgElement.removeChild(loopRegionRect);
      }
    },
  };
};
