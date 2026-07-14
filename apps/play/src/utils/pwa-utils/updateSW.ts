import { registerSW } from 'virtual:pwa-register';

const intervalMS = 60 * 60 * 1000;

// registerType: 'autoUpdate' -> workbox-window sends SKIP_WAITING and
// reloads only once the new worker has actually activated.
registerSW({
  immediate: true,
  onRegistered(registration) {
    if (!registration) return;
    setInterval(() => registration.update(), intervalMS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update();
    });
  },
});
