# Change: Add Rive runtime infrastructure for mascot animation

## Why
The project needs a reliable path to render a Duolingo-style mascot without changing message timing or overlay behavior.

## What Changes
- Add the Rive runtime dependency for the renderer.
- Create a dedicated renderer asset location for `mascot.riv`.
- Add safe, diagnostics-only loading that falls back to the existing CSS avatar when assets are missing or invalid.
- Keep the overlay lifecycle and message display behavior unchanged.

## Impact
- Affected specs: avatar-ui
- Affected code: package.json, renderer assets, renderer boot/Avatar UI initialization
