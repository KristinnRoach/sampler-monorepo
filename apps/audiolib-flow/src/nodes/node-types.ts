// import type { Node } from '@xyflow/react';
// import type { SingleSamplePlayerProps } from '@repo/audiolib';
import type { NodeTypes } from '@xyflow/react';

import Osc from '../nodes/basicNodes/Osc';
import Amp from '../nodes/basicNodes/Amp';
import Out from '../nodes/basicNodes/Out';
import SingleSamplerNode from './SamplePlayer/SingleSamplerNode';

/* NODE TYPES */

export const appNodes = {
  osc: Osc as NodeTypes['osc'],
  amp: Amp as NodeTypes['amp'],
  out: Out as NodeTypes['out'],
  //player: SingleSamplerNode as NodeTypes['sample-player'],
  'sample-player': SingleSamplerNode as NodeTypes['sample-player'],
} satisfies NodeTypes;

/* NODE PROPS (props === data) */
// export type SingleSamplerProps = Node<SingleSamplePlayerProps>;

// import { OscNode } from './basicNodes/Osc';
// import { AmpNode } from './basicNodes/Amp';
// import { OutNode } from './basicNodes/Out';

// delete these if not needed: TOsc, TAmp, TOut

// export type SSamplerNode = Node<SingleSamplerProps, 'sample-player'>;
// export type SinkNode = Node<{ label: 'output' }, 'sink'>;
// export type FlowNativeNode = BuiltInNode;

// export type AppNode = Node;

// export type AppNode =
//   | OscNode
//   | AmpNode
//   | OutNode
//   | FlowNativeNode
//   | SSamplerNode
//   | Node;
