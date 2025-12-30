# Avatar Animation QA

Run diagnostics:

```bash
TWITCH_CHAT_URL="https://www.twitch.tv/popout/<channel>/chat" DIAGNOSTICS=1 npm run start:diag
```

Checklist:
- Avatar blinks at random intervals (watch for `[diagnostics] avatar blink`).
- On message show: mouth animates and eyes look toward the bubble (`talking start`, `look left/right` logs).
- On message end: mouth returns neutral and eyes center (`talking stop`, `look center` logs).
- Closing the window stops further avatar logs (no lingering timers).
