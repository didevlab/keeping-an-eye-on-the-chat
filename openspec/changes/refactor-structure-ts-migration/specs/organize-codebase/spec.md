## ADDED Requirements
### Requirement: Baseline runtime preserved
The system SHALL preserve the current runtime behavior for overlay and hidden windows, including diagnostics and environment variable handling, throughout the refactor and JS->TS migration.

#### Scenario: Diagnostics run matches baseline
- **WHEN** the user runs `TWITCH_CHAT_URL=... DIAGNOSTICS=1 npm run start:diag`
- **THEN** the overlay window starts, the hidden chat window loads the Twitch URL, and diagnostics logs appear without regressions

### Requirement: Target folder structure with mapping
The codebase SHALL adopt a folder structure that separates main, renderer, preload, shared, config, scripts, and docs, and SHALL document the mapping from old paths to new paths.

#### Scenario: Entry points resolve after reorganization
- **WHEN** files are moved to the target structure and `npm run start` is executed
- **THEN** Electron resolves the main/preload/renderer entry points without orphaned files or broken imports

### Requirement: Incremental TypeScript migration
The system SHALL support incremental migration by allowing JS and TS to coexist, providing a dedicated typecheck command, and defining a build/transpile output strategy that keeps existing commands functional.

#### Scenario: Typecheck and build coexist with current commands
- **WHEN** `npm run typecheck` and `npm run build` are executed during migration
- **THEN** typecheck runs without emitting files, build emits to `dist/`, and `npm run start:diag` remains functional

### Requirement: Documentation and troubleshooting updated
The documentation SHALL reflect the new structure, updated commands, supported environment variables, and common troubleshooting guidance.

#### Scenario: Updated docs reflect new structure and commands
- **WHEN** a contributor reads the updated README and docs
- **THEN** they can locate the new folders, run dev/diag/build commands, set required env vars, and follow troubleshooting steps
