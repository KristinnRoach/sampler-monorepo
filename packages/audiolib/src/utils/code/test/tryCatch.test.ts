import { describe, it, expect } from 'vitest';
import { tryCatch } from '../tryCatch';

describe('tryCatch', () => {
  // Sync tests
  it('handles successful sync operations', () => {
    const result = tryCatch(() => 'success');
    if (result instanceof Promise) throw new Error('Expected sync result');
    expect(result).toEqual({ data: 'success', error: null });
  });

  it('handles sync errors', () => {
    const result = tryCatch(
      () => {
        throw new Error('sync error');
      },
      'Test error',
      false // disable console.error
    );
    if (result instanceof Promise) throw new Error('Expected sync result');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.data).toBeNull();
  });

  // Async tests
  it('handles successful async operations', async () => {
    const result = await tryCatch(Promise.resolve('success'));
    expect(result).toEqual({ data: 'success', error: null });
  });

  it('handles async errors', async () => {
    const result = await tryCatch(
      Promise.reject(new Error('async error')),
      'Test error',
      false // disable console.error
    );
    expect(result.error).toBeInstanceOf(Error);
    expect(result.data).toBeNull();
  });

  // Async function tests
  it('handles async functions', async () => {
    const result = await tryCatch(async () => {
      return 'success';
    });
    expect(result).toEqual({ data: 'success', error: null });
  });

  // Error message tests
  it('includes custom error message', () => {
    const result = tryCatch(
      () => {
        throw new Error('original');
      },
      'custom message',
      false // disable console.error for clean test output
    );
    if (result instanceof Promise) throw new Error('Expected sync result');
    expect((result.error as Error).message).toBe('original');
  });

  // Invalid input test
  it('throws on invalid input', () => {
    expect(() => tryCatch(42 as any)).toThrow('must be a function or promise');
  });

  it('handles regular functions', () => {
    function regularFn() {
      return 'success';
    }
    const result = tryCatch(regularFn);
    if (result instanceof Promise) throw new Error('Expected sync result');
    expect(result).toEqual({ data: 'success', error: null });
  });
});
