# Contributing

## Architecture Overview

This is an Electron application with three process types:

1. **Main Process** (`src/main/`): Electron app lifecycle, creates windows, handles IPC
2. **Preload** (`src/preload/`): Bridges IPC between main and renderer using contextBridge
3. **Renderer** (`src/renderer/`): Browser-side UI, animations, and display logic

Shared types live in `src/shared/types/` for use across all processes.

## TypeScript Workflow

The project uses TypeScript with a proper `src/` → `dist/` structure:

- **Source files**: All `.ts` files live in `src/`
- **Compiled output**: JavaScript files are compiled to `dist/`
- **Runtime**: The application runs from `dist/`, not `src/`

```bash
# TypeScript compilation
npm run build:ts      # Compile TypeScript and copy assets

# Type checking only (no output)
npm run typecheck
```

## Development Workflow

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run the app (automatically builds first)
npm start

# Run with diagnostics
TWITCH_CHAT_URL="..." npm run start:diag
```

Note: `npm start` automatically runs `npm run build:ts` before launching Electron.

## Adding New Features

### Main Process Changes
- Add TypeScript files to `src/main/`
- Entry point: `src/main/index.ts`
- Use ES module imports with CommonJS output

### Renderer Changes
- TypeScript scripts go in `src/renderer/scripts/`
- Styles go in `src/renderer/styles/`
- Static assets go in `src/renderer/assets/`
- Scripts are loaded via `<script>` tags in `index.html` (compiled `.js` files)

### Shared Types
- Add TypeScript interfaces to `src/shared/types/`
- Export from `src/shared/types/index.ts`
- Types are shared across main, preload, and renderer processes

## Build Process

The build process:
1. Compiles TypeScript from `src/` to `dist/`
2. Copies static assets (HTML, CSS) to `dist/renderer/`
3. Copies vendor libraries (gsap) to `dist/renderer/vendor/`

## Code Style

- Use ES2020+ features (async/await, optional chaining)
- Prefer `const` over `let`
- Use meaningful variable names
- Keep functions small and focused
- Handle errors gracefully with fallbacks
- Add proper TypeScript types (avoid `any`)

## Testing Changes

Before submitting:
1. Run `npm run typecheck` - no errors
2. Run `npm run build:ts` - successful compilation
3. Run `npm run start:diag` - overlay works
4. Test with a live Twitch chat if possible
