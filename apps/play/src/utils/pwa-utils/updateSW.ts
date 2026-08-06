import { registerSW } from 'virtual:pwa-register';

const intervalMS = 60 * 60 * 1000;

// registerType: 'autoUpdate' -> workbox-window sends SKIP_WAITING and
// reloads only once the new worker has actually activated.
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;

    const check = async () => {
      if (registration.installing || !navigator.onLine) return;
      // ponytail: no-store fetch first so a cached sw.js can't mask an update
      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: { cache: 'no-store', 'cache-control': 'no-cache' },
      }).catch(() => null);
      if (resp?.status === 200) await registration.update().catch(() => {});
    };

    setInterval(check, intervalMS);
    // pageshow covers iOS standalone resume from bfcache, where
    // visibilitychange alone is unreliable.
    window.addEventListener('pageshow', check);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  },
});
