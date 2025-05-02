type Success<T> = { data: T; error: null };
type Failure<E> = { data: null; error: E };
type Result<T, E = Error> = Success<T> | Failure<E>;

function isPromiseLike<T>(value: any): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  );
}

/**
 * Main tryCatch function that delegates to either trySync or tryAsync.
 * Always returns a Promise and must be awaited.
 */
export async function tryCatch<T, E = Error>(
  fn: (() => T | Promise<T>) | Promise<T>,
  errorMessage?: string,
  logError: boolean = true
): Promise<Result<T, E>> {
  if (isPromiseLike<T>(fn)) {
    return tryAsync(fn, errorMessage, logError);
  }
  if (typeof fn === 'function') {
    try {
      const result = fn();
      return isPromiseLike<T>(result)
        ? await tryAsync(result, errorMessage, logError)
        : { data: result, error: null };
    } catch (error) {
      return Promise.resolve(handleError(error as E, errorMessage, logError));
    }
  }
  throw new Error('tryCatch argument must be a function or promise');
}

/**
 * Handles synchronous operations.
 */
function trySync<T, E = Error>(
  fn: () => T,
  errorMessage?: string,
  logError: boolean = true
): Result<T, E> {
  try {
    return { data: fn(), error: null };
  } catch (error) {
    return handleError(error as E, errorMessage, logError);
  }
}

/**
 * Handles asynchronous operations.
 */
async function tryAsync<T, E = Error>(
  promise: Promise<T>,
  errorMessage?: string,
  logError: boolean = true
): Promise<Result<T, E>> {
  try {
    return { data: await promise, error: null };
  } catch (error) {
    return handleError(error as E, errorMessage, logError);
  }
}

/**
 * Common error handling logic.
 */
function handleError<E = Error>(
  error: E,
  errorMessage?: string,
  logError: boolean = true
): Failure<E> {
  if (logError) {
    const message = errorMessage
      ? `${errorMessage}: ${(error as Error).message ?? error}`
      : ((error as Error).message ?? error);
    console.error(message);
  }
  return { data: null, error };
}
