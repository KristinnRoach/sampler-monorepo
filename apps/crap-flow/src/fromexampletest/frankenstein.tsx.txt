import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Panel,
  // useReactFlow,
  // Node,
  // Edge,
  // NodeChange,
  // EdgeChange,
  // Connection,
  // OnNodesChange,
  // OnEdgesChange,
  // OnConnect,
  // Controls,
  // OnNodeDrag,
} from '@xyflow/react';
// import { MouseEvent, useCallback } from 'react';

import { shallow } from 'zustand/shallow';
import { useStore } from '../store';
import Osc from '../nodes/basicNodes/Osc';
import Amp from '../nodes/basicNodes/Amp';
import Out from '../nodes/basicNodes/Out';

import { StoreState } from '../store';

const nodeTypes = {
  osc: Osc,
  amp: Amp,
  out: Out,
};

const selector = (store: StoreState) => ({
  nodes: store.nodes,
  edges: store.edges,
  onNodesChange: store.onNodesChange,
  onNodesDelete: store.onNodesDelete,
  onEdgesChange: store.onEdgesChange,
  onEdgesDelete: store.onEdgesDelete,
  addEdge: store.addEdge,
  addOsc: () => store.createNode('osc', 0, 0),
  addAmp: () => store.createNode('amp', 0, 0),
});

export function AudiolibTest() {
  // const {
  //   addNodes,
  //   setNodes,
  //   getNodes,
  //   setEdges,
  //   getEdges,
  //   deleteElements,
  //   updateNodeData,
  //   toObject,
  //   setViewport,
  //   fitView,
  // } = useReactFlow();

  const store = useStore(selector, shallow);
  return (
    // @ts-ignore
    <ReactFlow
      nodeTypes={nodeTypes}
      nodes={store.nodes}
      edges={store.edges}
      onNodesChange={store.onNodesChange}
      onNodesDelete={store.onNodesDelete}
      onEdgesChange={store.onEdgesChange}
      onEdgesDelete={store.onEdgesDelete}
      onConnect={store.addEdge}
      fitView
    >
      <Panel className={'space-x-4'} position='top-right'>
        <button
          className={'px-2 py-1 rounded bg-white shadow'}
          onClick={store.addOsc}
        >
          Add Osc
        </button>
        <button
          className={'px-2 py-1 rounded bg-white shadow'}
          onClick={store.addAmp}
        >
          Add Amp
        </button>
      </Panel>
      <Background />
    </ReactFlow>
  );
}

export function App() {
  return (
    <ReactFlowProvider>
      <AudiolibTest />
    </ReactFlowProvider>
  );
}

// import React from 'react';
// import ReactFlow, {
//   ReactFlowProvider,
//   Background,
//   Panel,
//   useReactFlow,
// } from 'reactflow';
// import { shallow } from 'zustand/shallow';
// import { useStore } from './store';
// import Osc from './Osc';
// import Amp from './Amp';
// import Out from './Out';

// import 'reactflow/dist/style.css';

// const nodeTypes = {
//   osc: Osc,
//   amp: Amp,
//   out: Out,
// };

// const selector = (store) => ({
//   nodes: store.nodes,
//   edges: store.edges,
//   onNodesChange: store.onNodesChange,
//   onNodesDelete: store.onNodesDelete,
//   onEdgesChange: store.onEdgesChange,
//   onEdgesDelete: store.onEdgesDelete,
//   addEdge: store.addEdge,
//   addOsc: () => store.createNode('osc'),
//   addAmp: () => store.createNode('amp'),
// });

// export function AudiolibTest() {
//   const store = useStore(selector, shallow);
//   return (
//     <ReactFlow
//       nodeTypes={nodeTypes}
//       nodes={store.nodes}
//       edges={store.edges}
//       onNodesChange={store.onNodesChange}
//       onNodesDelete={store.onNodesDelete}
//       onEdgesChange={store.onEdgesChange}
//       onEdgesDelete={store.onEdgesDelete}
//       onConnect={store.addEdge}
//       fitView
//     >
//       <Panel className={'space-x-4'} position='top-right'>
//         <button
//           className={'px-2 py-1 rounded bg-white shadow'}
//           onClick={store.addOsc}
//         >
//           Add Osc
//         </button>
//         <button
//           className={'px-2 py-1 rounded bg-white shadow'}
//           onClick={store.addAmp}
//         >
//           Add Amp
//         </button>
//       </Panel>
//       <Background />
//     </ReactFlow>
//   );
// }

// export default function App() {
//   return (
//     <ReactFlowProvider>
//       <AudiolibTest />
//     </ReactFlowProvider>
//   );
// }
