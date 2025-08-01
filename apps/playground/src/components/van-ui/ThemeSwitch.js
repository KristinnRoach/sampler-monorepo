import { define } from '@repo/vanjs-core';

export const ThemeSwitch = define('theme-switch', () => {
  const mode = localStorage.getItem('colorScheme');
  const darkMode = van.state(
    (mode && mode === 'dark') ??
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );
  van.derive(() => {
    const mode = darkMode.val ? 'dark' : 'light';
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', mode);
    localStorage.setItem('colorScheme', mode);
  });
  return [
    button(
      {
        style: 'font-size: 1.2em',
        onclick: () => (darkMode.val = !darkMode.val),
      },
      () => (darkMode.val ? '☀️' : '😎')
    ),
    () => ` Toggle ${darkMode.val ? 'light' : 'dark'} mode`,
  ];
});
