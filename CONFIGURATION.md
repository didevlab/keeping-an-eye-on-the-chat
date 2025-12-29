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
