if ('serviceWorker' in navigator) {
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register('./sw.js', { scope: './' })
    .then((registration) => {
      registration.update();

      // ponytail: installed PWAs can stay open for days without a navigation,
      // so re-check periodically and whenever the app regains focus.
      setInterval(() => registration.update(), 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update();
      });
    });
}
