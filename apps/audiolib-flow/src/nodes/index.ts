import type { NodeTypes } from '@xyflow/react';
import { AppNode } from './node-types';
import SingleSamplerNode from './SamplePlayer/SingleSamplerNode';
import * as IDs from '../store';

export const initialNodes: AppNode[] = [
  {
    id: IDs.createNodeId(),
    type: 'sink',
    position: { x: 0, y: 0 },
    data: { label: 'Node Factory' },
  },
  {
    id: IDs.createNodeId(),
    type: 'node-factory',
    position: { x: 0, y: 0 },
    data: { label: 'Node Factory' },
  },

  // {
  //   id: IDs.createNodeId(),
  //   type: 'sample-player',
  //   position: { x: 0, y: 0 },
  //   data: defaultPlayerProps,
  // },
  // {
  //   id: IDs.createNodeId(),
  //   type: 'output',
  //   position: { x: 0, y: 300 },
  //   data: { label: 'Output Node' },
  // },
];

export const nodeTypes = {
  'sample-player': SingleSamplerNode,
  // 'node-factory': NodeFactoryNode,
} satisfies NodeTypes;

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
