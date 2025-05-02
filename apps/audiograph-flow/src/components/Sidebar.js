import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
const Sidebar = () => {
    const onDragStart = useCallback((event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, []);
    return (_jsxs("div", { className: "sidebar", children: [_jsx("div", { className: "description", children: "Drag nodes to the canvas" }), _jsx("div", { className: "dndnode", onDragStart: (event) => onDragStart(event, 'samplerNode'), draggable: true, children: "Sampler" })] }));
};
export default Sidebar;
