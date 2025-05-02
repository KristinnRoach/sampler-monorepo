import { useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import SamplerNode from './SamplerNode';
import KeyboardNode from './KeyboardNode';
import AnalyzerNode from './AnalyzerNode';

// Interface for node methods stored in refs
interface NodeMethods {
  playNote?: (midiNote: number, velocity?: number) => void;
  stopNote?: (midiNote: number) => void;
  getSampler?: () => any;
  noteOn?: (midiNote: number, velocity?: number) => void;
  noteOff?: (midiNote: number) => void;
  getInput?: () => AudioNode;
}

// Define the custom node types
const nodeTypes: NodeTypes = {
  samplerNode: SamplerNode,
  keyboardNode: KeyboardNode,
  analyzerNode: AnalyzerNode,
};

// Interface for KeyboardNode data
interface KeyboardNodeData {
  label: string;
  onNoteOn?: (midiNote: number, velocity?: number) => void;
  onNoteOff?: (midiNote: number) => void;
  registerMethods?: (methods: any) => void;
  isEnabled?: boolean;
}

// Interface for SamplerNode data
interface SamplerNodeData {
  label: string;
  onNoteOn?: (midiNote: number) => void;
  onNoteOff?: (midiNote: number) => void;
  onSampleLoaded?: (sampler: any) => void;
  registerMethods?: (methods: any) => void;
}

// Interface for AnalyzerNode data
interface AnalyzerNodeData {
  label: string;
  registerMethods?: (methods: any) => void;
}

// Type for our custom nodes
type CustomNode = Node<KeyboardNodeData | SamplerNodeData | AnalyzerNodeData>;

// Initial nodes setup
const initialNodes: CustomNode[] = [
  {
    id: 'keyboard-1',
    type: 'keyboardNode',
    position: { x: 250, y: 50 },
    data: {
      label: 'Keyboard',
      onNoteOn: (note: number) => console.log('Keyboard note on:', note),
      onNoteOff: (note: number) => console.log('Keyboard note off:', note),
    },
  },
  {
    id: 'sampler-1',
    type: 'samplerNode',
    position: { x: 250, y: 250 },
    data: {
      label: 'Sampler',
      onNoteOn: (note: number) => console.log('Sampler note on:', note),
      onNoteOff: (note: number) => console.log('Sampler note off:', note),
      onSampleLoaded: (sampler) => console.log('Sample loaded', sampler),
    },
  },
  {
    id: 'analyzer-1',
    type: 'analyzerNode',
    position: { x: 250, y: 450 },
    data: {
      label: 'Analyzer',
    },
  },
];

// Initial connections
const initialEdges: Edge[] = [
  {
    id: 'edge-keyboard-to-sampler',
    source: 'keyboard-1',
    sourceHandle: 'note-out',
    target: 'sampler-1',
    targetHandle: 'note-in',
    animated: true,
  },
  {
    id: 'edge-sampler-to-analyzer',
    source: 'sampler-1',
    sourceHandle: 'audio-out',
    target: 'analyzer-1',
    targetHandle: 'audio-in',
    animated: true,
  },
];

function SamplerFlowExample() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeRefsMap = useRef<Map<string, NodeMethods>>(new Map());

  // Register methods from nodes
  const onNodeInit = useCallback((nodeId: string, methods: NodeMethods) => {
    nodeRefsMap.current.set(nodeId, methods);
  }, []);

  // Handle connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdge = addEdge(connection, eds);

        if (
          connection.sourceHandle === 'note-out' &&
          connection.targetHandle === 'note-in'
        ) {
          console.log('Setting up MIDI connection');

          const targetMethods = nodeRefsMap.current.get(connection.target!);

          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === connection.source) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    onNoteOn: (note: number, velocity?: number) => {
                      console.log(
                        'Keyboard -> Sampler noteOn:',
                        note,
                        velocity
                      );
                      targetMethods?.playNote?.(note, velocity, {});
                    },
                    onNoteOff: (note: number) => {
                      console.log('Keyboard -> Sampler noteOff:', note);
                      targetMethods?.stopNote?.(note);
                    },
                  },
                };
              }
              return node;
            })
          );
        }

        return newEdge;
      });
    },
    [setEdges, setNodes]
  );

  // Update node data to include the register method
  const updatedNodes = useMemo(() => {
    return nodes.map((node) => {
      return {
        ...node,
        data: {
          ...node.data,
          registerMethods: (methods: NodeMethods) =>
            onNodeInit(node.id, methods),
        },
      };
    });
  }, [nodes, onNodeInit]);

  // For better performance, nodeTypes should be memoized
  const reactFlowNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div style={{ width: '100%', height: '90vh' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
        <h2>Sampler Flow Example</h2>
        <p>
          Connect the Keyboard node to the Sampler node to play notes. The
          Sampler is connected to the Analyzer to visualize the audio output.
        </p>
      </div>
      <ReactFlow
        nodes={updatedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={reactFlowNodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default SamplerFlowExample;
