import { gsap, MorphSVGPlugin } from 'gsap/all';

gsap.registerPlugin(MorphSVGPlugin);

interface ButtonOptions {
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
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>`,
  ],

  [
    'upload',
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
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
    `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M21.775 7.517H24v8.966h-2.225zm-8.562 0h6.506c.66 0 1.045.57 1.045 1.247v6.607c0 .84-.35 1.112-1.112 1.112h-6.439v-5.696h2.225v3.505h3.135V9.54h-5.36zm-3.235 0h2.19v8.966h-2.19zM0 7.517h7.854c.66 0 1.045.57 1.045 1.247v7.72H6.708V9.774H5.427v6.708H3.438V9.775H2.191v6.708H0Z"/>
</svg>`,
  ],

  [
    'midi_off',
    `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M21.775 7.517H24v8.966h-2.225zm-8.562 0h6.506c.66 0 1.045.57 1.045 1.247v6.607c0 .84-.35 1.112-1.112 1.112h-6.439v-5.696h2.225v3.505h3.135V9.54h-5.36zm-3.235 0h2.19v8.966h-2.19zM0 7.517h7.854c.66 0 1.045.57 1.045 1.247v7.72H6.708V9.774H5.427v6.708H3.438V9.775H2.191v6.708H0Z"/>
  <!-- Strike-through line -->
  <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`,
  ],

  [
    'direction_forward',
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polygon points="5,3 19,12 5,21" fill="currentColor"/>
</svg>`,
  ],

  [
    'direction_reverse',
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polygon points="19,3 5,12 19,21" fill="currentColor"/>
</svg>`,
  ],

  [
    'loop_unlocked',
    `<svg viewBox="0 0 17 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier"> 
        <path d="M1 9c0 2.206 1.711 4 3.813 4v1c-2.654 0-4.813-2.243-4.813-5s2.159-5 4.813-5h4.229l-1.646-1.646 0.707-0.707 2.854 2.853-2.853 2.854-0.708-0.708 1.647-1.646h-4.23c-2.102 0-3.813 1.794-3.813 4zM12.187 4v1c2.102 0 3.813 1.794 3.813 4s-1.711 4-3.813 4h-4.23l1.646-1.646-0.707-0.707-2.853 2.853 2.854 2.854 0.707-0.707-1.647-1.647h4.229c2.655 0 4.814-2.243 4.814-5s-2.159-5-4.813-5z" fill="currentColor"></path>
        <!-- Diagonal line to indicate "off" state -->
        <line x1="2" y1="15" x2="15" y2="2" stroke="currentColor" stroke-width="1" stroke-linecap="round"></line>
        </g>
     </svg>
`,
  ],

  [
    'loop_locked',
    `<svg width="800px" height="800px" viewBox="0 0 17 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
	      <path d="M1 9c0 2.206 1.711 4 3.813 4v1c-2.654 0-4.813-2.243-4.813-5s2.159-5 4.813-5h4.229l-1.646-1.646 0.707-0.707 2.854 2.853-2.853 2.854-0.708-0.708 1.647-1.646h-4.23c-2.102 0-3.813 1.794-3.813 4zM12.187 4v1c2.102 0 3.813 1.794 3.813 4s-1.711 4-3.813 4h-4.23l1.646-1.646-0.707-0.707-2.853 2.853 2.854 2.854 0.707-0.707-1.647-1.647h4.229c2.655 0 4.814-2.243 4.814-5s-2.159-5-4.813-5z" fill="currentColor" />
     </svg>`,
  ],
  [
    'pitch_on',
    `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    <line x1="12" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="0" stroke-linecap="round"/>
  </svg>`,
  ],

  [
    'pitch_off',
    `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  ],
  [
    'hold_locked',
    `<svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
    <line x1="12" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="0" stroke-linecap="round"/>
  </svg>`,
  ],

  [
    'hold_unlocked',
    `<svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
