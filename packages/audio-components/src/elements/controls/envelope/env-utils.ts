// env-utils.ts
import type { EnvelopePoint } from '@repo/audiolib';

const LOG_SAFETY_MIN = 0.1;

/**
 * Convert linear value to logarithmic space
 */
export const linearToLogarithmic = (
  linearValue: number,
  valueRange: [number, number]
): number => {
  const [min, max] = valueRange;
  const normalized = (linearValue - min) / (max - min);
  const logMin = Math.log2(Math.max(LOG_SAFETY_MIN, min));
  const logMax = Math.log2(max);
  return Math.pow(2, logMin + normalized * (logMax - logMin));
};

/**
 * Convert time in seconds to SVG X coordinate
 */
export const secondsToScreenX = (
  timeInSeconds: number,
  maxDurationSeconds: number,
  svgWidth: number
): number => {
  return (timeInSeconds / maxDurationSeconds) * svgWidth;
};

/**
 * Convert SVG X coordinate to time in seconds
 */
export const screenXToSeconds = (
  screenX: number,
  svgWidth: number,
  maxDurationSeconds: number
): number => {
  return (screenX / svgWidth) * maxDurationSeconds;
};

/**
 * Convert SVG Y coordinate to normalized envelope value (0-1)
 * This now returns normalized values that need to be converted to absolute values
 */
export const screenYToNormalizedValue = (
  screenY: number,
  svgHeight: number
): number => {
  return Math.max(0, Math.min(1, 1 - screenY / svgHeight));
};

/**
 * Convert SVG Y coordinate directly to absolute envelope value
 */
export const screenYToAbsoluteValue = (
  screenY: number,
  svgHeight: number,
  valueRange: [number, number],
  scaling: 'linear' | 'logarithmic' = 'linear'
): number => {
  const normalized = screenYToNormalizedValue(screenY, svgHeight);
  const [min, max] = valueRange;

  if (scaling === 'logarithmic') {
    // Convert from linear UI space to logarithmic frequency space
    const logMin = Math.log2(Math.max(LOG_SAFETY_MIN, min));
    const logMax = Math.log2(max);
    return Math.pow(2, logMin + normalized * (logMax - logMin));
  } else {
    // Linear scaling (original behavior)
    return min + normalized * (max - min);
  }
};

/**
 * Convert absolute envelope value to normalized value (0-1) for display
 */
export const absoluteValueToNormalized = (
  value: number,
  valueRange: [number, number],
  scaling: 'linear' | 'logarithmic' = 'linear'
): number => {
  const [min, max] = valueRange;

  if (scaling === 'logarithmic') {
    // Convert from logarithmic frequency space to linear UI space
    const logMin = Math.log2(Math.max(LOG_SAFETY_MIN, min));
    const logMax = Math.log2(max);
    const logVal = Math.log2(Math.max(LOG_SAFETY_MIN, value));
    return Math.max(0, Math.min(1, (logVal - logMin) / (logMax - logMin)));
  } else {
    // Linear scaling (original behavior)
    return (value - min) / (max - min);
  }
};

/**
 * Apply snapping to a value if it's close to any snap points
 */
export const applySnapping = (
  value: number,
  snapValues: number[] | undefined,
  threshold: number
): number => {
  if (!snapValues) return value;
  const closest = snapValues.find((v) => Math.abs(v - value) < threshold);
  return closest !== undefined ? closest : value;
};

/**
 * Apply snapping in normalized space, then convert to absolute
 */
export const applySnappingAbsolute = (
  absoluteValue: number,
  normalizedSnapValues: number[] | undefined,
  threshold: number,
  valueRange: [number, number]
): number => {
  if (!normalizedSnapValues) return absoluteValue;

  // Convert to normalized space
  const normalized = absoluteValueToNormalized(absoluteValue, valueRange);

  // Apply snapping in normalized space
  const snapped = applySnapping(normalized, normalizedSnapValues, threshold);

  // Convert back to absolute
  const [min, max] = valueRange;
  return min + snapped * (max - min);
};

/**
 * Generate SVG path data from envelope points (now with absolute values)
 */
