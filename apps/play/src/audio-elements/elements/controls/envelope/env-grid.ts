import van from '@repo/vanjs-core';

const { g, line } = van.tags('http://www.w3.org/2000/svg');

/**
 * Creates SVG grid lines for the envelope background
 */
export const createGrid = (
  width: number,
  height: number,
  options: {
    offsetX?: number;
    offsetY?: number;
    includeTopBottom?: boolean;
  } = {}
): SVGGElement => {
  const { offsetX = 0, offsetY = 0, includeTopBottom = false } = options;

  const verticalCount = 5;
  const horizontalCount = 5;

  const verticalLines = Array.from({ length: verticalCount }, (_, i) => {
    const x = (i / verticalCount) * width;
    return line({
      x1: x + offsetX,
      y1: 0 + offsetY,
      x2: x + offsetX,
      y2: height + offsetY,
      stroke: 'rgba(90, 90, 90, 0.5)',
      'stroke-width': 0.5,
    });
  }).filter(Boolean);

  let horizontalLines: Element[] = [];
  if (includeTopBottom) {
    // Draw all lines including top and bottom
    horizontalLines = Array.from({ length: horizontalCount }, (_, i) => {
      const y = (i / (horizontalCount - 1)) * height;
      return line({
        x1: 0 + offsetX,
        y1: y + offsetY,
        x2: width + offsetX,
        y2: y + offsetY,
        stroke: '#333',
        'stroke-width': 0.5,
      });
    });
  } else {
    // Draw only inner lines (skip top and bottom)
    const innerCount = horizontalCount - 2;
    horizontalLines = Array.from({ length: innerCount }, (_, i) => {
      const y = ((i + 1) / (horizontalCount - 1)) * height;
      return line({
        x1: 0 + offsetX,
        y1: y + offsetY,
        x2: width + offsetX,
        y2: y + offsetY,
        stroke: '#333',
        'stroke-width': 1,
      });
    });
  }

  return g(
    { class: 'envelope-grid' },
    ...verticalLines,
    ...horizontalLines
  ) as SVGGElement;
};
