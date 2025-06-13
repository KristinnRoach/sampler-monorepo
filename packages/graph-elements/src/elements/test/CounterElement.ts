import van, { type ChildDom } from '@repo/vanjs-core';
import { define } from '@repo/vanjs-core/element';
import type { ElementProps } from '@repo/vanjs-core/element';

export function createCounter() {
  define(
    'counter-element',
    ({ attr, mount, $this }: ElementProps): ChildDom => {
      // Get attributes as reactive states
      const initialCount = attr('count', '0');

      // Create local state
      const count = van.state(parseInt(initialCount.val));

      // Setup lifecycle hooks
      mount(() => {
        console.log('Counter mounted');

        // Return cleanup function (optional)
        return () => {
          console.log('Counter unmounted');
        };
      });

      // Event handlers
      const increment = () => count.val++;
      const decrement = () => count.val--;

      // Return the element structure
      return van.tags.div(
        van.tags.h2('Counter'),
        van.tags.p('Count: ', count),
        van.tags.button({ onclick: decrement }, '-'),
        van.tags.button({ onclick: increment }, '+')
      );
    }
  );
}
