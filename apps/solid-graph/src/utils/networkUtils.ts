// src/utils/networkUtils.js
export function isOnline() {
  return navigator.onLine;
}

export function onNetworkChange(callback: (isOnline: boolean) => void): void {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
}
