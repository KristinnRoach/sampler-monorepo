export function assert<T>(
  condition: any,
  message?: string,
  context?: T
): asserts condition {
  if (!condition) {
    const contextStr = context ? `\nContext: ${JSON.stringify(context)}` : '';
    throw new Error(
      `Assertion failed${message ? `: ${message}` : ''}${contextStr}`
    );
  }
}

// Example usage
// assert(audioBuffer !== null, "Audio buffer cannot be null", this);
