# 🤖 Claude Code Context

> **AI Assistant Instructions for Keeping an Eye on the Chat**

---

## 📋 Project Overview

| | |
|---|---|
| **Type** | Electron desktop application |
| **Purpose** | Twitch chat overlay with animated avatar |
| **Stack** | TypeScript, Electron, GSAP |
| **Target** | Streamers who want chat visibility |

### Core Features

- 👁️ Observes Twitch popout chat via DOM
- 💬 Displays messages one at a time with speech bubble
- 🎭 Animated avatar with lip-sync, blinking, expressions
- 🪟 Transparent click-through overlay window

---

## 🏗️ Architecture

```
src/
├── 📁 main/               # Electron main process
│   ├── index.ts           # Entry point, creates overlay window
│   ├── chatSource.ts      # Twitch DOM observer (BrowserView)
│   ├── configWindow.ts    # Configuration wizard window
│   └── ipcHandlers.ts     # IPC communication handlers
├── 📁 preload/            # Preload scripts
│   ├── index.ts           # Overlay contextBridge
│   └── configPreload.ts   # Config window contextBridge
├── 📁 renderer/           # Renderer processes
│   ├── 📁 overlay/        # Main overlay UI
│   │   ├── scripts/       # displayController, avatarUI, avatarAnimator
│   │   └── styles/        # CSS
│   └── 📁 config/         # Configuration wizard
│       ├── scripts/       # configApp.ts (form controller)
│       └── styles/        # Dark theme CSS
├── 📁 config/             # Configuration logic
│   ├── types.ts           # TypeScript interfaces
│   ├── schema.ts          # Config schema + validation
│   ├── defaults.ts        # Defaults + presets
│   ├── store.ts           # JSON persistence
│   └── merge.ts           # Config merge logic
└── 📁 shared/types/       # Shared TypeScript types
    └── config.ts          # ChatMessage, OverlayConfig

dist/                      # Compiled JavaScript (generated)
```

---

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `npm run typecheck` | ✅ Type check without compiling |
| `npm run build:ts` | 🔨 Compile TypeScript to dist/ |
| `npm start` | 🚀 Run app (auto-compiles) |
| `npm run start:diag` | 🔍 Run with diagnostics enabled |

---

## 🔄 Data Flow

```
1. chatSource.ts    → Observes Twitch chat DOM via BrowserView
2. IPC              → Messages sent to renderer process
3. displayController.ts → Manages queue and timing
4. avatarUI.ts      → Renders avatar + speech bubble
5. avatarAnimator.ts → GSAP animations (mouth, eyes)
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TWITCH_CHAT_URL` | — | 📺 Twitch popout URL (**required**) |
| `DISPLAY_SECONDS` | `5` | ⏱️ Message display duration |
| `OVERLAY_ANCHOR` | `bottom-left` | 📍 Position on screen |
| `OVERLAY_MARGIN` | `24` | 📏 Margin in pixels |
| `MAX_MESSAGE_LENGTH` | `140` | ✂️ Truncate long messages |
| `IGNORE_COMMAND_PREFIX` | `!` | 🚫 Ignore commands |
| `IGNORE_USERS` | — | 👤 Ignored usernames (comma-separated) |
| `DIAGNOSTICS` | `0` | 🔍 Enable diagnostic logs |

---

## 📝 Code Conventions

- ✅ TypeScript strict mode (`strict: true`)
- ✅ CommonJS for Electron compatibility
- ✅ Shared types in `src/shared/types/`
- ✅ Renderer scripts loaded via `<script>` tags
- ✅ GSAP copied to `dist/renderer/vendor/`

---

## ⚠️ Important Notes

| Aspect | Detail |
|--------|--------|
| **Overlay Window** | Transparent, ignores mouse events |
| **Chat Source** | Uses MutationObserver on Twitch DOM |
| **Deduplication** | Messages filtered by ID |
| **Queue** | Limited size, drops oldest when full |
| **Config Storage** | JSON in `app.getPath('userData')` |
| **i18n** | English + Portuguese in config wizard |

---

<!-- OPENSPEC:START -->
## 📋 OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.
<!-- OPENSPEC:END -->
