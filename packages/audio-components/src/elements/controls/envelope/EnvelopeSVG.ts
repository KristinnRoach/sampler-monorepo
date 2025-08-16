// EnvelopeSVG.ts
import van from '@repo/vanjs-core';
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
  linearToLogarithmic,
} from './env-utils';

import { EnvToggleButtons } from './env-buttons';
import { createEnvelopeGrid } from './env-grid';
import { getWaveformSVGData } from '../../../shared/utils/visual/waveform-utils';

import { createPlayheads, type PlayheadManager } from './env-playheads';

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, CustomEase);

const { div } = van.tags;
const { svg, path } = van.tags('http://www.w3.org/2000/svg');

export interface EnvelopeSVG {
  element: Element | SVGSVGElement;
  timeScaleKnob: HTMLElement;
  drawWaveform: (audiobuffer: AudioBuffer) => void;
  refresh: () => void;  // Always updates in place, never returns a new instance
  cleanup: () => void;
}

export const EnvelopeSVG = (
  instrument: SamplePlayer,
  envType: EnvelopeType,
  width: string = '100%',
  height: string = '120px',
  snapToValues: { y?: number[]; x?: number[] } = {},
  snapThreshold = 0.025,
  multiColorPlayheads = true
): EnvelopeSVG => {

  // Get envelope properties - store as let so we can update it
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
        // Just check if envelope has points now
        envelopeInfo = instrument.getEnvelope(envType);
        // Don't do anything for now - the parent will handle recreating if needed
      },
      cleanup: () => {},
    };
    return result;
  }

  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 200;
  const CIRCLE_PADDING = 8;
  const TOP_BTNS_PADDING = 16;

  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;
  let envelopePath: SVGPathElement;
  let waveformPath: SVGPathElement | null = null;

  // UI states
  const enabled = van.state<boolean>(envelopeInfo.isEnabled);
  const loopEnabled = van.state<boolean>(envelopeInfo.loopEnabled);
  const syncedToPlaybackRate = van.state<boolean>(
    envelopeInfo.syncedToPlaybackRate
  );

  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);

  // Optimized click handling with drag/click distinction
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

  const updateControlPoints = () => {
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
            envelopeInfo.fullDuration,
            SVG_WIDTH - 2 * CIRCLE_PADDING
          ) + CIRCLE_PADDING
        ).toString()
      );

      const normalizedValue = absoluteValueToNormalized(
        point.value,
        envelopeInfo.valueRange,
        envelopeType === 'filter-env' ? 'logarithmic' : 'linear'
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
    if (enabled.val) {
      instrument.enableEnvelope(envelopeType);
    } else {
      instrument.disableEnvelope(envelopeType);
    }
    // Always refresh visuals to reflect enabled/disabled styles
    updateControlPoints();
    updateEnvelopePath();
  });

  van.derive(() => instrument.setEnvelopeLoop(envelopeType, loopEnabled.val));

  van.derive(() =>
    instrument.setEnvelopeSync(envelopeType, syncedToPlaybackRate.val)
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

  // Manually append the SVG element to avoid namespace issues
  container.appendChild(svgElement);
  // Grid
  const gridGroup = createEnvelopeGrid(SVG_WIDTH, SVG_HEIGHT);

  // Envelope path

  const updateEnvelopePath = () => {
    // Refresh envelope info before updating path
    envelopeInfo = instrument.getEnvelope(envType);

    envelopePath.setAttribute(
      'd',
      generateSVGPath(
        envelopeInfo.points,
        envelopeInfo.fullDuration,
        SVG_WIDTH - 2 * CIRCLE_PADDING,
        SVG_HEIGHT - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING,
        envelopeInfo.valueRange,
        envelopeType === 'filter-env' ? 'logarithmic' : 'linear',
        CIRCLE_PADDING,
        CIRCLE_PADDING + TOP_BTNS_PADDING
      )
    );
  };

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
    // Remove previous waveform path if it exists
    if (waveformPath && waveformPath.parentNode === svgElement) {
      svgElement.removeChild(waveformPath);
      waveformPath = null;
    }

    const waveformSVGData = getWaveformSVGData(
      audiobuffer,
      SVG_WIDTH - 2 * CIRCLE_PADDING,
      SVG_HEIGHT - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING
    );

    waveformPath = path({
      id: 'waveform-path',
      d: waveformSVGData.trim(),
      fill: 'none',
      stroke: () =>
        enabled.val ? 'rgba(52, 103, 188, 0.8)' : 'rgba(51, 51, 51, 0.8)',
      'stroke-width': 1,
      style: 'z-index: -999; pointer-events: none; ',
      'pointer-events': 'none', // SVG attribute, not CSS
      transform: `translate(${CIRCLE_PADDING}, ${CIRCLE_PADDING + TOP_BTNS_PADDING})`,
    }) as SVGPathElement;

    // Insert waveform after grid but before envelope path
    svgElement.insertBefore(waveformPath, envelopePath);

    gsap.from(waveformPath, {
      duration: 0.5,
      drawSVG: 0,
      ease: 'none',
    });
  }

  // EVENT HANDLERS

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
        envelopeInfo.fullDuration
      );

      let value = screenYToAbsoluteValue(
        coords.y - rect.top - CIRCLE_PADDING - TOP_BTNS_PADDING,
        rect.height - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING,
        envelopeInfo.valueRange
      );

      // Apply snapping in normalized space
      value = applySnappingAbsolute(
        value,
        snapToValues.y,
        snapThreshold,
        envelopeInfo.valueRange
      );

      // Handle fixed start/end times
      if (isStartPoint) {
        time = 0;
      } else if (isEndPoint) {
        time = envelopeInfo.fullDuration;
      } else {
        time = applySnapping(time, snapToValues.x, snapThreshold);
      }

      // Convert to logarithmic space for filter envelopes
      if (envelopeType === 'filter-env') {
        value = linearToLogarithmic(value, envelopeInfo.valueRange);
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
      envelopeInfo.fullDuration
    );

    let value = screenYToAbsoluteValue(
      coords.y - rect.top - CIRCLE_PADDING - TOP_BTNS_PADDING,
      rect.height - 2 * CIRCLE_PADDING - TOP_BTNS_PADDING,
      envelopeInfo.valueRange
    );

    // Apply snapping for consistency with drag behavior
    value = applySnappingAbsolute(
      value,
      snapToValues.y,
      snapThreshold,
      envelopeInfo.valueRange
    );

    time = applySnapping(time, snapToValues.x, snapThreshold);

    // Convert to logarithmic space for filter envelopes
    if (envelopeType === 'filter-env') {
      value = linearToLogarithmic(value, envelopeInfo.valueRange);
    }

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
  svgElement.appendChild(gridGroup);
  svgElement.appendChild(envelopePath);
  svgElement.appendChild(pointsGroup);

  updateControlPoints();

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
    // Update envelope info
    envelopeInfo = instrument.getEnvelope(envType);

    // Update UI state
    enabled.val = envelopeInfo.isEnabled;
    loopEnabled.val = envelopeInfo.loopEnabled;
    syncedToPlaybackRate.val = envelopeInfo.syncedToPlaybackRate;

    // Update visual elements
    updateControlPoints();
    updateEnvelopePath();
    // animateIntro(); // TODO: make this work
  };

  // Listen for envelope created/updated messages
  const envelopeMessageCleanup = instrument.onMessage(
    `${envType}:created`,
    () => {
      refresh();
    }
  );

  // Listen for sample loaded to redraw waveform
  const sampleLoadedCleanup = instrument.onMessage('sample:loaded', () => {
    // Redraw waveform with the new sample
    if (instrument.audiobuffer) {
      drawWaveform(instrument.audiobuffer);
    }
    // Also refresh the envelope in case it changed with the new sample
    refresh();
  });

  return {
    element: container,
    timeScaleKnob,
    drawWaveform,
    refresh,
    cleanup: () => {
      envelopeMessageCleanup();
      sampleLoadedCleanup();
      playheadManager.cleanup();
      // Clean up point interaction states
      pointStates.forEach((state) => {
        if (state.doubleClickTimer) {
          clearTimeout(state.doubleClickTimer);
        }
      });
      pointStates.clear();
      if (waveformPath && waveformPath.parentNode === svgElement) {
        svgElement.removeChild(waveformPath);
      }
    },
  };
};
