import {
  createSingleSamplePlayer,
  type SingleSamplePlayer,
  type SingleSamplePlayerProps,
} from '@repo/audiolib';

const defaultPlayerProps: SingleSamplePlayerProps = {
  name: 'Sample Player',
  addInputHandlers: true,
  polyphony: 8,
};

let defaultPlayer: SingleSamplePlayer | undefined;

async function getDefaultPlayer() {
  if (!defaultPlayer) {
    console.warn('defaultPlayerPROPS: ', defaultPlayerProps);
    defaultPlayer = await createSingleSamplePlayer(defaultPlayerProps);
  }
  return defaultPlayer;
}

export default getDefaultPlayer;
