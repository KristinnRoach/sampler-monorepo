import { qsa } from './dom-utils';

export const toggleRow = (rowNumber: number) => {
  const rowSelectors = [
    '.env-group, .sample-group, .space-group',
    '.filter-group,  .feedback-group',
    '.loop-group, .trim-group, .misc-group, .amp-lfo-group, .pitch-lfo-group',
    '.toggle-group, .keyboard-group',
  ];

  const selector = rowSelectors[rowNumber - 1];
  if (!selector) return;
  const groups = qsa(selector);

  if (groups.length === 0) return;
  const allCollapsed = Array.from(groups).every((g) =>
    g.classList.contains('collapsed')
  );

  groups.forEach((group) => group.classList.toggle('collapsed', !allCollapsed));
};

export function addExpandCollapseListeners() {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as EventTarget | null;
    if (!(target instanceof Element)) return;

    // Toggle a single group's collapse by legend
    const legend = target.closest('.expandable-legend');
    if (legend) {
      legend.closest('.control-group')?.classList.toggle('collapsed');
    }

    // Toggle an entire row
    const rowIcon = target.closest('.row-collapse-icon');
    if (rowIcon) {
      const rowAttr = rowIcon.getAttribute('data-row');
      const row = Number.parseInt(rowAttr ?? '', 10);
      if (Number.isFinite(row) && row > 0) {
        toggleRow(row);
      }
    }
  });
}
