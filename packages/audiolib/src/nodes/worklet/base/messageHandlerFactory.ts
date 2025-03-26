/**
 * Creates a message handler function for AudioWorklet processors
 * @param handlers Object mapping command names to handler functions
 * @returns A message handler function to be passed to createWorkletNode
 */
export function createMessageHandler(handlers: {
  [command: string]: (this: any, data: any) => void;
}): (this: any, event: MessageEvent) => void {
  return function (this: any, event: MessageEvent): void {
    // Handle standard 'active' property that all processors support
    if (event.data.hasOwnProperty('active')) {
      this.active = event.data.active;
      return;
    }

    // Handle custom commands
    if (event.data.command && handlers[event.data.command]) {
      handlers[event.data.command].call(this, event.data);
    }
  };
}
