import { defineKarplusSynth, defineSampler } from '@repo/audio-components';
import { createAudiolib } from '@repo/audio-components';

export const initAudiolib = async () => {
  return await createAudiolib({ autoInit: true })
    .then(() => {
      defineSampler('sampler-element');
      defineKarplusSynth('karplus-synth-element');
    })
    .catch((e) => console.error(`main.js, Create audiolib error: ${e}`));
};
