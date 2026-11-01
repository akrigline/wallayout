## ADDED Requirements

### Requirement: Visual margin setting
The system SHALL keep a visual margin, in the current unit, defaulting to 3 inches, editable from a "Visual margin around art" field in the wall settings. A value of 0 SHALL hide all halos. A negative or non-numeric value SHALL be rejected with the usual "didn't look like a number" message and the field restored. The margin SHALL persist with the plan and SHALL be a setting, not part of undo history or saved layouts.

#### Scenario: Default
- **WHEN** the app starts with no saved state
- **THEN** the margin is 3 inches

#### Scenario: Zero hides halos
- **WHEN** the margin is set to 0
- **THEN** no halo is drawn for any frame

#### Scenario: Invalid value
- **WHEN** the user enters `-2` or `abc`
- **THEN** the margin is unchanged and the field shows the previous value

### Requirement: Halo around each visible frame
The system SHALL draw a faint halo extending the margin distance beyond every visible non-obstacle frame, tinted with the frame's hue. Halos SHALL be drawn beneath all frames, MAY overlap each other, and SHALL NOT affect conflicts, snapping or placement.

#### Scenario: Halo size
- **WHEN** a 10×20 frame is visible and the margin is 3
- **THEN** its halo covers 16×26 inches centered on the frame

#### Scenario: Obstacles and hidden pieces
- **WHEN** a piece is an obstacle or is hidden
- **THEN** it has no halo

#### Scenario: Overlapping halos are not conflicts
- **WHEN** two frames are closer than twice the margin but do not overlap
- **THEN** neither is flagged

### Requirement: Margins toggle in projection
The projection toolbar SHALL have a Margins toggle, on by default, that shows or hides the halos while projecting. The toggle SHALL persist with the projection settings.

#### Scenario: Hide while projecting
- **WHEN** the user turns Margins off in projection mode
- **THEN** halos are not shown on the projected wall and are still shown in design mode
