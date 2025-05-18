import { animate, utils, createDraggable, createSpring } from 'animejs';

// Get references to elements
const playerEl = document.getElementById('sampler1');

// Get the specific container that contains the sampler
const container = playerEl.closest('.component-container');

createDraggable('#sampler1', {
  container: container,
  containerPadding: 20,
});

// Event listeners
playerEl.addEventListener('sampler-initialized', () => {
  console.log(`playerEl.addEventListener('sampler-initialized'`);
  // connectionInfo.innerHTML = '<p>Sampler initialized</p>';
});

playerEl.addEventListener('sample-loaded', (event) => {
  console.log(`playerEl.addEventListener('sampler-loaded'`);
});

console.log('Web Audio Elements app initialized');
