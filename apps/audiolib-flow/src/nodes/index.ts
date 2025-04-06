import type { NodeTypes } from '@xyflow/react';

import PositionLoggerNode from './PositionLoggerNode';
import { AppNode } from './types';
import SamplePlayerNode from './SamplePlayerNode';

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
