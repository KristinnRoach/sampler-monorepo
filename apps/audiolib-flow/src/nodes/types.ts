import type { Node, BuiltInNode } from '@xyflow/react';
import type { SingleSamplePlayerProps } from '@repo/audiolib';

export type PositionLoggerNode = Node<{ label: string }, 'position-logger'>;
export type AppNode = BuiltInNode | PositionLoggerNode | SamplePlayerNode;

export type SamplePlayerNode = Node<SingleSamplePlayerProps, 'sample-player'>;
