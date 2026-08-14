# Play TODO

## Before audiolib extraction

- [x] Remove Play's TypeScript path alias to audiolib source and verify Play against an installed audiolib package tarball.
- [x] Fix audiolib's generated declaration files so they contain no paths outside its published `dist` directory.
- [x] Bundle AudioWorklet processor code so loading does not depend on monorepo, package-manager, or consumer asset paths.
- [x] Support `KnobElement` through the optional `@kidlib/web-audio/components` export only.
- [x] Publish `@kidlib/web-audio@0.1.0` from `KristinnRoach/web-audio` and consume it from Play.

The monorepo copy remains temporarily for other workspace consumers. Continue
audiolib development in the extracted repository.

## Play cleanup after extraction

1. [ ] Keep sampler UI, application persistence, and document-level coordination in Play; move a primitive into audiolib only after defining it as a reusable public API.
2. [ ] Replace the remaining VanJS buttons, selects, and toggles with Solid components that receive `SamplePlayer` directly.
3. [ ] Replace the remaining complex VanJS controls, including the envelope editor and keyboard, with Solid components that receive `SamplePlayer` directly. Depends on #2.
4. [ ] Delete the `sampler-initialized` compatibility event and all document-level readiness/sample-event listeners. Depends on #2 and #3.
5. [ ] Remove stale custom-element compatibility code, global typings, commented-out registrations and implementations, duplicate styles and imports, and obsolete extraction scaffolding. Depends on #4.
