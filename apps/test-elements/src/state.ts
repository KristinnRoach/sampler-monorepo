// State persistence functions

// Type definitions
interface Position {
  left: string;
  top: string;
}

interface ElementState {
  attack?: string;
  release?: string;
  loopStart?: number;
  loopEnd?: number;
}

interface State {
  positions: Record<string, Position>;
  elementStates: Record<string, ElementState>;
}

// Extend HTMLElement to include custom methods
interface CustomHTMLElement extends HTMLElement {
  getAttack?: () => string;
  getRelease?: () => string;
  setAttack?: (value: number) => void;
  setRelease?: (value: number) => void;
  loopStart?: number;
  loopEnd?: number;
  setLoop?: (start: number, end: number) => void;
}

export const saveState = (): void => {
  const state: State = {
    positions: {},
    elementStates: {},
  };

  // Save positions of draggable elements
  document.querySelectorAll('.draggable').forEach((el) => {
    if (el.id) {
      state.positions[el.id] = {
        left: (el as HTMLElement).style.left,
        top: (el as HTMLElement).style.top,
      };
    }
  });

  // Save element-specific states
  const elementsToSave: string[] = [
    'sampler-1',
    'loader-1',
    'recorder-1',
    'envelope-1',
    'loop-controller-1',
    'sample-offset-controller-1',
    'karplus-2',
  ];

  elementsToSave.forEach((id) => {
    const el = document.getElementById(id) as CustomHTMLElement;
    if (!el) return;

    // Save element-specific properties
    // This will depend on what properties each element has
    const elementState: ElementState = {};

    if (id === 'envelope-1') {
      if (el.getAttack) elementState.attack = el.getAttack();
      if (el.getRelease) elementState.release = el.getRelease();
    } else if (id === 'loop-controller-1') {
      elementState.loopStart = el.loopStart;
      elementState.loopEnd = el.loopEnd;
    }
    // Todo: Add more element-specific state extraction as needed

    if (Object.keys(elementState).length > 0) {
      state.elementStates[id] = elementState;
    }
  });

  localStorage.setItem('audioElementsState', JSON.stringify(state));
};

export const loadState = (): void => {
  const savedState = localStorage.getItem('audioElementsState');
  if (!savedState) return;

  try {
    const state: State = JSON.parse(savedState);

    // Restore positions
    if (state.positions) {
      Object.entries(state.positions).forEach(([id, position]) => {
        const el = document.getElementById(id);
        if (el && position.left && position.top) {
          (el as HTMLElement).style.left = position.left;
          (el as HTMLElement).style.top = position.top;
        }
      });
    }

    // Restore element states
    if (state.elementStates) {
      Object.entries(state.elementStates).forEach(([id, elementState]) => {
        const el = document.getElementById(id) as CustomHTMLElement;
        if (!el) return;

        // Restore element-specific properties
        if (id === 'envelope-1') {
          if (elementState.attack && el.setAttack)
            el.setAttack(parseFloat(elementState.attack));
          if (elementState.release && el.setRelease)
            el.setRelease(parseFloat(elementState.release));
        } else if (
          id === 'loop-controller-1' &&
          elementState.loopStart !== undefined &&
          elementState.loopEnd !== undefined &&
          el.setLoop
        ) {
          el.setLoop(elementState.loopStart, elementState.loopEnd);
        }
        // Add more element-specific state restoration as needed
      });
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }
};

// Debounce function to prevent too frequent saving
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | undefined;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const debouncedSaveState = debounce(saveState, 300);
