// components/Button.tsx
import { Component } from 'solid-js';

interface BaseButtonProps {
  title?: string;
  onclick: () => void;
  class?: string;
  conditionalClass?: { condition: boolean; className: string }[];
  children?: any;
}

const BaseButton: Component<BaseButtonProps> = (props) => {
  return (
    <button
      class={`base-button ${props.class ? props.class : ''} ${
        props.conditionalClass
          ? props.conditionalClass
              .filter((c) => c.condition)
              .map((c) => c.className)
              .join(' ')
          : ''
      }`}
      onclick={props.onclick}
      title={props.title ? props.title : 'Button'}
    >
      {props.children}
    </button>
  );
};

export default BaseButton;
