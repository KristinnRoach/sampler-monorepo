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
      // Fetch sw.js with no-store first: an HTTP-cached copy would otherwise
      // look unchanged to update() and the app would stay on the old version.
      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: { cache: 'no-store', 'cache-control': 'no-cache' },
      }).catch((err) => {
        console.warn('[pwa] sw.js check failed', err);
        return null;
      });
      if (!resp) return;
      if (resp.status !== 200) {
        console.warn('[pwa] sw.js returned', resp.status, '- update skipped');
        return;
      }
      await registration
        .update()
        .catch((err) => console.warn('[pwa] sw update failed', err));
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
