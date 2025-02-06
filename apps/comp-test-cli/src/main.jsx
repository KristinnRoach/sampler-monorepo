// apps/test-app/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize after a short delay to ensure components are mounted
setTimeout(initializeAudio, 100);
