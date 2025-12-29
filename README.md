# Keeping an Eye on the Chat

Lightweight desktop overlay that watches a live chat feed and shows incoming messages with an animated avatar and bubble.

MVP scope:
- Observe a Twitch popout chat feed via DOM observation.
- Normalize messages into a simple event format.
- Queue messages and show one at a time for a fixed duration.
- Keep the avatar and bubble in sync; hide when idle.
- Fail gracefully if the chat source is unavailable.

Non-goals:
- No chatbot, LLM integration, moderation, storage, or audio.
- No complex configuration UI or advanced filtering.

OpenSpec:
- Project specs live in `openspec/specs/`.
- Specs are the source of truth for MVP behavior.
- See the numbered spec files for architecture and rules.
