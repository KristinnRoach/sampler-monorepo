/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import App from './App';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?'
  );
}

render(() => <App />, root);

// Initialize audio connections after components are mounted
async function initializeAudio() {
  try {
    const sample = document.getElementById('sample1');
    const osc = document.getElementById('osc1');
    const filter = document.getElementById('filter1');
    const master = document.getElementById('master');

    await Promise.all([
      sample.waitForInit(),
      osc.waitForInit(),
      filter.waitForInit(),
      master.waitForInit(),
    ]);

    console.log('Connecting audio nodes...');
    await sample.connect(filter);
    await osc.connect(filter);
    await filter.connect(master);
    console.log('Audio chain created successfully!');
  } catch (error) {
    console.error('Error initializing audio:', error);
  }
}

// Initialize after a short delay to ensure components are mounted
setTimeout(initializeAudio, 100);
