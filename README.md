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

Run:
```
# After clone/pull:
npm install

# OBS / overlay mode (quiet, no debug UI)
TWITCH_CHAT_URL="https://www.twitch.tv/popout/<channel>/chat" npm run start:overlay

# Diagnostics mode (logs + debug UI)
TWITCH_CHAT_URL="https://www.twitch.tv/popout/<channel>/chat" npm run start:diag

# Optional devtools (dev only)
DEVTOOLS=1 npm start
```

Build (Windows):
```
# Produces dist/ with a Windows installer
npm run build:win
```

Packaged runs (Windows env vars):
```
# PowerShell (temporary for this session)
$env:TWITCH_CHAT_URL="https://www.twitch.tv/popout/<channel>/chat"
& ".\\dist\\win-unpacked\\Keeping an Eye on the Chat.exe"

# Command Prompt (temporary for this session)
set TWITCH_CHAT_URL=https://www.twitch.tv/popout/<channel>/chat
"dist\\win-unpacked\\Keeping an Eye on the Chat.exe"

# System-wide (persistent)
setx TWITCH_CHAT_URL "https://www.twitch.tv/popout/<channel>/chat"
```

Production defaults: OVERLAY_DEBUG=0 and DIAGNOSTICS=0 unless explicitly set.

Environment variables:
- TWITCH_CHAT_URL: Twitch popout chat URL.
- DISPLAY_SECONDS (default 5): display duration per message.
- OVERLAY_DEBUG (default 0/1 based on dev): show debug UI when 1.
- DIAGNOSTICS (default 0): enable diagnostic logs when 1.
- DEVTOOLS (default 0): open devtools in dev when 1.
- OVERLAY_ANCHOR (default bottom-left): bottom-left | bottom-right | top-left | top-right.
- OVERLAY_MARGIN (default 24): margin in pixels.
- BUBBLE_MAX_WIDTH (default 420): maximum bubble width in pixels.
- MAX_MESSAGE_LENGTH (default 140): truncate and append an ellipsis when longer.
- IGNORE_COMMAND_PREFIX (default "!"): ignore messages starting with this prefix.
- IGNORE_USERS (default empty): comma-separated usernames to ignore (case-insensitive).
- MAX_QUEUE_LENGTH (default 50): drop oldest messages when queue exceeds this length.
