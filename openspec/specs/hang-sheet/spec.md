# hang-sheet Specification

## Purpose
TBD - created by archiving change extract-plan-io. Update Purpose after archive.
## Requirements
### Requirement: Per-frame hang measurements
The hang sheet SHALL list every non-obstacle frame, numbered in plan order, with its size, left edge distance from the wall's left, top edge distance below the ceiling, bottom edge height above the floor, and hook position (distance from left and height above the floor).

#### Scenario: Measurements from ceiling and floor
- **WHEN** a 10×20 frame at x=5, y=8 is on a 100×96 wall with a 2-inch hook offset
- **THEN** left is 5, right gap is 85, top is 8, bottom above floor is 68, hook from left is 10 and hook above floor is 86

#### Scenario: Obstacles excluded
- **WHEN** the plan contains an obstacle
- **THEN** it is absent from the sheet and does not consume a number

### Requirement: Copy as text
The system SHALL produce a plain-text version of the sheet containing the wall size, the hook offset, and one line per frame with all measurements, formatted in the current unit.

#### Scenario: Text in centimeters
- **WHEN** the unit is cm
- **THEN** all lengths in the text use `cm`

### Requirement: Conflict warning
When any frame has a conflict, the sheet SHALL show a warning stating how many frames have a conflict and to fix them before hanging.

#### Scenario: Singular and plural
- **WHEN** one frame is in conflict
- **THEN** the warning reads "1 frame has a conflict"
- **WHEN** two are
- **THEN** it reads "2 frames have a conflict"

