import type { NodeTypes } from '@xyflow/react';

import PositionLoggerNode from './PositionLoggerNode';
import { AppNode } from './types';
import SamplePlayerNode from './SamplePlayerNode';

// import {
//   createSingleSamplePlayer,
//   type SingleSamplePlayer,
//   type SingleSamplePlayerProps,
// } from '@repo/audiolib';

// const getArrBuff = async (path = '/sus.wav') => {
//   const response = await fetch(path);
//   if (!response.ok) {
//     throw new Error(`Failed to fetch audio file: ${response.statusText}`);
//   }
//   const arrayBuffer = await response.arrayBuffer();

//   return arrayBuffer;
// };

// let defaultPlayer: SingleSamplePlayer | undefined;

// const playerDefaultData: SingleSamplePlayerProps = async () => {
//   const arrayBuffer = await getArrBuff();
//   return {
//   name: 'Sample Player',
//   addInputHandlers: true,
//   sampleBuffer: arrayBuffer,
//   polyphony: 8,
// };

// async function getDefaultPlayer() {
//   if (!defaultPlayer) {
//     console.warn('defaultPlayerPROPS: ', playerDefaultData);
//     defaultPlayer = await createSingleSamplePlayer(playerDefaultData);
//   }
//   return defaultPlayer;
// }

export const initialNodes: AppNode[] = [
  {
    id: 'a',
    type: 'sample-player',
    position: { x: 0, y: 0 },
    data: { name: 'Default Sampler' },
  },
  {
    id: 'b',
    type: 'position-logger',
    position: { x: -100, y: 100 },
    data: { label: 'drag me!' },
  },
  {
    id: 'c',
    type: 'sample-player',
    position: { x: 100, y: 100 },
    data: { name: 'Second Sampler' },
  },
  {
    id: 'd',
    type: 'output',
    position: { x: 0, y: 200 },
    data: { label: 'Output Node' },
  },
];

export const nodeTypes = {
  'position-logger': PositionLoggerNode,
  'sample-player': SamplePlayerNode,
} satisfies NodeTypes;
