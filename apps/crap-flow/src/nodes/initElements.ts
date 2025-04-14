import type { Node } from '@xyflow/react';
// import * as IDs from '../store';

export const initialNodes: Node[] = [
  {
    id: 'first', //IDs.createNodeId('sample-player'),
    type: 'sample-player',
    position: { x: 0, y: 0 },
    data: { label: 'player' },
  },
];
