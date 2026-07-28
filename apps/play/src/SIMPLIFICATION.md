# Recommended simplification order:

## Remove the duplicate sampler engine first — high value / low effort.

[x] Removed the unused <sampler-element> lifecycle from Sampler.ts. App now uses createSampler() as the sole SamplePlayer initialization path while retaining the remaining vanilla control registrations.

## Replace the registry + global DOM-event + polling handshake with one explicit player handle — very high value / medium effort.

[x] Replaced registry lookup with a single app-level `__samplePlayerInstance` global. Removed 100ms polling intervals and simplified connection handlers. Vanilla controls now import `getSamplePlayerInstance()` directly from component-utils instead of doing target-node-id lookup → registry → retry. Kept `sampler-initialized` event for readiness signaling only, removed unused registry change callbacks.

## Unify sample persistence and loading — high value / low-medium effort.

[ ] createSampler still owns WAV encoding, base64 conversion, validation and currentSample persistence inline. Move this into one small app service and keep createSampler focused on player lifecycle and the sample:loaded subscription.

## Fix and simplify instrument-state persistence — high value / medium effort.

[ ] instrumentState.ts still searches for retired wrapper tags such as volume-knob and sampler-element, while the app now renders ParamKnob and direct Solid controls. Saved samples can therefore miss knob/envelope state or fail to restore it. Capture state from the player/descriptor model and explicit control references instead of querying legacy DOM wrappers.

## Make samplerParams the single parameter definition — high value / medium effort.

[ ] ParamKnob already uses audiolib’s descriptors, but SamplerKnobFactory.ts still contains a second large set of parameter ranges, defaults, formatting and setter mappings. Migrate any remaining parameter controls to samplerParams, then delete the duplicate knob factory/configuration path.

## Migrate remaining controls incrementally from custom elements to direct Solid components — high value / higher effort.

[ ] Prioritize buttons, selects and toggles; leave the envelope editor/keyboard until later because they have the deepest VanJS and event dependencies. The goal is for controls to receive SamplePlayer directly and call its public API without target-node-id or document-level coordination.

## Remove leftover compatibility surface after migration — medium value / low effort.

[ ] Clean up stale global typings, commented-out element registrations, legacy instrumentState selectors, duplicated CSS/imports, and the historical extraction scaffolding once the above paths are no longer used.