export const generateSVGPath = (
  points: EnvelopePoint[],
  maxDurationSeconds: number,
  svgWidth: number,
  svgHeight: number,
  valueRange: [number, number],
  scaling: 'linear' | 'logarithmic' = 'linear',
  offsetX: number = 0,
  offsetY: number = 0
): string => {
  if (points.length < 2)
    return `M${offsetX},${svgHeight + offsetY} L${svgWidth + offsetX},${svgHeight + offsetY}`;

  const sortedPoints = [...points].sort((a, b) => a.time - b.time);

  // Normalize first point value for display
  const firstNormalized = absoluteValueToNormalized(
    sortedPoints[0].value,
    valueRange,
    scaling
  );
  let path = `M${secondsToScreenX(sortedPoints[0].time, maxDurationSeconds, svgWidth) + offsetX},${(1 - firstNormalized) * svgHeight + offsetY}`;

  for (let i = 1; i < sortedPoints.length; i++) {
    const point = sortedPoints[i];
    const prevPoint = sortedPoints[i - 1];

    const x =
      secondsToScreenX(point.time, maxDurationSeconds, svgWidth) + offsetX;
    const normalizedY = absoluteValueToNormalized(
      point.value,
      valueRange,
      scaling
    );
    const y = (1 - normalizedY) * svgHeight + offsetY;

    if (prevPoint.curve === 'exponential') {
      const prevX =
        secondsToScreenX(prevPoint.time, maxDurationSeconds, svgWidth) +
        offsetX;
      const prevNormalizedY = absoluteValueToNormalized(
        prevPoint.value,
        valueRange,
        scaling
      );
      const prevY = (1 - prevNormalizedY) * svgHeight + offsetY;
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

// Legacy function for backward compatibility - DEPRECATED
export const screenYToValue = screenYToNormalizedValue;
// // env-utils.ts
// import type { EnvelopePoint } from '@repo/audiolib';

// /**
//  * Convert time in seconds to SVG X coordinate
//  */
// export const secondsToScreenX = (
//   timeInSeconds: number,
//   maxDurationSeconds: number,
//   svgWidth: number
// ): number => {
//   return (timeInSeconds / maxDurationSeconds) * svgWidth;
// };

// /**
//  * Convert SVG X coordinate to time in seconds
//  */
// export const screenXToSeconds = (
//   screenX: number,
//   svgWidth: number,
//   maxDurationSeconds: number
// ): number => {
//   return (screenX / svgWidth) * maxDurationSeconds;
// };

// /**
//  * Convert SVG Y coordinate to envelope value (0-1)
//  */
// export const screenYToValue = (screenY: number, svgHeight: number): number => {
//   return Math.max(0, Math.min(1, 1 - screenY / svgHeight));
// };

// /**
//  * Apply snapping to a value if it's close to any snap points
//  */
// export const applySnapping = (
//   value: number,
//   snapValues: number[] | undefined,
//   threshold: number
// ): number => {
//   if (!snapValues) return value;
//   const closest = snapValues.find((v) => Math.abs(v - value) < threshold);
//   return closest !== undefined ? closest : value;
// };

// /**
//  * Generate SVG path data from envelope points
//  */
// export const generateSVGPath = (
//   points: EnvelopePoint[],
//   maxDurationSeconds: number,
//   svgWidth: number,
//   svgHeight: number
// ): string => {
//   if (points.length < 2) return `M0,${svgHeight} L${svgWidth},${svgHeight}`;

//   const sortedPoints = [...points].sort((a, b) => a.time - b.time);
//   let path = `M${secondsToScreenX(sortedPoints[0].time, maxDurationSeconds, svgWidth)},${(1 - sortedPoints[0].value) * svgHeight}`;

//   for (let i = 1; i < sortedPoints.length; i++) {
//     const point = sortedPoints[i];
//     const prevPoint = sortedPoints[i - 1];

//     const x = secondsToScreenX(point.time, maxDurationSeconds, svgWidth);
//     const y = (1 - point.value) * svgHeight;

//     if (prevPoint.curve === 'exponential') {
//       const prevX = secondsToScreenX(
//         prevPoint.time,
//         maxDurationSeconds,
//         svgWidth
//       );
//       const prevY = (1 - prevPoint.value) * svgHeight;
//       const cp1X = prevX + (x - prevX) * 0.3;
//       const cp1Y = prevY;
//       const cp2X = prevX + (x - prevX) * 0.7;
//       const cp2Y = y;
//       path += ` C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${x},${y}`;
//     } else {
//       path += ` L${x},${y}`;
//     }
//   }
//   return path;
// };
