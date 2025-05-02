## Usage Example: `assert`

### Basic Usage

```typescript
import { assert } from '@/utils';

function processValue(value: number | null) {
  assert(value !== null, 'Value must not be null');
  // TypeScript now knows value is number
  return value * 2;
}
```

### With Context

```typescript
assert(user.isLoggedIn, 'User must be logged in', { userId: user.id });
```

**Tip:**

- Use `assert` to enforce invariants and help TypeScript with type narrowing.
- Optionally provide a `context` object for easier debugging.
