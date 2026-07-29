# Recommended simplification order:

## 1. Remove the duplicate sampler engine first — high value / low effort.

[x] Removed the unused <sampler-element> lifecycle from Sampler.ts. App now owns the sole SamplePlayer initialization path while retaining the remaining vanilla control registrations.

## 2. Replace the registry + global DOM-event + polling handshake with one explicit player handle — very high value / medium effort.

[x] Replaced registry lookup with a single module-scoped SolidJS signal in App.tsx. Vanilla controls import `getSamplePlayer()` directly from App.tsx (an untracked read of the signal) instead of doing target-node-id lookup → registry → retry. Removed 100ms polling intervals; kept `sampler-initialized` (now dispatched only after the signal is set) as the one readiness signal. Also disposed of dead `target-node-id` readiness gating left over from the registry in ComputerKeyboard/PianoKeyboard/EnvelopeDisplay/EnvelopeSwitcher, and restored sampler disposal on App unmount (dropped by mistake during registry cleanup).

## 3. Unify sample persistence and loading — high value / low-medium effort.

[x] Moved current-sample persistence into a small storage service. App now owns the `SamplePlayer` lifecycle and one direct `sample:loaded` subscription, so the redundant `Sampler` handle and `createSampler()` wrapper are gone. The remaining document events are temporary compatibility signals for vanilla controls.

## 4. Make samplerParams the single parameter contract — high value / medium effort.

[x] Treat audiolib’s exported parameter keys, defaults, value domains and apply mappings as the public contract. Play owns parameter values and page-reload localStorage through one app-level state path; all sampler knobs (including AM) use it, and the duplicate SamplerKnobFactory is gone. Removing audiolib’s internal localStorage behavior remains a separate follow-up.

## 5. Fix instrument-state persistence against that contract — high value / medium effort; same PR as step 4.

[x] Save and restore parameters by SamplerParamKey through Play’s state path; capture engine state from SamplePlayer and app-only state through explicit references instead of retired DOM wrappers. Best-effort compatibility with existing saved instruments is preserved. Intentional saved-patch persistence remains distinct from the page-reload convenience. Steps 4 and 5 landed together and were manually verified.

## 6. Migrate remaining controls incrementally from custom elements to direct Solid components — high value / higher effort.

[ ] Prioritize buttons, selects and toggles; leave the envelope editor/keyboard until later because they have the deepest VanJS and event dependencies. The goal is for controls to receive SamplePlayer directly and call its public API without target-node-id or document-level coordination.

## 7. Remove leftover compatibility surface after migration — medium value / low effort.

[ ] Clean up stale global typings, commented-out element registrations, legacy instrumentState selectors, duplicated CSS/imports, and the historical extraction scaffolding once the above paths are no longer used. Known instances: unused `target-node-id` declarations in SamplerToggleFactory.ts (5x) and AMModulation.ts; large commented-out legacy implementation in EnvelopeDisplay.ts.
