## Usage Example: `tryCatch`

### For Synchronous Functions

```typescript
const result = await tryCatch(() => JSON.parse('{"foo": "bar"}'));
if (result.error) {
  // handle error
} else {
  // use result.data
}
```

### For Asynchronous Functions

```typescript
const result = await tryCatch(() =>
  fetch('/api/data').then((res) => res.json())
);
if (result.error) {
  // handle error
} else {
  // use result.data
}
```

### For Promises Directly

```typescript
const result = await tryCatch(fetch('/api/data'));
if (result.error) {
  // handle error
} else {
  // use result.data
}
```

**Tip:**

- Optionally pass a custom error message and set `logError` to `false` to suppress console errors:
  ```typescript
  await tryCatch(() => doSomething(), 'Custom error', false);
  ```

## Implementation Details

The utility uses the `isPromiseLike` function to detect promises:

```typescript
function isPromiseLike<T>(value: any): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  );
}
```

This allows `tryCatch` to handle both direct promises and functions that return promises.
