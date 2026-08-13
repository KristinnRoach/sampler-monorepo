import van from '@repo/vanjs-core';
import type { State, Val } from '@repo/vanjs-core';

const toStyleStr = (style: Record<string, string | number>): string =>
  Object.entries(style)
    .map(([k, v]) => `${k}: ${v};`)
    .join('');

const stateProto = Object.getPrototypeOf(van.state(null));

const stateOf = <T>(v: Val<T>): State<T> =>
  Object.getPrototypeOf(v ?? 0) === stateProto
    ? (v as State<T>)
    : van.state(v as T);

export { toStyleStr, stateProto, stateOf };
