# Roadmap

Known work, roughly in dependency order. The app is mid-migration from VanJS
custom elements to Solid components; both are present today.

1. Replace the remaining VanJS buttons, selects, and toggles with Solid components that receive `SamplePlayer` directly.
2. Replace the remaining complex VanJS controls, including the envelope editor and keyboard, with Solid components that receive `SamplePlayer` directly. Depends on #1.
3. Delete the `sampler-initialized` compatibility event and all document-level readiness/sample-event listeners. Depends on #1 and #2.
4. Remove stale custom-element compatibility code, global typings, commented-out registrations, and duplicate styles/imports. Depends on #3.

## Scope

Sampler UI, persistence, and document-level coordination live here. Audio
primitives belong in [`@kidlib/web-audio`](https://github.com/KristinnRoach/web-audio),
and move there only once defined as a reusable public API.
