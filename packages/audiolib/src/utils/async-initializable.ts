export type InitState = 'idle' | 'initializing' | 'ready' | 'failed';

export function createAsyncInit<T>() {
  let initPromise: Promise<T> | null = null;
  let state: InitState = 'idle';
  const listeners: Set<() => void> = new Set();

  const notifyListeners = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    // Main initialization wrapper
    wrapInit(
      initFn: (...args: any[]) => Promise<T>
    ): (...args: any[]) => Promise<T> {
      return async (...args: any[]): Promise<T> => {
        // Return existing promise if already initializing or ready
        if (initPromise && state !== 'failed') return initPromise;

        state = 'initializing';
        notifyListeners();

        initPromise = (async () => {
          try {
            const result = await initFn(...args);
            state = 'ready';
            notifyListeners();
            return result;
          } catch (error) {
            state = 'failed';
            initPromise = null;
            notifyListeners();
            throw error;
          }
        })();

        return initPromise;
      };
    },

    // Simple status getters
    getState: () => state,
    isReady: () => state === 'ready',
    isInitializing: () => state === 'initializing',

    // Simple subscription
    onStateChange(callback: () => void) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}
