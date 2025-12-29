## ADDED Requirements
### Requirement: Optional Rive mascot asset loading
The renderer SHALL attempt to load a local Rive mascot asset at startup and initialize it when the required artboard and state machine are present.

#### Scenario: Asset available
- **WHEN** the mascot asset file exists and the artboard/state machine names match
- **THEN** the renderer initializes the mascot animation without changing message timing

#### Scenario: Asset missing or invalid
- **WHEN** the mascot asset file is missing, fails to load, or the names do not match
- **THEN** the renderer continues using the existing CSS avatar without crashing

### Requirement: Diagnostics-only mascot loading logs
The renderer SHALL emit mascot loading logs only when diagnostics mode is enabled.

#### Scenario: Diagnostics disabled
- **WHEN** diagnostics mode is off
- **THEN** no mascot loading logs are emitted

#### Scenario: Diagnostics enabled
- **WHEN** diagnostics mode is on and mascot loading is attempted
- **THEN** the renderer logs load success or failure details
