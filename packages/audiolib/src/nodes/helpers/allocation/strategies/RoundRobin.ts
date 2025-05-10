import { LibVoiceNode } from '@/LibNode';

/**
 * A simple round-robin allocator that cycles through available items
 */
export class RoundRobin<T extends LibVoiceNode> {
  #lastIndex = -1;

  /**
   * Allocates the next item from the available collection using round-robin strategy
   * @param available Collection of available items
   * @returns The next item in the rotation or null if none available
   */
  allocate(available: Set<T> | T[]): T | undefined {
    if (
      (Array.isArray(available) && available.length === 0) ||
      (!Array.isArray(available) && available.size === 0)
    ) {
      return;
    }

    const items = Array.isArray(available) ? available : Array.from(available);
    this.#lastIndex = (this.#lastIndex + 1) % items.length;
    return items[this.#lastIndex];
  }

  /**
   * Resets the allocation index
   */
  reset(): void {
    this.#lastIndex = -1;
  }
}
