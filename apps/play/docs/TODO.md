# Play TODO

## Before audiolib extraction

- [ ] Remove Play's TypeScript path alias to audiolib source and verify Play against an installed audiolib package tarball.
- [ ] Fix audiolib's generated declaration files so they contain no paths outside its published `dist` directory.
- [ ] Replace AudioWorklet loading paths that assume this monorepo or the `@repo/audiolib` package name with package-relative asset loading.
- [ ] Decide whether `KnobElement` is a supported optional `./components` export or Play-only UI; document and enforce that boundary.
- [ ] Make audiolib publish-ready: final package name and version, no `private` flag, license, repository metadata, and installation/API documentation.

## Play cleanup after extraction

1. [ ] Keep sampler UI, application persistence, and document-level coordination in Play; move a primitive into audiolib only after defining it as a reusable public API.
2. [ ] Replace the remaining VanJS buttons, selects, and toggles with Solid components that receive `SamplePlayer` directly.
3. [ ] Replace the remaining complex VanJS controls, including the envelope editor and keyboard, with Solid components that receive `SamplePlayer` directly. Depends on #2.
4. [ ] Delete the `sampler-initialized` compatibility event and all document-level readiness/sample-event listeners. Depends on #2 and #3.
5. [ ] Remove stale custom-element compatibility code, global typings, commented-out registrations and implementations, duplicate styles and imports, and obsolete extraction scaffolding. Depends on #4.
