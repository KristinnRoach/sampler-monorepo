import van from '@repo/vanjs-core';

const { g, line } = van.tags('http://www.w3.org/2000/svg');

/**
 * Creates SVG grid lines for the envelope background
 */
export const createEnvelopeGrid = (
  svgWidth: number,
  svgHeight: number
): SVGGElement => {
  const verticalLines = Array.from({ length: 6 }, (_, i) => {
    const x = (i / 5) * svgWidth;
    return line({
      x1: x,
      y1: 0,
      x2: x,
      y2: svgHeight,
      stroke: '#333',
      'stroke-width': 1,
    });
  });

  const horizontalLines = Array.from({ length: 6 }, (_, i) => {
    const y = (i / 5) * svgHeight;
    return line({
      x1: 0,
      y1: y,
      x2: svgWidth,
      y2: y,
      stroke: '#333',
      'stroke-width': 1,
    });
  });

  return g(
    { class: 'envelope-grid' },
    ...verticalLines,
    ...horizontalLines
  ) as SVGGElement;
};
