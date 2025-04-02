// EventBus.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DefaultEventBus } from './EventBus';
import type { EventType, EventData } from './types';

describe('DefaultEventBus', () => {
  let eventBus: DefaultEventBus;

  beforeEach(() => {
    // Create a fresh EventBus instance before each test
    eventBus = new DefaultEventBus();
  });

  afterEach(() => {
    // Clean up by removing all listeners
    // This isn't strictly necessary due to the beforeEach,
    // but it's a good practice to demonstrate
    // @ts-ignore - Accessing a private property for testing purposes
    const listeners = eventBus.eventListeners || [];
    for (const type in listeners) {
      eventBus.removeAllListeners(type as EventType);
    }
  });

  it('should create an instance of DefaultEventBus', () => {
    expect(eventBus).toBeInstanceOf(DefaultEventBus);
    expect(eventBus).toBeInstanceOf(EventTarget);
  });

  it('should add listeners and notify them with an event', () => {
    const handler = vi.fn();
    const eventType: EventType = 'ready';
    const eventData: EventData = { message: 'System ready' };

    eventBus.addListener(eventType, handler);
    eventBus.notify(eventType, eventData);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(eventData);
  });

  it('should remove a specific listener', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const eventType: EventType = 'ready';
    const eventData: EventData = { message: 'System ready' };

    eventBus.addListener(eventType, handler1);
    eventBus.addListener(eventType, handler2);

    // Remove only the first handler
    eventBus.removeListener(eventType, handler1);

    // Notify should only trigger handler2
    eventBus.notify(eventType, eventData);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledWith(eventData);
  });

  it('should remove all listeners for a specific event type', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const eventType: EventType = 'ready';
    const eventData: EventData = { message: 'System ready' };

    eventBus.addListener(eventType, handler1);
    eventBus.addListener(eventType, handler2);

    // Remove all handlers for the event type
    eventBus.removeAllListeners(eventType);

    // Notify should not trigger any handlers
    eventBus.notify(eventType, eventData);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should only trigger a one-time listener once', () => {
    const handler = vi.fn();
    const eventType: EventType = 'ready';
    const eventData: EventData = { message: 'System ready' };

    eventBus.listenOnce(eventType, handler);

    // Notify multiple times
    eventBus.notify(eventType, eventData);
    eventBus.notify(eventType, eventData);
    eventBus.notify(eventType, eventData);

    // Handler should only be called once
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(eventData);
  });

  it('should return an unsubscribe function when adding a listener', () => {
    const handler = vi.fn();
    const eventType: EventType = 'ready';
    const eventData: EventData = { message: 'System ready' };

    // The addListener method returns an unsubscribe function
    const unsubscribe = eventBus.addListener(eventType, handler);

    // First notification should trigger the handler
    eventBus.notify(eventType, eventData);
    expect(handler).toHaveBeenCalledTimes(1);

    // Call the unsubscribe function
    unsubscribe();

    // Second notification should not trigger the handler
    eventBus.notify(eventType, eventData);
    expect(handler).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('should return an unsubscribe function from listenOnce', () => {
    const handler = vi.fn();
    const eventType: EventType = 'ready';
    const eventData: EventData = { message: 'System ready' };

    // listenOnce also returns an unsubscribe function
    const unsubscribe = eventBus.listenOnce(eventType, handler);

    // Unsubscribe before any notification
    unsubscribe();

    // Notification should not trigger the handler
    eventBus.notify(eventType, eventData);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple event types independently', () => {
    const readyHandler = vi.fn();
    const errorHandler = vi.fn();
    const readyData: EventData = { message: 'System ready' };
    const errorData: EventData = { message: 'Error occurred' };

    eventBus.addListener('ready', readyHandler);
    eventBus.addListener('error', errorHandler);

    // Notify ready event
    eventBus.notify('ready', readyData);
    expect(readyHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler).not.toHaveBeenCalled();

    // Notify error event
    eventBus.notify('error', errorData);
    expect(readyHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler).toHaveBeenCalledTimes(1);
  });
});
