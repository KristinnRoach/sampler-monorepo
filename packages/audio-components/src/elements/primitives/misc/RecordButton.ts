import van from '@repo/vanjs-core';
import { define } from '@repo/vanjs-core/element';

const { button, span } = van.tags;

define(
  'record-button',
  ({ attr, mount, $this }) => {
    // Create reactive state from attributes
    const activeAttr = attr('active', '');
    const disabledAttr = attr('disabled', '');
    const labelOn = attr('label-on', 'Stop');
    const labelOff = attr('label-off', 'Record');

    // Simply derive states directly from attributes
    const isActive = van.derive(
      () => activeAttr.val !== null && activeAttr.val !== ''
    );
    const isDisabled = van.derive(
      () => disabledAttr.val !== null && disabledAttr.val !== ''
    );

    // Set up event handler
    const handleClick = (event: Event) => {
      event.preventDefault();

      if (isDisabled.val) return;

      // Simply toggle the attribute directly
      const currentlyActive = $this.hasAttribute('active');
      if (!currentlyActive) {
        $this.setAttribute('active', '');
      } else {
        $this.removeAttribute('active');
      }

      // Dispatch custom event
      const detail = { active: !currentlyActive };
      console.log('Dispatching toggle event with detail:', detail);
      $this.dispatchEvent(
        new CustomEvent('toggle', {
          bubbles: true,
          composed: true,
          detail,
        })
      );
    };

    // Create button with dynamic content
    return button(
      {
        class: () => (isActive.val ? 'active record-button' : 'record-button'),
        disabled: isDisabled,
        onclick: handleClick,
      },
      span({
        class: 'record-icon',
        'aria-hidden': 'true',
      }),
      // Dynamic label based on state
      () => (isActive.val ? labelOn.val : labelOff.val)
    );
  },
  false // Use Light DOM instead of Shadow DOM
);

// Add TypeScript type definitions for HTML element
declare global {
  interface HTMLElementTagNameMap {
    'record-button': HTMLElement;
  }
}
