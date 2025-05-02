import { describe, it, expect, vi } from 'vitest';
import { tryCatch } from '../tryCatch';

describe('tryCatch', () => {
  it('handles synchronous success', async () => {
    const result = await tryCatch(() => 42);
    expect(result.data).toBe(42);
    expect(result.error).toBeNull();
  });

  it('handles synchronous failure', async () => {
    const result = await tryCatch(() => {
      throw new Error('fail');
    });
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('fail');
  });

  it('handles asynchronous success', async () => {
    const result = await tryCatch(() => Promise.resolve('ok'));
    expect(result.data).toBe('ok');
    expect(result.error).toBeNull();
  });

  it('handles asynchronous failure', async () => {
    const result = await tryCatch(() =>
      Promise.reject(new Error('async fail'))
    );
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('async fail');
  });

  it('handles direct Promise success', async () => {
    const result = await tryCatch(Promise.resolve('direct'));
    expect(result.data).toBe('direct');
    expect(result.error).toBeNull();
  });

  it('handles direct Promise failure', async () => {
    const result = await tryCatch(Promise.reject(new Error('direct fail')));
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('direct fail');
  });

  it('logs error with custom message', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await tryCatch(() => {
      throw new Error('fail');
    }, 'CustomMsg');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('CustomMsg'));
    spy.mockRestore();
  });

  it('does not log error when logError is false', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await tryCatch(
      () => {
        throw new Error('fail');
      },
      undefined,
      false
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('handles thrown non-Error values', async () => {
    const result = await tryCatch(() => {
      throw 'string error';
    });
    expect(result.data).toBeNull();
    expect(result.error).toBe('string error');
  });

  it('throws if argument is not function or Promise', async () => {
    // @ts-expect-error
    await expect(tryCatch(123)).rejects.toThrow(
      'tryCatch argument must be a function or promise'
    );
  });

  it('handles function returning a Promise', async () => {
    const result = await tryCatch(() => Promise.resolve(99));
    expect(result.data).toBe(99);
    expect(result.error).toBeNull();
  });

  it('correctly identifies promise-like objects', async () => {
    // Custom promise-like object
    const customPromiseLike = {
      then: function (resolve: (value: any) => void) {
        resolve('custom promise-like');
      },
    };

    // @ts-ignore - Testing runtime behavior
    const result = await tryCatch(customPromiseLike);
    expect(result.data).toBe('custom promise-like');
    expect(result.error).toBeNull();
  });

  it('throws for objects with non-function then property', async () => {
    // Object with then property that is not a function
    const nonPromiseLike = { then: 'not a function' };

    // @ts-expect-error
    await expect(tryCatch(nonPromiseLike)).rejects.toThrow(
      'tryCatch argument must be a function or promise'
    );
  });
});
