// components/Accordion.tsx
import { Component, createSignal, createEffect, JSX, For } from 'solid-js';

export interface AccordionSection {
  id: string;
  title: string;
  content: JSX.Element;
}

interface AccordionProps {
  sections: AccordionSection[];
  openSectionId?: string;
  onSectionChange?: (id: string) => void;
}

const Accordion: Component<AccordionProps> = (props) => {
  const [openId, setOpenId] = createSignal(
    props.openSectionId || props.sections[0]?.id
  );

  // Sync openId with prop if it changes
  createEffect(() => {
    if (props.openSectionId && props.openSectionId !== openId()) {
      setOpenId(props.openSectionId);
    }
  });

  const handleToggle = (id: string) => {
    // Always call onSectionChange, even if already open
    if (id !== openId()) {
      setOpenId(id);
    }
    props.onSectionChange?.(id);
  };

  return (
    <div class='accordion'>
      <For each={props.sections}>
        {(section) => (
          <div class='accordion-section'>
            <button
              class={`accordion-header${openId() === section.id ? ' open' : ''}`}
              onClick={() => handleToggle(section.id)}
              aria-expanded={openId() === section.id}
            >
              {section.title}
            </button>
            <div
              class={`accordion-panel${openId() === section.id ? ' open' : ''}`}
              style={{ display: openId() === section.id ? 'block' : 'none' }}
            >
              {section.content}
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

export default Accordion;
