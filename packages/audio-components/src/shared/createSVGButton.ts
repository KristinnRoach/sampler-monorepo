import { gsap, MorphSVGPlugin } from 'gsap/all';

gsap.registerPlugin(MorphSVGPlugin);

interface ButtonOptions {
  initialState?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  colors?: Record<string, string>;
}

interface ButtonSize {
  width: string;
  height: string;
  iconSize: string;
}

const icons = new Map<string, string>([
  [
    'download',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0.5 0 23 24" width="23px" height="23px" stroke-width="2" fill="none" stroke="currentColor">
      <path d="M 12 15.334 L 12 0 M 5.61 8.944 L 12 15.334 L 18.39 8.944 M 23.5 15.334 L 23.5 20.444 C 23.5 21.856 22.357 23 20.944 23 L 3.055 23 C 1.646 23 0.5 21.856 0.5 20.444 L 0.5 15.334" "/>
    </svg>`,
  ],

  [
    'upload',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0.5 0 23 24" width="23px" height="23px" stroke-width="2" fill="none" stroke="currentColor">
      <path d="M 12 0.75 L 12 16.084 M 23.5 15.334 L 23.5 20.444 C 23.5 21.856 22.357 23 20.944 23 L 3.055 23 C 1.646 23 0.5 21.856 0.5 20.444 L 0.5 15.334 M 5.61 7.14 L 12 0.75 L 18.39 7.14" "/>
    </svg>`,
  ],

  [
    'record_inactive',
    `<svg viewBox="0 0 24 24" fill="red" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="8" />
    </svg>`,
  ],

  [
    'record_armed',
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>`,
  ],

  [
    'record_recording',
    `<svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" fill="white" />
    </svg>`,
  ],

  [
    'midi_on',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 5 24 14" width="24px" height="14px" fill="currentColor" stroke="none">
      <path d="M 21.775 5 L 24 5 L 24 18.998 L 21.775 18.998 L 21.775 5 Z M 13.213 5 L 19.719 5 C 20.379 5 20.764 5.891 20.764 6.948 L 20.764 17.262 C 20.764 18.575 20.414 18.998 19.652 18.998 L 13.213 18.998 L 13.213 10.106 L 15.438 10.106 L 15.438 15.577 L 18.573 15.577 L 18.573 8.159 L 13.213 8.159 L 13.213 5 Z M 9.978 5 L 12.168 5 L 12.168 18.998 L 9.978 18.998 L 9.978 5 Z M 0 5 L 7.854 5 C 8.514 5 8.899 5.891 8.899 6.948 L 8.899 19 L 6.708 19 L 6.708 8.524 L 5.427 8.524 L 5.427 18.997 L 3.438 18.997 L 3.438 8.525 L 2.191 8.525 L 2.191 18.998 L 0 18.998 L 0 5 Z" style="stroke-width: 1;"/>
    </svg>`,
  ],

  [
    'midi_off',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 5 24 14" width="24px" height="14px" fill="currentColor" stroke="none">
      <path d="M 21.775 5 L 24 5 L 24 18.998 L 21.775 18.998 L 21.775 5 Z M 13.213 5 L 19.719 5 C 20.379 5 20.764 5.891 20.764 6.948 L 20.764 17.262 C 20.764 18.575 20.414 18.998 19.652 18.998 L 13.213 18.998 L 13.213 10.106 L 15.438 10.106 L 15.438 15.577 L 18.573 15.577 L 18.573 8.159 L 13.213 8.159 L 13.213 5 Z M 9.978 5 L 12.168 5 L 12.168 18.998 L 9.978 18.998 L 9.978 5 Z M 0 5 L 7.854 5 C 8.514 5 8.899 5.891 8.899 6.948 L 8.899 19 L 6.708 19 L 6.708 8.524 L 5.427 8.524 L 5.427 18.997 L 3.438 18.997 L 3.438 8.525 L 2.191 8.525 L 2.191 18.998 L 0 18.998 L 0 5 Z" style="stroke-width: 1;"/>
    </svg>`,
  ],

  [
    'direction_forward',
    ` 
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="16px" xmlns:bx="https://boxy-svg.com" fill="currentColor" stroke="none">
        <path d="M 34.241 44.441 H 47.535 L 44.848 38.728 L 56.716 46.728 L 44.848 54.728 L 47.535 49.016 H 34.241 V 44.441 Z" bx:shape="arrow 34.241 38.728 22.475 16 4.574 11.868 2.687 1@3d0e1b09" style="fill: currentColor;" transform="matrix(1, -0.00037700001848861575, 0.00037700001848861575, 1, -33.69770050048828, -33.24232482910156)"/>
      </svg>
`,
  ],

  [
    'direction_reverse',
    `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="16px" xmlns:bx="https://boxy-svg.com" fill="currentColor" stroke="none">
      <path d="M -34.241 -33.015 H -20.947 L -23.634 -38.728 L -11.766 -30.728 L -23.634 -22.728 L -20.947 -28.441 H -34.241 V -33.015 Z" bx:shape="arrow -34.241 -38.728 22.475 16 4.574 11.868 2.687 1@168237fd" style="fill: currentColor;" transform="matrix(-1, -0.00037700001848861575, -0.00037700001848861575, 1, -10.841633796691895, 44.18785858154297)"/>
    </svg>`,
  ],

  [
    'loop_unlocked',
    `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 1.6 24 20.747" width="24px" height="20.747px" fill="currentColor" stroke="none">
      <path d="M 1.412 11.973 C 1.412 15.085 3.827 17.616 6.795 17.616 L 6.795 19.026 C 3.048 19.026 0 15.862 0 11.973 C 0 8.084 3.048 4.919 6.795 4.919 L 12.765 4.919 L 10.441 2.597 L 11.44 1.6 L 15.469 5.625 L 11.441 9.651 L 10.441 8.652 L 12.767 6.33 L 6.795 6.33 C 3.827 6.33 1.412 8.861 1.412 11.973 Z M 17.205 4.919 L 17.205 6.33 C 20.173 6.33 22.588 8.861 22.588 11.973 C 22.588 15.085 20.173 17.616 17.205 17.616 L 11.233 17.616 L 13.557 15.294 L 12.559 14.296 L 8.531 18.321 L 12.56 22.347 L 13.559 21.35 L 11.233 19.026 L 17.204 19.026 C 20.952 19.026 24 15.862 24 11.973 C 24 8.084 20.952 4.919 17.205 4.919 Z" "/>
    </svg>`,
  ],

  [
    'loop_locked',
    `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 1.6 24 20.747" width="24px" height="20.747px" fill="currentColor" stroke="none">
      <path d="M 1.412 11.973 C 1.412 15.085 3.827 17.616 6.795 17.616 L 6.795 19.026 C 3.048 19.026 0 15.862 0 11.973 C 0 8.084 3.048 4.919 6.795 4.919 L 12.765 4.919 L 10.441 2.597 L 11.44 1.6 L 15.469 5.625 L 11.441 9.651 L 10.441 8.652 L 12.767 6.33 L 6.795 6.33 C 3.827 6.33 1.412 8.861 1.412 11.973 Z M 17.205 4.919 L 17.205 6.33 C 20.173 6.33 22.588 8.861 22.588 11.973 C 22.588 15.085 20.173 17.616 17.205 17.616 L 11.233 17.616 L 13.557 15.294 L 12.559 14.296 L 8.531 18.321 L 12.56 22.347 L 13.559 21.35 L 11.233 19.026 L 17.204 19.026 C 20.952 19.026 24 15.862 24 11.973 C 24 8.084 20.952 4.919 17.205 4.919 Z" "/>
    </svg>`,
  ],
  [
    'pitch_on',
    `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="4 0 16 24" width="16px" height="24px" fill="currentColor" stroke="none">
      <path d="M 12 0 L 12 14.067 C 11.213 13.613 10.307 13.333 9.333 13.333 C 6.387 13.333 4 15.72 4 18.667 C 4 21.613 6.387 24 9.333 24 C 12.28 24 14.667 21.613 14.667 18.667 L 14.667 5.333 L 20 5.333 L 20 0 L 12 0 Z" style="stroke-width: 1;"/>
    </svg>`,
  ],

  [
    'pitch_off',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 0 16 24" width="16px" height="24px" fill="currentColor" stroke="none">
      <path d="M 12 0 L 12 14.067 C 11.213 13.613 10.307 13.333 9.333 13.333 C 6.387 13.333 4 15.72 4 18.667 C 4 21.613 6.387 24 9.333 24 C 12.28 24 14.667 21.613 14.667 18.667 L 14.667 5.333 L 20 5.333 L 20 0 L 12 0 Z" style="stroke-width: 1;"/>
    </svg>`,
  ],
  [
    'hold_locked',
    `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="4 0 16 24" width="16px" height="24px" fill="currentColor" stroke="none">
      <path d="M 14.667 2 L 20 2 L 20 22 L 14.667 22 L 14.667 2 Z M 4 2 L 9.333 2 L 9.333 22 L 4 22 L 4 2 Z" style="stroke-width: 1;"/>
    </svg>`,
  ],

  [
    'hold_unlocked',
    `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="4 0 16 24" width="16px" height="24px" fill="currentColor" stroke="none">
      <path d="M 14.667 2 L 20 2 L 20 22 L 14.667 22 L 14.667 2 Z M 4 2 L 9.333 2 L 9.333 22 L 4 22 L 4 2 Z" style="stroke-width: 1;"/>
    </svg>`,
  ],
]);

