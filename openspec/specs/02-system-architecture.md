# System Architecture

## High-level components
- Chat Source: connects to a chat feed and emits normalized Chat Message Events.
- Display Controller: queues events, selects the next message, and controls timing.
- Avatar UI: renders the avatar and message bubble based on display commands.

## Data flow
1. The Chat Source observes the configured Twitch popout chat and detects new messages.
2. Each message is normalized into the canonical event format.
3. The Display Controller enqueues events as they arrive.
4. When idle, the Display Controller dequeues one event and instructs the Avatar UI to show it.
5. After N seconds, the Display Controller instructs the Avatar UI to hide and moves to the next queued message.

## Clear separation of responsibilities
- Chat Source only produces events and handles source availability; it does not decide display timing or UI behavior.
- Display Controller owns queueing, timing, and selection logic; it does not parse chat DOM or render UI.
- Avatar UI only renders based on controller commands and does not manage the queue or source state.
- All component communication uses the canonical Chat Message Event or simple show/hide commands derived from it.
