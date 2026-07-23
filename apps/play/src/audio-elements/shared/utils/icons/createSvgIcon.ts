// utils/icons.ts

/**
 * Creates an SVG element from a raw SVG string
 *
 * @param svgString Raw SVG content as string
 * @param dimensions Object containing width and height (as strings with units, e.g. '2rem')
 * @param color Color to apply to the SVG (using currentColor or specific color)
 * @param fallbackText Text to display if SVG creation fails
 * @returns SVG element or null if creation fails
 */
export function createSvgIcon(
  svgString: string,
  options: {
    width?: string;
    height?: string;
    color?: string;
  } = {}
): SVGElement | null {
  try {
    const container = document.createElement('div');
    container.innerHTML = svgString;
    const svgElement = container.querySelector('svg');
    const { width = '2rem', height = '2rem', color = 'currentColor' } = options;

    if (svgElement) {
      svgElement.setAttribute('width', width);
      svgElement.setAttribute('height', height);
      svgElement.setAttribute('fill', color);
      svgElement.style.verticalAlign = 'middle';

      if (color === 'white') {
        svgElement.style.filter = 'brightness(0) invert(1)';
      } else {
        const fillableElements = svgElement.querySelectorAll(
          'path, circle, rect, polygon, ellipse'
        );
        fillableElements.forEach((el) => {
          el.setAttribute('fill', color);
        });
      }

      return svgElement;
    }
    return null;
  } catch (error) {
    console.debug('Failed to create SVG icon:', error);
    return null;
  }
}
