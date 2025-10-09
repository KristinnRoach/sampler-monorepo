// components/Sidebar.tsx
import { Component, JSX, createEffect, onCleanup } from 'solid-js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: JSX.Element;
}

const Sidebar: Component<SidebarProps> = (props) => {
  // Handle Escape key to close sidebar
  createEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && props.isOpen) {
        props.onClose();
      }
    };

    if (props.isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      onCleanup(() => {
        document.removeEventListener('keydown', handleEscapeKey);
      });
    }
  });

  const isOpen = () => props.isOpen;

  return (
    <div class={`sidebar ${isOpen() ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div class='sidebar-header'>
        <h3>{props.title || 'Sidebar'}</h3>
        <button class='close-button' onclick={props.onClose}>
          ×
        </button>
      </div>
      <div class='sidebar-content'>{props.children}</div>
    </div>
  );
};

export default Sidebar;
