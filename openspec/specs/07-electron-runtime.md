# Electron Runtime

## Purpose
This document defines the runtime architecture for the MVP, including process boundaries, responsibilities, and communication flow. The runtime is responsible for hosting the chat source, display controller, and avatar UI in a stable desktop overlay.

The runtime must remain simple, predictable, and aligned with the MVP scope.

---

## Process model
- The application uses Electron with a main process and a single renderer process.
- The main process is responsible for:
  - Application lifecycle management.
  - Window creation and configuration.
  - Hosting the Chat Source logic.
- The renderer process is responsible for:
  - Display Controller logic.
  - Avatar UI rendering.

---

## Window configuration (overlay)
- A single overlay window is created at startup.
- The window is:
  - Frameless.
  - Transparent.
  - Always-on-top.
- The window is intended to be captured by streaming software.
- The window does not accept direct user input in the MVP.

---

## Communication model (IPC)
- Communication between main and renderer uses explicit IPC messages.
- The Chat Source emits Chat Message Events in the main process.
- Events are forwarded to the renderer via IPC.
- The renderer does not communicate directly with the chat source.

---

## Data flow
1. Application starts.
2. Main process creates the overlay window.
3. Main process initializes the Chat Source with a configured URL.
4. Chat Source emits normalized Chat Message Events.
5. Events are sent to the renderer via IPC.
6. Renderer enqueues messages and applies display rules.
7. Avatar UI renders the active message.

---

## Error handling and stability
- Chat Source failures must not crash the application.
- When the chat source is unavailable, no message events are emitted.
- Renderer must remain idle when no messages are present.
- IPC failures must fail silently without blocking the UI.

---

## Configuration (MVP)
- Configuration is static at startup.
- The only required configuration is the chat popout URL.
- No runtime configuration UI is provided in the MVP.

---

## Non-goals
- No multi-window support.
- No plugin or extension system.
- No hot reload or dynamic reconfiguration.
- No LLM or AI integration.
