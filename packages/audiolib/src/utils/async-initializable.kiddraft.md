# audiolib utility function

## for classes that require async initialization

Intended to be a lightweight utility for creating classes with safe, race-condition-free async initialization.

## Problem Solved

Many classes in audio applications require asynchronous initialization steps that must complete before the class can be used. When multiple parts of an application try to initialize the same resource simultaneously, race conditions can occur.

This utility provides a standardized way to:

1. Protect against concurrent initialization attempts
2. Track initialization status
3. Allow waiting for in-progress initialization
4. Support retrying failed initializations

## Implementation

```typescript
// asyncInitializable.ts

export type InitStatus = 'idle' | 'initializing' | 'initialized' | 'failed';

export function makeAsyncInitializable<T>() {
  // Fields to be added to a class
  let initPromise: Promise<T> | null = null;
  let status: InitStatus = 'idle';

  // Return object with utility methods
  return {
    // Wrap an initialization function
    wrapInit(
      initFn: (...args: any[]) => Promise<T>
    ): (...args: any[]) => Promise<T> {
      return async (...args: any[]): Promise<T> => {
        // Return existing promise if initialization is in progress or complete
        if (initPromise && status !== 'failed') return initPromise;

        status = 'initializing';
        initPromise = (async () => {
          try {
            const result = await initFn(...args);
            status = 'initialized';
            return result;
          } catch (error) {
            status = 'failed';
            initPromise = null;
            throw error;
          }
        })();

        return initPromise;
      };
    },

    // Status checkers
    getStatus: (): InitStatus => status,
    getPromise: (): Promise<T> | null => initPromise,
    isInitialized: (): boolean => status === 'initialized',
    isInitializing: (): boolean => status === 'initializing',
  };
}
```

## Usage

### Basic Integration

```typescript
class AudioEngine {
  private initializer = makeAsyncInitializable<AudioEngine>();

  constructor() {
    // Replace the init method with the wrapped version
    this.init = this.initializer.wrapInit(this.initImpl.bind(this));
  }

  // Public init method (will be replaced by wrapper)
  init!: () => Promise<AudioEngine>;

  // Actual implementation of initialization
  private async initImpl(): Promise<AudioEngine> {
    // Original async initialization code
    await this.setupAudioContext();
    await this.loadSamples();
    await this.registerProcessors();

    return this;
  }

  // Expose status methods
  isInitialized(): boolean {
    return this.initializer.isInitialized();
  }

  getInitStatus(): InitStatus {
    return this.initializer.getStatus();
  }
}
```

### Advanced Usage

```typescript
// singleton.ts
export function createSingleton<T>(factory: () => T): () => T {
  let instance: T | null = null;

  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}

// AudioSystem.ts
class AudioSystem {
  private initializer = makeAsyncInitializable<AudioSystem>();

  constructor() {
    this.init = this.initializer.wrapInit(this.initImpl.bind(this));
  }

  init!: () => Promise<AudioSystem>;

  private async initImpl(): Promise<AudioSystem> {
    // Initialization logic
    return this;
  }

  getInitStatus(): InitStatus {
    return this.initializer.getStatus();
  }

  getInitPromise(): Promise<AudioSystem> | null {
    return this.initializer.getPromise();
  }
}

// Create singleton
export const getAudioSystem = createSingleton(() => new AudioSystem());

// usage.ts
async function setupAudio() {
  const audioSystem = getAudioSystem();

  // Check status without triggering initialization
  const status = audioSystem.getInitStatus();

  if (status === 'idle') {
    // First time, start initialization
    await audioSystem.init();
  } else if (status === 'initializing') {
    // Already in progress, wait for completion
    await audioSystem.getInitPromise();
  } else if (status === 'failed') {
    // Previous attempt failed, retry
    await audioSystem.init();
  }

  // Now safe to use
}
```

## UI Integration Example

```tsx
function AudioControls() {
  const [status, setStatus] = useState<InitStatus>('idle');

  useEffect(() => {
    const audioSystem = getAudioSystem();
    const currentStatus = audioSystem.getInitStatus();

    setStatus(currentStatus);

    // If initializing, wait for completion
    if (currentStatus === 'initializing') {
      audioSystem
        .getInitPromise()
        ?.then(() => setStatus('initialized'))
        ?.catch(() => setStatus('failed'));
    }
  }, []);

  const handleInitClick = async () => {
    try {
      setStatus('initializing');
      await getAudioSystem().init();
      setStatus('initialized');
    } catch (error) {
      setStatus('failed');
      console.error('Failed to initialize audio:', error);
    }
  };

  return (
    <div>
      {status === 'idle' && (
        <button onClick={handleInitClick}>Initialize Audio</button>
      )}

      {status === 'initializing' && <div>Initializing audio system...</div>}

      {status === 'initialized' && <div>Audio system ready</div>}

      {status === 'failed' && (
        <div>
          <div>Audio initialization failed</div>
          <button onClick={handleInitClick}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

## Benefits

- **Thread safety**: Protected against race conditions
- **Status tracking**: Clear, consistent states
- **Efficiency**: No redundant initialization attempts
- **Reusability**: Works with any async-initializable class
- **Type safety**: Fully TypeScript compatible

## Implementation Notes

1. **Closure-based state**: Uses closures to maintain state, avoiding the need for class properties
2. **Promise management**: Properly handles promise states and error scenarios
3. **Minimal API**: Simple interface with just the essential methods
4. **Zero dependencies**: No external dependencies required
