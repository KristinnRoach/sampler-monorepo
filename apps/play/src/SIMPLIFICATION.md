# Recommended simplification order:

## 1. Remove the duplicate sampler engine first — high value / low effort.

[x] Removed the unused <sampler-element> lifecycle from Sampler.ts. App now owns the sole SamplePlayer initialization path while retaining the remaining vanilla control registrations.

## 2. Replace the registry + global DOM-event + polling handshake with one explicit player handle — very high value / medium effort.

[x] Replaced registry lookup with a single module-scoped SolidJS signal in App.tsx. Vanilla controls import `getSamplePlayer()` directly from App.tsx (an untracked read of the signal) instead of doing target-node-id lookup → registry → retry. Removed 100ms polling intervals; kept `sampler-initialized` (now dispatched only after the signal is set) as the one readiness signal. Also disposed of dead `target-node-id` readiness gating left over from the registry in ComputerKeyboard/PianoKeyboard/EnvelopeDisplay/EnvelopeSwitcher, and restored sampler disposal on App unmount (dropped by mistake during registry cleanup).

## 3. Unify sample persistence and loading — high value / low-medium effort.

[x] Moved current-sample persistence into a small storage service. App now owns the `SamplePlayer` lifecycle and one direct `sample:loaded` subscription, so the redundant `Sampler` handle and `createSampler()` wrapper are gone. The remaining document events are temporary compatibility signals for vanilla controls.

## 4. Make samplerParams the single parameter contract — high value / medium effort.

[x] Treat audiolib’s exported parameter keys, defaults, value domains and apply mappings as the public contract. Play owns one small reactive parameter store; all sampler knobs (including AM) use it, and the duplicate SamplerKnobFactory and old per-parameter localStorage path are gone. A single session-scoped working draft provides best-effort reload recovery without modifying intentional saved patches.

## 5. Fix instrument-state persistence against that contract — high value / medium effort; same PR as step 4.

[x] Saved samples include a typed parameter patch. Loading one applies the patch through `SamplePlayer.applyParams()` and updates Play’s reactive controls. The unused DOM-based instrument-state capture/restore layer and one-use sample-selection hook are gone.

## 6. Migrate remaining controls incrementally from custom elements to direct Solid components — high value / higher effort.

[ ] Prioritize buttons, selects and toggles; leave the envelope editor/keyboard until later because they have the deepest VanJS and event dependencies. The goal is for controls to receive SamplePlayer directly and call its public API without target-node-id or document-level coordination.

## 7. Remove leftover compatibility surface after migration — medium value / low effort.

[ ] Clean up stale global typings, commented-out element registrations, duplicated CSS/imports, and the historical extraction scaffolding once the above paths are no longer used. Known instances: unused `target-node-id` declaration in AMModulation.ts and the large commented-out implementation in EnvelopeDisplay.ts.

## Deferred

- [ ] Give audiolib `KnobElement` a silent-initialization or non-emitting setter path, preserving explicit programmatic-change events for existing consumers.
- [x] Removed automatic parameter localStorage from audiolib and Play. `SamplePlayer` keeps runtime values in memory; intentional saved samples carry explicit parameter patches.
- [ ] After the remaining controls are migrated, delete the temporary document readiness/sample events and stale custom-element compatibility code.
