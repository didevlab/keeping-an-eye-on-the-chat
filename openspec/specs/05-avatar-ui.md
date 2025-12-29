# Avatar UI

## Avatar lifecycle (hidden → visible → hidden)
- The default state is hidden when no message is active.
- When a message becomes active, the avatar transitions into view using a simple animation.
- When the message display duration ends, the avatar transitions out and returns to the hidden state.
- The avatar has no interactive states and does not respond to user input.

## Message bubble behavior
- The message bubble appears and hides in sync with the avatar.
- The bubble displays the `user` name and `text` from the active message.
- Text wraps within the bubble boundaries.
- No scrolling, pagination, or dynamic resizing logic is implemented in the MVP.

## Layout assumptions
- The overlay is anchored to a consistent screen edge or corner.
- The avatar and message bubble are positioned as a single visual unit.
- Layout remains stable during the entire message display lifecycle.

## Animation constraints (simple, non-blocking)
- Animations are lightweight (e.g., fade or slide).
- Animation duration does not extend or delay the message visibility timer.
- Animations must not block queue processing or message timing.
- UI rendering failures must not stall message progression.
