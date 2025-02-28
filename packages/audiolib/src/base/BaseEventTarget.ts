// TODO: Find out if we need to ensure compatibility with both
// the web standard EventTarget and the the Node.js EventTarget
// FIRST TODO: Ensure compatibility with the web standard EventTarget and that we are not adding redundant code or causing conflicts

/**
 * Abstract base class that implements EventTarget to be extended by features
 */
export abstract class BaseEventTarget extends EventTarget {
  private listeners = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >();

  constructor() {
    super();
    this.listeners = new Map();
  }

  /**
   * Add an event listener
   * @param eventName Event name to listen for
   * @param callback Function to call when the event occurs
   * @param options Optional options for the event listener
   */
  addEventListener(
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)?.add(callback);
    super.addEventListener(eventName, callback, options);
  }

  /**
   * Remove an event listener
   * @param eventName Event name
   * @param callback Function to remove
   * @param options Optional options for the event listener
   */
  removeEventListener(
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (!this.listeners.has(eventName)) return;

    this.listeners.get(eventName)?.delete(callback);

    // Clean up empty sets
    if (this.listeners.get(eventName)?.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  /**
   * Helper method to dispatch custom events
   * Can only be called by a class that extends this class
   * bubbles: false - The event does not propagate up the DOM tree
   * @param eventName - Name of the event
   * @param detail - Event detail
   * @returns True if the event was dispatched, False if not (e.g. if preventDefault was called)
   */
  protected notifyListeners(eventName: string, detail?: any): boolean {
    if (!this.listeners.has(eventName)) return;

    const event = new CustomEvent(eventName, {
      detail,
      bubbles: false,
    });
    return this.dispatchEvent(event);
  }

  /**
   * Get all listeners for a specific event type
   * @param eventName Event name to get listeners for
   * @returns Array of listeners for the specified event, or empty array if none
   */
  getEventListeners(eventName: string): EventListenerOrEventListenerObject[] {
    if (!this.listeners.has(eventName)) {
      return [];
    }
    return Array.from(this.listeners.get(eventName) || []);
  }

  /**
   * Get all registered event types and their listeners
   * @returns Map of event names to arrays of listeners
   */
  getAllEventListeners(): Map<string, EventListenerOrEventListenerObject[]> {
    const result = new Map<string, EventListenerOrEventListenerObject[]>();

    for (const [eventName, listenerSet] of this.listeners.entries()) {
      result.set(eventName, Array.from(listenerSet));
    }

    return result;
  }

  /**
   * Remove all event listeners
   */
  clearEventListeners(): void {
    // Iterate through all event types and their listeners
    for (const [eventName, callbackSet] of this.listeners.entries()) {
      // Remove each listener for this event type
      for (const callback of callbackSet) {
        super.removeEventListener(eventName, callback);
      }
    }

    // Clear the internal tracking map
    this.listeners.clear();
  }
}
