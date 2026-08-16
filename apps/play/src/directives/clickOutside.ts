import { Accessor, onCleanup } from 'solid-js';

export type ClickOutsideHandler = (event: PointerEvent) => void;

export const clickOutside = (
  element: HTMLElement,
  handler: Accessor<ClickOutsideHandler>,
) => {
  const onPointerDown = (event: PointerEvent) => {
    if (!event.composedPath().includes(element)) handler()(event);
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  onCleanup(() =>
    document.removeEventListener('pointerdown', onPointerDown, true),
  );
};
