// Debouncer.ts
export class Debouncer {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Debounce a function by a unique key.
   * @param key - Unique identifier for this debounced function (e.g., parameter name)
   * @param fn - The function to debounce
   * @param delay - Debounce delay in milliseconds
   */
  debounce<T extends (...args: any[]) => void>(
    key: string,
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }
      this.timers.set(
        key,
        setTimeout(() => {
          fn(...args);
          this.timers.delete(key); // Clean up after call
        }, delay)
      );
    };
  }

  /**
   * Cancel a pending debounced call for a given key, if needed.
   */
  cancel(key: string) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }
}

// export function debounce<T extends (...args: any[]) => void>(
//   fn: T,
//   delay: number
// ): (...args: Parameters<T>) => void {
//   let timer: ReturnType<typeof setTimeout> | null = null;
//   return (...args: Parameters<T>) => {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(() => fn(...args), delay);
//   };
// }
