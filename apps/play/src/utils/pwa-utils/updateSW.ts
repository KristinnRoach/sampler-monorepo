// updateSW.ts
import { registerSW } from 'virtual:pwa-register';

export const updateSW = registerSW({
  onNeedRefresh() {
    const shouldUpdate = confirm('New update available. Refresh now?');
    if (shouldUpdate) {
      updateSW();
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use');
  },
});

if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
