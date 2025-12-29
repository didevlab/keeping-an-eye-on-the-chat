@echo off
setlocal

REM Replace <channel> with your Twitch channel name.
set "TWITCH_CHAT_URL=https://www.twitch.tv/popout/<channel>/chat"

REM Optional tuning
REM set "DISPLAY_SECONDS=5"
REM set "OVERLAY_ANCHOR=bottom-left"
REM set "OVERLAY_MARGIN=24"
REM set "BUBBLE_MAX_WIDTH=420"

REM Launch using run-overlay.bat or run-diag.bat after setting TWITCH_CHAT_URL.
endlocal