const DEFAULT_COLORS = {
  color: '#eee',
  background: 'transparent',
  fill: '#eee',
  stroke: '#eee',
  hover: '#999999',

  // States
  midi_on: '#eee',
  pitch_on: '#eee',
  hold_locked: '#eee',
  loop_locked: '#eee',

  midi_off: '#aaa',
  pitch_off: '#aaa',
  hold_unlocked: '#aaa',
  loop_unlocked: '#aaa',
} as const;

const getSizeConfig = (size: 'sm' | 'md' | 'lg'): ButtonSize => {
  const sizeMap: Record<'sm' | 'md' | 'lg', ButtonSize> = {
    sm: { width: '32px', height: '32px', iconSize: '16px' },
    md: { width: '40px', height: '40px', iconSize: '20px' },
    lg: { width: '48px', height: '48px', iconSize: '24px' },
  } as const;

  return sizeMap[size];
};

const applyBaseStyles = (button: HTMLButtonElement): void => {
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.padding = '8px';
  button.style.margin = '4px';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.border = 'none';
  button.style.backgroundColor = DEFAULT_COLORS['background'];

  button.addEventListener('mouseenter', () => {
    button.style.border = `1px solid ${DEFAULT_COLORS['hover']}`; // '1px solid rgba(0,0,0,1.5)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.border = 'none';
  });
};

