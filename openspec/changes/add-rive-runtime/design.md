## Context
The renderer is plain HTML/JS with no bundler, node integration is disabled, and the overlay UI is driven by `AvatarUI` plus CSS. We need to add a Rive runtime and asset loading path without changing message timing or the existing UI behavior.

## Goals / Non-Goals
- Goals: load a local Rive mascot asset safely, keep the overlay stable, emit diagnostics-only logs.
- Non-Goals: no message lifecycle integration, no visual changes when the asset is missing, no networking.

## Decisions
- Decision: use the `@rive-app/canvas` runtime and load it as a local renderer asset (no network), exposing a global `rive` object for a small loader to consume.
- Decision: keep loading logic isolated in the renderer and default to the current CSS avatar when any step fails.

## Alternatives considered
- Lottie: not chosen due to less ergonomic state machine control for mascot-like reactions.
- Sprite/GIF: not expressive enough and harder to scale for future states.
- Custom canvas/WebGL: too much maintenance for this MVP.

## Risks / Trade-offs
- Risk: runtime load path differs between dev and packaged builds. Mitigation: use relative file paths bundled with `src/renderer/`.
- Risk: asset or state machine mismatch breaks initialization. Mitigation: strict name checks and a CSS fallback.

## Migration Plan
1. Add runtime dependency and vendor the runtime files into renderer assets.
2. Add a safe loader that no-ops on failure.
3. Keep the CSS avatar intact as a fallback.

## Open Questions
- Should the runtime be copied into `src/renderer/vendor/` or referenced directly from `node_modules` at build time?
