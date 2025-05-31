import van from '@repo/vanjs-core';
import { toStyleStr, stateOf } from './comp-utils';

/** Usage
  // van.add(
  //   document.body,
  //   Toggle({
  //     on: true,
  //     size: 2,
  //     onColor: '#4CAF50',
  //   })
  // );
 */

const { input, label, span } = van.tags;

export const Toggle = ({
  on = false,
  size = 1,
  cursor = 'pointer',
  offColor = '#ccc',
  onColor = '#2196F3',
  circleColor = 'white',
  toggleClass = '',
  toggleStyleOverrides = {},
  sliderClass = '',
  sliderStyleOverrides = {},
  circleClass = '',
  circleStyleOverrides = {},
  circleWhenOnStyleOverrides = {},
}) => {
  const onState = stateOf(on);
  const toggleStylesStr = toStyleStr({
    position: 'relative',
    display: 'inline-block',
    width: 1.76 * size + 'rem',
    height: size + 'rem',
    cursor,
    ...toggleStyleOverrides,
  });
  const inputStylesStr = toStyleStr({
    opacity: 0,
    width: 0,
    height: 0,
    position: 'absolute',
    'z-index': 10000, // Ensures the toggle clickable
  });
  const sliderStylesStr = toStyleStr({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: '.4s',
    'border-radius': size + 'rem',
    ...sliderStyleOverrides,
  });
  const circleStylesStr = toStyleStr({
    position: 'absolute',
    height: 0.76 * size + 'rem',
    width: 0.76 * size + 'rem',
    left: 0.12 * size + 'rem',
    bottom: 0.12 * size + 'rem',
    'background-color': circleColor,
    transition: '.4s',
    'border-radius': '50%',
    ...circleStyleOverrides,
  });
  const circleStylesWhenOnStr = toStyleStr({
    transform: `translateX(${0.76 * size}rem)`,
    ...circleWhenOnStyleOverrides,
  });
  return label(
    { class: toggleClass, style: toggleStylesStr },
    input({
      type: 'checkbox',
      style: inputStylesStr,
      checked: onState,
      oninput: (e) => (onState.val = e.target.checked),
    }),
    span(
      {
        class: sliderClass,
        style: () =>
          `${sliderStylesStr}; background-color: ${onState.val ? onColor : offColor};`,
      },
      span({
        class: circleClass,
        style: () =>
          circleStylesStr + (onState.val ? circleStylesWhenOnStr : ''),
      })
    )
  );
};
