# MVP Milestones

## 1. Spec baseline
Completion criteria:
- All MVP behavior is documented in `openspec/specs/`.
- Specs for chat source, display rules, avatar UI, and runtime are finalized.
- README summarizes project intent and MVP scope.

## 2. Runtime and overlay shell
Completion criteria:
- Application launches successfully.
- A transparent, always-on-top overlay window is created.
- The overlay can be captured by streaming software.
- No chat source or UI logic is active yet.

## 3. Chat Source (Twitch popout)
Completion criteria:
- Given a valid Twitch popout chat URL, new chat messages are detected.
- Each message is normalized into a Chat Message Event.
- The source handles unavailable or unreachable chat without crashing.

## 4. Display Controller
Completion criteria:
- Messages are queued FIFO.
- Only one message is active at a time.
- Display duration is fixed to N seconds per message.
- Duplicate message ids are ignored.

## 5. Avatar UI
Completion criteria:
- Avatar and message bubble appear together and hide together.
- Bubble displays the active user and text with wrapping.
- Animations are simple and do not block message timing.

## 6. End-to-end MVP flow
Completion criteria:
- With a live Twitch popout chat, messages appear sequentially in the overlay.
- Empty queue leaves the overlay hidden.
- Source outages do not crash the application.
- The system remains stable during a basic live session.
