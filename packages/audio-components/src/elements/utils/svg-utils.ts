/**
 * Creates an SVG element from a raw SVG string
 *
 * @param svgString Raw SVG content as string
 * @param dimensions Object containing width and height (as strings with units, e.g. '2rem')
 * @param color Color to apply to the SVG (using currentColor or specific color)
 * @param fallbackText Text to display if SVG creation fails
 * @returns SVG element or null if creation fails
 */
export const createSvgIcon = (
  svgString: string,
  dimensions: { width: string; height: string } = {
    width: '2rem',
    height: '2rem',
  },
  color: string = 'currentColor',
  fallbackText?: string
): SVGElement | HTMLElement | string => {
  try {
    const container = document.createElement('div');
    container.innerHTML = svgString;
    const svgElement = container.querySelector('svg');

    if (svgElement) {
      svgElement.setAttribute('width', dimensions.width);
      svgElement.setAttribute('height', dimensions.height);
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

    // If SVG parsing failed but fallback is provided
    if (fallbackText) {
      const fallbackElement = document.createElement('span');
      fallbackElement.textContent = fallbackText;
      fallbackElement.style.verticalAlign = 'middle';
      return fallbackElement;
    }

    return '';
  } catch (error) {
    console.debug('Failed to create SVG icon:', error);

    // Return fallback if provided
    if (fallbackText) {
      const fallbackElement = document.createElement('span');
      fallbackElement.textContent = fallbackText;
      fallbackElement.style.verticalAlign = 'middle';
      return fallbackElement;
    }

    return '';
  }
};
