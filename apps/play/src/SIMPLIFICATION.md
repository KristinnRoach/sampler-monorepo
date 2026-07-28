# Recommended simplification order:

### Remove the duplicate sampler engine first — high value / low effort.

[ ] Sampler.ts still contains the old <sampler-element> lifecycle, localStorage restoration, WAV validation, event dispatch and disposal logic, while App actually uses createSampler(). Stop registering/maintaining the unused sampler-element engine and retain only the control registrations needed by the UI.

### Replace the registry + global DOM-event + polling handshake with one explicit player handle — very high value / medium effort.

[ ] The combination of target-node-id, nearest-parent lookup, SamplerRegistry, sampler-initialized, and retry intervals is the main inherited indirection. Introduce one app-level SamplePlayer reference/provider or a single readiness promise for the remaining vanilla controls. Keep DOM events only where an actual cross-component notification is required.

### Unify sample persistence and loading — high value / low-medium effort.

[ ] WAV encoding, base64 conversion, validation and currentSample persistence are duplicated between Sampler.ts and createSampler.ts. Move this into one small app service and have createSampler own the sample:loaded subscription.

### Fix and simplify instrument-state persistence — high value / medium effort.

[ ] instrumentState.ts still searches for retired wrapper tags such as volume-knob and sampler-element, while the app now renders ParamKnob and direct Solid controls. Saved samples can therefore miss knob/envelope state or fail to restore it. Capture state from the player/descriptor model and explicit control references instead of querying legacy DOM wrappers.

### Make samplerParams the single parameter definition — high value / medium effort.

[ ] ParamKnob already uses audiolib’s descriptors, but SamplerKnobFactory.ts still contains a second large set of parameter ranges, defaults, formatting and setter mappings. Migrate any remaining parameter controls to samplerParams, then delete the duplicate knob factory/configuration path.

### Migrate remaining controls incrementally from custom elements to direct Solid components — high value / higher effort.

[ ] Prioritize buttons, selects and toggles; leave the envelope editor/keyboard until later because they have the deepest VanJS and event dependencies. The goal is for controls to receive SamplePlayer directly and call its public API without target-node-id or document-level coordination.

### Remove leftover compatibility surface after migration — medium value / low effort.

[ ] Clean up stale global typings, commented-out element registrations, legacy instrumentState selectors, duplicated CSS/imports, and the historical extraction scaffolding once the above paths are no longer used.
