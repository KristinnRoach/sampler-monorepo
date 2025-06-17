// ExpandableHeader.ts
import van from '@repo/vanjs-core';
import type { State } from '@repo/vanjs-core';

const { div } = van.tags;

export const ExpandableHeader = (
  title: string,
  expanded: State<string>,
  children?: any
) => {
  const headerStyle =
    'display: flex; flex-direction: row; column-gap: 1rem; padding-right: 3rem;';

  const clickableStyle = 'cursor: pointer;';

  return div(
    { class: 'expandable-header' },
    div(
      { style: headerStyle },
      // Only the arrow + title are clickable
      div(
        {
          style: clickableStyle,
          onclick: () =>
            (expanded.val = expanded.val === 'true' ? 'false' : 'true'),
        },
        () => `${expanded.val === 'true' ? '▼' : '▶'} ${title}`
      ),
      // Buttons are separate and not clickable for expand/collapse
      children
    )
  );
};
