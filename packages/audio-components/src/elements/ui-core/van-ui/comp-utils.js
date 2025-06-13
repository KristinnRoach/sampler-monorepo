const toStyleStr = (style) =>
  Object.entries(style)
    .map(([k, v]) => `${k}: ${v};`)
    .join('');

const stateProto = Object.getPrototypeOf(van.state(null));

const stateOf = (v) =>
  Object.getPrototypeOf(v ?? 0) === stateProto ? v : van.state(v);

export { toStyleStr, stateProto, stateOf };
