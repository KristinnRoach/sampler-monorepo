import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { ReactFlowProvider, addEdge, useNodesState, useEdgesState, Controls, Background, } from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from './Sidebar';
import SamplerNode from './nodes/SamplerNode';
// Define custom node types
const nodeTypes = {
    samplerNode: SamplerNode,
};
const Canvas = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [audioInitialized, setAudioInitialized] = useState(false);
    // Initialize audio context
    useEffect(() => {
        // We'll handle audio initialization in the SamplerNode component
        // This avoids potential race conditions with multiple initializations
        setAudioInitialized(true);
    }, []);
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);
    const onDrop = useCallback((event) => {
        event.preventDefault();
        if (!reactFlowWrapper.current || !reactFlowInstance)
            return;
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow');
        // Check if the dropped element is valid
        if (typeof type === 'undefined' || !type) {
            return;
        }
        const position = reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        });
        const newNode = {
            id: `${type}-${nodes.length + 1}`,
            type,
            position,
            data: { label: `${type} node` },
        };
        setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, nodes, setNodes]);
    return (_jsxs("div", { className: 'flow-canvas', children: [_jsx(Sidebar, {}), _jsx("div", { className: 'flow-area', ref: reactFlowWrapper, children: _jsx(ReactFlowProvider, { children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, onDrop: onDrop, onDragOver: onDragOver, onInit: setReactFlowInstance, nodeTypes: nodeTypes, fitView: true, children: [_jsx(Controls, {}), _jsx(Background, {})] }) }) })] }));
};
export default Canvas;
