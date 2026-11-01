## ADDED Requirements

### Requirement: Margin settings persist
The visual margin and the projection Margins toggle SHALL be saved with the rest of the state and restored on the next visit. State saved before these settings existed SHALL take the defaults (margin 3 inches, Margins on).

#### Scenario: Restore margin
- **WHEN** the margin is set to 5 and the app is reloaded
- **THEN** the margin is still 5

#### Scenario: Older save
- **WHEN** saved state lacks `margin` and `proj.margin`
- **THEN** the margin is 3 inches and the projection Margins toggle is on
