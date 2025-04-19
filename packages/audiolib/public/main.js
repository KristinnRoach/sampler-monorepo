import { audiolib } from '../dist/index.js';

let lib;

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start';
  document.body.appendChild(startBtn);

  startBtn.addEventListener(
    'click',
    async () => {
      lib = audiolib;
      await lib.init();
      console.debug({ lib });
    },
    { once: true }
  );

  const playDefaultBtn = document.createElement('button');
  playDefaultBtn.textContent = 'Play using lib defaults';
  document.body.appendChild(playDefaultBtn);

  playDefaultBtn.addEventListener('click', async () => {
    const srcNode = await lib.createSourcePlayer();
    console.debug({ srcNode });

    srcNode.play();
  });
});
