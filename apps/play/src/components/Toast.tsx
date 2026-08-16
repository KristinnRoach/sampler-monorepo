import { For, createSignal, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import styles from './Toast.module.css';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastOptions {
  kind?: ToastKind;
  duration?: number;
}

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const [toasts, setToasts] = createSignal<readonly ToastItem[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const kindClasses: Record<ToastKind, string> = {
  info: styles.info,
  success: styles.success,
  error: styles.error,
};

let nextId = 0;

const dismissToast = (id: number) => {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }

  setToasts((items) => items.filter((item) => item.id !== id));
};

export const showToast = (
  message: string,
  options: ToastOptions = {},
): (() => void) => {
  const id = ++nextId;
  const duration = options.duration ?? 3000;

  setToasts((items) => [
    ...items,
    { id, message, kind: options.kind ?? 'info' },
  ]);

  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration),
    );
  }

  return () => dismissToast(id);
};

const clearToasts = () => {
  timers.forEach(clearTimeout);
  timers.clear();
  setToasts([]);
};

export const ToastViewport = () => {
  onCleanup(clearToasts);

  return (
    <Portal>
      <div
        class={styles.region}
        role='status'
        aria-live='polite'
        aria-atomic='false'
      >
        <ol class={styles.list}>
          <For each={toasts()}>
            {(toast) => (
              <li class={`${styles.toast} ${kindClasses[toast.kind]}`}>
                <span>{toast.message}</span>
                <button
                  type='button'
                  class={styles.close}
                  aria-label='Dismiss notification'
                  onClick={() => dismissToast(toast.id)}
                >
                  ×
                </button>
              </li>
            )}
          </For>
        </ol>
      </div>
    </Portal>
  );
};
