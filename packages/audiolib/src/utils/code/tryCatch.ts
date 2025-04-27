// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Unified tryCatch that handles both sync and async cases
export function tryCatch<T, E = Error>(
  fn:
    | (() => T)
    | Promise<T>
    | (() => Promise<T>)
    | { (): T }
    | { (): Promise<T> },
  errorMessage?: string,
  logError: boolean = true
): Promise<Result<T, E>> | Result<T, E> {
  // Handle case where fn is already a Promise
  if (fn instanceof Promise) {
    return handleAsync(fn, errorMessage, logError);
  }

  // Handle case where fn is a function
  if (typeof fn === 'function') {
    try {
      const result = fn();
      // If result is a Promise, handle async
      if (result instanceof Promise) {
        return handleAsync(result, errorMessage, logError);
      }
      // Handle sync result
      return { data: result, error: null };
    } catch (error) {
      if (logError) {
        const message = errorMessage
          ? `${errorMessage}: ${(error as Error).message}`
          : (error as Error).message;
        console.error(message);
      }
      return { data: null, error: error as E };
    }
  }

  throw new Error('tryCatch argument must be a function or promise');
}

// Helper for async handling
async function handleAsync<T, E = Error>(
  promise: Promise<T>,
  errorMessage?: string,
  logError: boolean = true
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    if (logError) {
      const message = errorMessage
        ? `${errorMessage}: ${(error as Error).message}`
        : (error as Error).message;
      console.error(message);
    }
    return { data: null, error: error as E };
  }
}

// // Types for the result object with discriminated union
// type Success<T> = {
//   data: T;
//   error: null;
// };

// type Failure<E> = {
//   data: null;
//   error: E;
// };

// type Result<T, E = Error> = Success<T> | Failure<E>;

// export async function tryCatch<T, E = Error>(
//   promise: Promise<T>,
//   errorMessage?: string,
//   logError: boolean = true
// ): Promise<Result<T, E>> {
//   try {
//     const data = await promise;
//     return { data, error: null };
//   } catch (error) {
//     // Log the error if requested
//     if (logError) {
//       const message = errorMessage
//         ? `${errorMessage}: ${(error as Error).message}`
//         : (error as Error).message;
//       console.error(message);
//     }
//     return { data: null, error: error as E };
//   }
// }

/*
// original from  t3 (theo)
export async function tryCatch<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}
*/

/* draft for more advanced version below - throw away unless you want to finish it

// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Logger interface (can be replaced with your preferred logging library)
interface Logger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
}

// Default console-based logger implementation
const consoleLogger: Logger = {
  debug: (message, metadata) => console.debug(message, metadata || ''),
  info: (message, metadata) => console.info(message, metadata || ''),
  warn: (message, metadata) => console.warn(message, metadata || ''),
  error: (message, metadata) => console.error(message, metadata || ''),
};

// Options for the tryCatch function
interface TryCatchOptions<E = Error> {
  errorMessage?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logger?: Logger;
  metadata?: Record<string, any>;
  transformError?: (error: any) => E;
  silent?: boolean;
}

/**     NOT TESTED _ throw away unless needed
 * Enhanced wrapper function for try/catch with built-in logging
 * @param promise - The promise to await and catch errors from
 * @param options - Configuration options for error handling and logging
 * @returns A Result object containing either the data or the error
 */
/*
export async function tryCatch<T, E = Error>(
    promise: Promise<T>,
    options?: TryCatchOptions<E>
  ): Promise<Result<T, E>> {
    // Default options
    const {
      errorMessage,
      logLevel = 'error',
      logger = consoleLogger,
      metadata = {},
      transformError = (err: any) => err as E,
      silent = false
    } = options || {};
  
    try {
      const data = await promise;
      return { data, error: null };
    } catch (caughtError) {
      // Transform the error if needed
      const error = transformError(caughtError);
      
      // Get error details
      const errorDetails = error instanceof Error ? error.message : String(error);
      
      // Create the log message
      const logMessage = errorMessage 
        ? `${errorMessage}: ${errorDetails}`
        : errorDetails;
      
      // Log the error (unless silent)
      if (!silent) {
        logger[logLevel](logMessage, {
          ...metadata,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      }
      
      // Return the failure result
      return { data: null, error };
    }
  }
*/
