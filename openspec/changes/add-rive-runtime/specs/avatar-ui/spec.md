## ADDED Requirements
### Requirement: Optional Rive mascot asset loading
The renderer SHALL attempt to load a local Rive mascot asset at startup and initialize it when the required artboard and state machine are present.

#### Scenario: Asset available
- **WHEN** the mascot asset file exists and the artboard/state machine names match
- **THEN** the renderer initializes the mascot animation without changing message timing

#### Scenario: Asset missing or invalid
- **WHEN** the mascot asset file is missing, fails to load, or the names do not match
- **THEN** the renderer continues using the existing CSS avatar without crashing

#### Scenario: Packaged build asset resolution
- **WHEN** the renderer runs from a packaged file URL
- **THEN** the mascot asset path is resolved relative to the renderer and loading is attempted

### Requirement: Diagnostics-only mascot loading logs
The renderer SHALL emit mascot loading logs only when diagnostics mode is enabled.

#### Scenario: Diagnostics disabled
- **WHEN** diagnostics mode is off
- **THEN** no mascot loading logs are emitted

#### Scenario: Diagnostics enabled
- **WHEN** diagnostics mode is on and mascot loading is attempted
- **THEN** the renderer logs load success or failure details

### Requirement: Mascot reaction heuristics
The renderer SHALL drive mascot reactions deterministically based on active message content.

#### Scenario: Message becomes active
- **WHEN** a message becomes active
- **THEN** the renderer sets the mascot to talking
- **AND** triggers a react animation when the message contains an @-mention, the channel name, is emoji-heavy, or exceeds 70% of the max message length

#### Scenario: Message ends
- **WHEN** the active message clears
- **THEN** the renderer stops talking and returns the mascot to idle
