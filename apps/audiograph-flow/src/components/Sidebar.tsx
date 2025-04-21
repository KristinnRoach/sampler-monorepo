import { useCallback } from 'react';

const Sidebar = () => {
  const onDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="sidebar">
      <div className="description">Drag nodes to the canvas</div>
      <div 
        className="dndnode" 
        onDragStart={(event) => onDragStart(event, 'samplerNode')} 
        draggable
      >
        Sampler
      </div>
    </div>
  );
};

export default Sidebar;