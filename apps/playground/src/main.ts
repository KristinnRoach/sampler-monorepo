import { defineSampler } from '@repo/audio-components';

defineSampler(); // Define all sampler components

document.addEventListener('DOMContentLoaded', () => {
  console.debug('playground initialized');

  // Keyboard visual toggle functionality
  const toggleButton = document.getElementById(
    'toggle-keyboard-visual'
  ) as HTMLButtonElement;

  const computerKeyVisEl = document.getElementById(
    'keyboard-visual'
  ) as HTMLElement;
  let isVisible = false;

  const pianoKeyVisEl = document.getElementById(
    'piano-keyboard'
  ) as HTMLElement;
  let currKeys: 'computer' | 'piano' = 'piano';

  if (toggleButton && computerKeyVisEl) {
    toggleButton.addEventListener('click', () => {
      currKeys = currKeys === 'piano' ? 'computer' : 'piano';

      if (currKeys === 'computer') {
        pianoKeyVisEl.classList.remove('visible');
        pianoKeyVisEl.classList.add('hidden');
        computerKeyVisEl.classList.remove('hidden');
        computerKeyVisEl.classList.add('visible');
        toggleButton.textContent = 'Piano Keys';
      } else {
        pianoKeyVisEl.classList.remove('hidden');
        pianoKeyVisEl.classList.add('visible');
        computerKeyVisEl.classList.remove('visible');
        computerKeyVisEl.classList.add('hidden');
        toggleButton.textContent = 'Computer Keys';
      }
    });
  }
});
