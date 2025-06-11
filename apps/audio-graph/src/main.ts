import './style.css';
import { createCounter, createAudioGraph } from '@repo/graph-elements';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <audio-graph id="g-1"></audio-graph>
  </div>
`;

createCounter();
createAudioGraph();

const graphEl = document.getElementById('g-1');
console.info({ ...graphEl });
// const ctx = graphEl?.getCtx

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
