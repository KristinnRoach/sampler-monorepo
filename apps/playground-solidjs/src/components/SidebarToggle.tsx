// components/SidebarToggle.tsx
import { Component } from 'solid-js';

interface SidebarToggleProps {
  onclick: () => void;
  isOpen?: boolean;
  class?: string;
}

const SidebarToggle: Component<SidebarToggleProps> = (props) => {
  return (
    <button
      class={`${props.class ? props.class : ''} sidebar-toggle ${props.isOpen ? 'open' : ''}`}
      onclick={props.onclick}
      title='View saved samples'
    >
      <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z' />
      </svg>
    </button>
  );
};

export default SidebarToggle;