const applySizeStyles = (button: HTMLButtonElement, size: ButtonSize): void => {
  button.style.width = size.width;
  button.style.height = size.height;
};

export function createSVGButton(
  title: string,
  states: string | string[],
  options: ButtonOptions = {}
): HTMLButtonElement {
  const stateArray = Array.isArray(states) ? states : [states];
  let currentStateIndex = 0;

  if (options.initialState) {
    const idx = stateArray.indexOf(options.initialState);
    if (idx) currentStateIndex = idx;
  }

  const button = document.createElement('button');
  button.title = title;

  applyBaseStyles(button);
  applySizeStyles(button, getSizeConfig(options.size || 'md'));

  if (options.className) {
    button.className += ` ${options.className}`;
  }

  const updateButton = () => {
    const stateName = stateArray[currentStateIndex];
    const svgContent = icons.get(stateName) || stateName;
    button.innerHTML = svgContent;

    const svg = button.querySelector('svg');
    if (svg) {
      const iconSize = getSizeConfig(options.size || 'md').iconSize;
      svg.style.width = iconSize;
      svg.style.height = iconSize;

      const customColor = options.colors?.[stateName];
      const defaultStateColor =
        DEFAULT_COLORS[stateName as keyof typeof DEFAULT_COLORS];
      const color = customColor || defaultStateColor || DEFAULT_COLORS['color'];
      svg.style.color = color;
    }
  };

  updateButton();

  button.addEventListener('click', () => {
    if (stateArray.length > 1) {
      currentStateIndex = (currentStateIndex + 1) % stateArray.length;
      updateButton();
    }

    if (options.onClick) {
      options.onClick();
    }
  });

  (button as any).getState = () => stateArray[currentStateIndex];

  (button as any).setState = (newState: string) => {
    const newIndex = stateArray.indexOf(newState);
    if (newIndex !== -1) {
      currentStateIndex = newIndex;
      updateButton();
    }
  };

  return button;
}

// Helper functions to modify the maps if needed
export function registerIcon(name: string, svgContent: string): void {
  icons.set(name, svgContent);
}

// Usage:
// const downloadBtn = createSVGButton('Download', 'download', { size: 'lg' });
// const recordBtn = createSVGButton('Record', ['record_inactive', 'record_armed', 'record_recording']);

/** Helper to check if two SVGs can morph (both have single path with d attribute) */
function canMorph(fromSvg: string, toSvg: string): boolean {
  const parser = new DOMParser();
  const fromDoc = parser.parseFromString(fromSvg, 'image/svg+xml');
  const toDoc = parser.parseFromString(toSvg, 'image/svg+xml');

  const fromPaths = fromDoc.querySelectorAll('path[d]');
  const toPaths = toDoc.querySelectorAll('path[d]');

  return fromPaths.length === 1 && toPaths.length === 1;
}

/** Extract path d attribute from SVG string */
function getPathData(svgString: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const path = doc.querySelector('path[d]');
  return path?.getAttribute('d') || null;
}
