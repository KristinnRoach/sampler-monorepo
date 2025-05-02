import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useRef } from 'react';
import ReactFlow, { MiniMap, Controls, Background, BackgroundVariant, useNodesState, useEdgesState, addEdge, } from 'reactflow';
import 'reactflow/dist/style.css';
import SamplerNode from './SamplerNode';
import KeyboardNode from './KeyboardNode';
import AnalyzerNode from './AnalyzerNode';
// Define the custom node types
const nodeTypes = {
    samplerNode: SamplerNode,
    keyboardNode: KeyboardNode,
    analyzerNode: AnalyzerNode,
};
// Initial nodes setup
const initialNodes = [
    {
        id: 'keyboard-1',
        type: 'keyboardNode',
        position: { x: 250, y: 50 },
        data: {
            label: 'Keyboard',
            onNoteOn: (note) => console.log('Keyboard note on:', note),
            onNoteOff: (note) => console.log('Keyboard note off:', note),
        },
    },
    {
        id: 'sampler-1',
        type: 'samplerNode',
        position: { x: 250, y: 250 },
        data: {
            label: 'Sampler',
            onNoteOn: (note) => console.log('Sampler note on:', note),
            onNoteOff: (note) => console.log('Sampler note off:', note),
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
const initialEdges = [
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
    const nodeRefsMap = useRef(new Map());
    // Register methods from nodes
    const onNodeInit = useCallback((nodeId, methods) => {
        nodeRefsMap.current.set(nodeId, methods);
    }, []);
    // Handle connections between nodes
    const onConnect = useCallback((connection) => {
        setEdges((eds) => {
            const newEdge = addEdge(connection, eds);
            if (connection.sourceHandle === 'note-out' &&
                connection.targetHandle === 'note-in') {
                console.log('Setting up MIDI connection');
                const targetMethods = nodeRefsMap.current.get(connection.target);
                setNodes((nds) => nds.map((node) => {
                    if (node.id === connection.source) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                onNoteOn: (note, velocity) => {
                                    console.log('Keyboard -> Sampler noteOn:', note, velocity);
                                    targetMethods?.playNote?.(note, velocity);
                                },
                                onNoteOff: (note) => {
                                    console.log('Keyboard -> Sampler noteOff:', note);
                                    targetMethods?.stopNote?.(note);
                                },
                            },
                        };
                    }
                    return node;
                }));
            }
            return newEdge;
        });
    }, [setEdges, setNodes]);
    // Update node data to include the register method
    const updatedNodes = useMemo(() => {
        return nodes.map((node) => {
            return {
                ...node,
                data: {
                    ...node.data,
                    registerMethods: (methods) => onNodeInit(node.id, methods),
                },
            };
        });
    }, [nodes, onNodeInit]);
    // For better performance, nodeTypes should be memoized
    const reactFlowNodeTypes = useMemo(() => nodeTypes, []);
    return (_jsxs("div", { style: { width: '100%', height: '90vh' }, children: [_jsxs("div", { style: { padding: '10px', borderBottom: '1px solid #ddd' }, children: [_jsx("h2", { children: "Sampler Flow Example" }), _jsx("p", { children: "Connect the Keyboard node to the Sampler node to play notes. The Sampler is connected to the Analyzer to visualize the audio output." })] }), _jsxs(ReactFlow, { nodes: updatedNodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, nodeTypes: reactFlowNodeTypes, fitView: true, children: [_jsx(Controls, {}), _jsx(MiniMap, {}), _jsx(Background, { variant: BackgroundVariant.Dots, gap: 12, size: 1 })] })] }));
}
export default SamplerFlowExample;
