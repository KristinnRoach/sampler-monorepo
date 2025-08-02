import van from '@repo/vanjs-core';
import { toStyleStr } from './comp-utils';

let tabsId = 0;

export const Tabs = (
  {
    activeTab,
    resultClass = '',
    style = '',
    tabButtonRowColor = '#f1f1f1',
    tabButtonBorderStyle = '1px solid #000',
    tabButtonHoverColor = '#ddd',
    tabButtonActiveColor = '#ccc',
    transitionSec = 0.3,
    tabButtonRowClass = '',
    tabButtonRowStyleOverrides = {},
    tabButtonClass = '',
    tabButtonStyleOverrides = {},
    tabContentClass = '',
    tabContentStyleOverrides = {},
  },
  contents
) => {
  const activeTabState = activeTab ?? van.state(Object.keys(contents)[0]);
  const tabButtonRowStylesStr = toStyleStr({
    overflow: 'hidden',
    'background-color': tabButtonRowColor,
    ...tabButtonRowStyleOverrides,
  });
  const tabButtonStylesStr = toStyleStr({
    float: 'left',
    border: 'none',
    'border-right': tabButtonBorderStyle,
    outline: 'none',
    cursor: 'pointer',
    padding: '8px 16px',
    transition: `background-color ${transitionSec}s`,
    ...tabButtonStyleOverrides,
  });
  const tabContentStylesStr = toStyleStr({
    padding: '6px 12px',
    'border-top': 'none',
    ...tabContentStyleOverrides,
  });
  const id = 'vanui-tabs-' + ++tabsId;
  document.head.appendChild(
    van.tags['style'](`#${id} .vanui-tab-button { background-color: inherit }
#${id} .vanui-tab-button:hover { background-color: ${tabButtonHoverColor} }
#${id} .vanui-tab-button.active { background-color: ${tabButtonActiveColor} }`)
  );
  return div(
    { id, class: resultClass, style },
    div(
      { class: tabButtonRowClass, style: tabButtonRowStylesStr },
      Object.keys(contents).map((k) =>
        button(
          {
            class: () =>
              ['vanui-tab-button']
                .concat(
                  tabButtonClass ? tabButtonClass : [],
                  k === activeTabState.val ? 'active' : []
                )
                .join(' '),
            style: tabButtonStylesStr,
            onclick: () => (activeTabState.val = k),
          },
          k
        )
      )
    ),
    Object.entries(contents).map(([k, v]) =>
      div(
        {
          class: tabContentClass,
          style: () =>
            `display: ${k === activeTabState.val ? 'block' : 'none'}; ${tabContentStylesStr}`,
        },
        v
      )
    )
  );
};
