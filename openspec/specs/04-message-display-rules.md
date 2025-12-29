# Message Display Rules

## Queue behavior
- Incoming messages are appended to a FIFO queue.
- Messages are removed from the queue when they begin display.
- Only one message is displayed at a time.
- The display controller is non-concurrent and non-preemptive.
- When the queue is empty, the avatar and message bubble remain hidden.

## Timing rules
- When a message is selected for display, the avatar and message bubble appear together.
- The message remains visible for a fixed duration of N seconds.
- After the duration elapses, the avatar and message bubble hide together.
- The next message is not displayed until the current message lifecycle completes.

## Deduplication assumptions
- Chat Sources are expected to emit unique `id` values per message.
- If a message with a previously seen `id` is received, the later event is ignored.
- Deduplication is based solely on `id`; no content-based comparison is performed in the MVP.

## Rate limiting expectations
- The queue acts as the only rate-limiting mechanism.
- Bursts of messages increase queue length but do not alter display timing.
- Messages are not intentionally dropped in the MVP.
- No backpressure or queue size limits are applied in the MVP.

## Failure and edge cases
- Empty queue: UI remains hidden until a message becomes available.
- Burst of messages: queue grows; messages are displayed sequentially.
- Source outage: the controller remains idle and resumes when new messages arrive.
- UI or animation failure: the system waits for the fixed duration and proceeds to the next message.
