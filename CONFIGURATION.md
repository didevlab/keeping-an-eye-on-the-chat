# Configuration

## Windows zip build

1) Build the zip:
```
npm run build:win
```

2) Extract the zip from `dist/`.

3) Inside the extracted folder, locate the executable:
```
Keeping an Eye on the Chat.exe
```

4) Copy the helper scripts from `packaging/windows/` into the same folder as the exe.

5) Edit `run-overlay.bat` or `run-diag.bat` and set:
```
set "TWITCH_CHAT_URL=https://www.twitch.tv/popout/<channel>/chat"
```

6) Double-click the `.bat` to launch the overlay.

## Common environment variables

- `TWITCH_CHAT_URL`: Twitch popout chat URL.
- `DISPLAY_SECONDS`: Duration per message (default 5).
- `OVERLAY_ANCHOR`: bottom-left | bottom-right | top-left | top-right.
- `OVERLAY_MARGIN`: margin in pixels (default 24).
- `BUBBLE_MAX_WIDTH`: max bubble width in pixels (default 420).

Example batch customization:
```
set "TWITCH_CHAT_URL=https://www.twitch.tv/popout/<channel>/chat"
set "DISPLAY_SECONDS=3"
set "OVERLAY_ANCHOR=bottom-right"
set "OVERLAY_MARGIN=32"
```

## All Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TWITCH_CHAT_URL` | (empty) | Twitch popout chat URL. Required for chat to work. |
| `DISPLAY_SECONDS` | 5 | Duration per message in seconds. |
| `OVERLAY_DEBUG` | 0 (prod) / 1 (dev) | Show debug UI when set to 1. |
| `DIAGNOSTICS` | 0 | Enable diagnostic logs when set to 1. |
| `DEVTOOLS` | 0 | Open devtools in dev mode when set to 1. |
| `OVERLAY_ANCHOR` | bottom-left | Position: bottom-left, bottom-right, top-left, top-right. |
| `OVERLAY_MARGIN` | 24 | Margin from screen edge in pixels. |
| `BUBBLE_MAX_WIDTH` | 420 | Maximum chat bubble width in pixels. |
| `MAX_MESSAGE_LENGTH` | 140 | Truncate messages longer than this. |
| `IGNORE_COMMAND_PREFIX` | ! | Ignore messages starting with this prefix. |
| `IGNORE_USERS` | (empty) | Comma-separated usernames to ignore (case-insensitive). |
| `MAX_QUEUE_LENGTH` | 50 | Drop oldest messages when queue exceeds this. |
| `EXIT_ANIMATION_MS` | 400 | Exit animation duration in milliseconds. |

## Troubleshooting

### ERR_NAME_NOT_RESOLVED

This error occurs when the Twitch URL cannot be resolved. Check:
1. Network connectivity
2. The URL format is correct: `https://www.twitch.tv/popout/<channel>/chat`
3. The channel name is valid

### Chat not loading

If the hidden chat window doesn't load:
1. Check `TWITCH_CHAT_URL` is set correctly
2. Run with `DIAGNOSTICS=1` to see detailed logs
3. Verify the channel is live and has an active chat

### Observer attachment timeout

If you see "Chat source observer attachment timed out after 10s":
1. The Twitch page may have changed its DOM structure
2. Check the selectors in `chatSource.js` match current Twitch HTML
3. Try reloading with `DIAGNOSTICS=1` for more details
