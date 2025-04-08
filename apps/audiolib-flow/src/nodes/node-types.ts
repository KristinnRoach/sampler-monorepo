import type { Node, BuiltInNode } from '@xyflow/react';
import type { SingleSamplePlayerProps } from '@repo/audiolib';

/* NODE PROPS (props === data) */

export type SingleSamplerProps = Node<SingleSamplePlayerProps>;

/* NODE TYPES */

export type SSamplerType = Node<SingleSamplerProps, 'sample-player'>;
export type SinkNode = Node<{ label: 'output' }, 'sink'>;
export type NodeFactoryNode = Node<{}, 'node-factory'>;
export type FlowNativeNode = BuiltInNode;

export type AppNode = Node;

// export type AppNode =
//   | FlowNativeNode
//   | SSamplerType
//   | NodeFactoryNode
//   | SinkNode;
