import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';

import { ensureAudioCtx } from '@repo/audiolib';
// getAudioContext();

export default function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect: OnConnect = useCallback(
    (connection) => {
      setEdges((edges) => addEdge(connection, edges));
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      if (sourceNode && targetNode) {
        // sourceNode.data.outlet.connect(targetNode.data.inlet);
        console.log(
          `TODO: Connect ${sourceNode.type} node ${sourceNode.id} to ${targetNode.type} node ${targetNode.id}`
        );
      } else {
        console.error(
          `Could not find source or target node for connection: ${connection}`
        );
      }
    },
    [setEdges]
  );

  const [ctx, setCtx] = useState<AudioContext | null>(null);
  // const [ctxState, setCtxState] = useState<AudioContextState | null>(null); // testa first í audiolib

  useEffect(() => {
    const audioCtx = async () => await ensureAudioCtx();
    audioCtx().then((audioCtx) => {
      if (!audioCtx) {
        throw new Error('Audio context not available');
      } else {
        console.log('Audio context available');
        setCtx(audioCtx);
      }
    });
  }, []);

  useEffect(() => {
    if (!ctx) console.warn('Audio context not available in flow App');
    if (ctx && ctx.state !== 'running') {
      console.log('Audio context is suspended, waiting for user interaction');
      document.addEventListener('click', () => {
        ctx.resume().then(() => {
          console.log('Audio context resumed');
        });
      });
    }
  }, [ctx]);

  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      edges={edges}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}
