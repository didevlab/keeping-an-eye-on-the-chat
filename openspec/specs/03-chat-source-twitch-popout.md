# Chat Source: Twitch Popout

## Input configuration (URL)
- Input is a single Twitch popout chat URL string.
- The source treats an empty or invalid URL as unavailable and emits no message events.
- If the URL becomes unreachable at runtime, the source enters an unavailable state and stops emitting events.

## DOM observation strategy (high-level)
- Load or attach to the Twitch popout chat document in an embedded browser context.
- Observe the chat message container for newly added message nodes.
- Process only newly added nodes; ignore removals, edits, and historical messages for the MVP.
- DOM observation is best-effort and may miss messages under high load.

## Message extraction rules
- Extract the display name for `user`.
- Extract the visible message content for `text` without additional parsing or transformation.
- Use a message identifier from the DOM when available.
- If no identifier is present, derive a locally stable identifier based on capture order and message content.
- Use a timestamp from the DOM if present; otherwise use the local capture time in milliseconds.
- Ignore system notices, moderation messages, and UI elements that do not represent a user message.

## Normalization into Chat Message Event
All captured messages must be normalized to the following canonical format:


```
{
  id: string,
  user: string,
  text: string,
  timestamp: number
}
```


All fields are required. `timestamp` must be Unix time in milliseconds.

## Ordering guarantees
- Message ordering is best-effort.
- Ordering is primarily based on capture time.
- The system does not guarantee perfect ordering during high-volume chat activity.

## Known limitations and failure modes
- DOM structure or class name changes may break message extraction.
- Popout chat availability depends on network access and Twitch uptime.
- High-volume chat may cause missed, duplicated, or reordered messages.
- Some messages may lack timestamps, requiring capture-time fallback.
- Derived message identifiers are local to the current session and must not be treated as globally unique.

