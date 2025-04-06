import {
  createSingleSamplePlayer,
  type SingleSamplePlayer,
  type SingleSamplePlayerProps,
} from '@repo/audiolib';

const defaultPlayerProps: SingleSamplePlayerProps = {
  name: 'Sample Player',
  addInputHandlers: false,
  polyphony: 8,
};

let defaultPlayer: SingleSamplePlayer | undefined;

async function getDefaultPlayer() {
  if (!defaultPlayer) {
    defaultPlayer = await createSingleSamplePlayer(defaultPlayerProps);
  }
  return defaultPlayer;
}

export default getDefaultPlayer;
