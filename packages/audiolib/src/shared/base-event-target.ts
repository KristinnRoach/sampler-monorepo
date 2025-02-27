// TODO: Find out if we need to ensure compatibility with both
// the web standard EventTarget and the the Node.js EventTarget

/**
 * Base class that implements EventTarget to be extended by features
 */
export class BaseEventTarget extends EventTarget {
  private listeners = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >();

  /**
   * Helper method to dispatch custom events
   * Can only be called by a class that extends this class
   * bubbles: false - The event does not propagate up the DOM tree
   * @param eventName - Name of the event
   * @param detail - Event detail
   * @returns True if the event was dispatched, False if not (e.g. if preventDefault was called)
   */
  protected notifyListeners(eventName: string, detail?: any): boolean {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: false,
    });
    return this.dispatchEvent(event);
  }
}
