// State persistence functions
export const saveState = () => {
  const state = {
    positions: {},
    elementStates: {},
  };

  // Save positions of draggable elements
  document.querySelectorAll('.draggable').forEach((el) => {
    if (el.id) {
      state.positions[el.id] = {
        left: el.style.left,
        top: el.style.top,
      };
    }
  });

  // Save element-specific states
  const elementsToSave = [
    'sampler-1',
    'loader-1',
    'recorder-1',
    'envelope-1',
    'loop-controller-1',
    'sample-offset-controller-1',
    'karplus-2',
  ];

  elementsToSave.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Save element-specific properties
    // This will depend on what properties each element has
    const elementState = {};

    if (id === 'envelope-1') {
      elementState.attack = el.getAttribute('attack');
      elementState.release = el.getAttribute('release');
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

export const loadState = () => {
  const savedState = localStorage.getItem('audioElementsState');
  if (!savedState) return;

  try {
    const state = JSON.parse(savedState);

    // Restore positions
    if (state.positions) {
      Object.entries(state.positions).forEach(([id, position]) => {
        const el = document.getElementById(id);
        if (el && position.left && position.top) {
          el.style.left = position.left;
          el.style.top = position.top;
        }
      });
    }

    // Restore element states
    if (state.elementStates) {
      Object.entries(state.elementStates).forEach(([id, elementState]) => {
        const el = document.getElementById(id);
        if (!el) return;

        // Restore element-specific properties
        if (id === 'envelope-1') {
          if (elementState.attack)
            el.setAttribute('attack', elementState.attack);
          if (elementState.release)
            el.setAttribute('release', elementState.release);
        } else if (
          id === 'loop-controller-1' &&
          elementState.loopStart !== undefined &&
          elementState.loopEnd !== undefined
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
const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const debouncedSaveState = debounce(saveState, 300);
