# Project Overview

## Purpose
- Provide a lightweight desktop overlay for live streams.
- Observe a live chat feed and surface messages with an animated avatar and bubble.
- Prioritize simplicity, clarity, and stability.

## MVP scope
- Accept a Twitch popout chat URL as the initial chat source input.
- Normalize incoming messages into a canonical Chat Message Event.
- Queue messages and display only one at a time.
- Show the avatar and message bubble together for a fixed duration (N seconds).
- Hide the avatar and bubble together when the message times out.
- Fail gracefully when the chat source is unavailable.

## Non-goals
- No chatbot or conversational AI.
- No LLM integration.
- No message persistence or storage.
- No moderation, filtering, or command handling.
- No text-to-speech or audio output.
- No complex configuration UI.

## Success criteria
- Given a valid Twitch popout chat URL, messages appear sequentially in the overlay.
- Only one message is visible at a time, and each remains visible for N seconds.
- The avatar and bubble transition in and out together with simple animations.
- The system remains stable during a live session and stays idle when chat is unavailable.
- Components communicate only through the canonical event contract.
