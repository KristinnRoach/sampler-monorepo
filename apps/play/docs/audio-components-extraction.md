# audio-components extraction

Play no longer depends on `@repo/audio-components`. Its remaining sampler web
components live in `src/audio-elements` and are registered from `src/main.tsx`.

## Deferred follow-up

- The app-local custom elements still use the VanJS implementation inherited
  from `audio-components`. Rewriting them as Solid components is intentionally
  out of scope because it would change the live demo's UI behavior.
- `SamplerRegistry`, DOM events, local-storage persistence, and the sampler
  controls belong to Play's application layer. They should not be promoted to
  `audiolib` without a separate public-API design pass.
- `audiolib` already supplies the only generic primitive identified here:
  `KnobElement`, which Play's new `ParamKnob` uses directly. Assess any further
  generic UI primitives separately from the audio-engine package extraction.
