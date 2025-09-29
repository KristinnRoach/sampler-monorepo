import { createSignal, onMount } from 'solid-js';

const themes = ['light', 'dark', 'green'] as const;
type Theme = (typeof themes)[number];

/**
 * Render a theme selector dropdown that initializes the theme from localStorage or system preference and persists user changes.
 *
 * The component sets `data-theme` on document.documentElement and saves the chosen theme to localStorage; if no saved theme exists it falls back to the system preference (prefers-color-scheme: light) choosing 'light' when the system prefers light, otherwise 'dark'.
 *
 * @returns A JSX element containing a select control for choosing between 'light', 'dark', and 'green'.
 */
export default function ThemeSelect() {
  const [theme, setTheme] = createSignal<Theme>('light');

  // Load saved theme or system preference on mount
  onMount(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved && themes.includes(saved)) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // Default to dark mode, unless user prefers light
      const prefersLight = window.matchMedia(
        '(prefers-color-scheme: light)'
      ).matches;
      const initialTheme = prefersLight ? 'light' : 'dark';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  });

  function changeTheme(newTheme: Theme) {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  return (
    <div>
      <select
        value={theme()}
        onInput={(e) => changeTheme(e.currentTarget.value as Theme)}
        aria-label='Select theme'
      >
        {themes.map((t) => (
          <option value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * A button component that toggles the document theme between light and dark and persists the user's choice.
 *
 * The component initializes the theme from localStorage if present; otherwise it uses `props.defaultTheme`
 * ('dark' | 'light' | 'system') or the system preference. Toggling updates the `data-theme` attribute on
 * document.documentElement and writes the chosen theme to localStorage.
 *
 * @param props.class - Optional CSS class(es) appended to the button's base "theme-toggle" class.
 * @param props.defaultTheme - Initial theme when no saved preference exists. Use 'system' to follow the OS preference.
 * @returns The theme toggle button element that reflects and switches between 'dark' and 'light' modes.
 */
export function ThemeToggle(props: {
  class?: string;
  defaultTheme?: 'dark' | 'light' | 'system';
}) {
  const [isDark, setIsDark] = createSignal(false);

  onMount(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved && (saved === 'light' || saved === 'dark')) {
      setIsDark(saved === 'dark');
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const prefersLight = window.matchMedia(
        '(prefers-color-scheme: light)'
      ).matches;

      let initialIsDark: boolean;
      if (props.defaultTheme === 'dark') {
        initialIsDark = true;
      } else if (props.defaultTheme === 'light') {
        initialIsDark = false;
      } else {
        // 'system' or undefined - use system preference
        initialIsDark = !prefersLight;
      }

      setIsDark(initialIsDark);
      document.documentElement.setAttribute(
        'data-theme',
        initialIsDark ? 'dark' : 'light'
      );
    }
  });

  function toggleTheme() {
    const newIsDark = !isDark();
    const newTheme = newIsDark ? 'dark' : 'light';
    setIsDark(newIsDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  return (
    <button
      onClick={toggleTheme}
      class={`theme-toggle ${props.class || ''}`}
      classList={{ dark: isDark() }}
      aria-label={`Switch to ${isDark() ? 'light' : 'dark'} mode`}
    >
      {isDark() ? '🌙' : '☀️'}
    </button>
  );
}
