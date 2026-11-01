## MODIFIED Requirements

### Requirement: Per-frame hang measurements
The hang sheet SHALL list every visible non-obstacle frame, numbered in plan order, with its size, left edge distance from the wall's left, top edge distance below the ceiling, bottom edge height above the floor, and, for each of its hooks, the hook's distance from the wall's left and height above the floor. A frame with several hooks SHALL show them numbered 1, 2, … in both the table and the text. Obstacles SHALL be omitted and SHALL NOT consume a number. Hidden frames SHALL be omitted but keep their number, so the remaining frames are not renumbered. When pieces are hidden the sheet SHALL say how many are not listed.

#### Scenario: Measurements from ceiling and floor
- **WHEN** a 10×20 frame at x=5, y=8 is on a 100×96 wall with a 2-inch default hook offset
- **THEN** left is 5, right gap is 85, top is 8, bottom above floor is 68, hook from left is 10 and hook above floor is 86

#### Scenario: Obstacles excluded
- **WHEN** the plan contains an obstacle
- **THEN** it is absent from the sheet and does not consume a number

#### Scenario: Two hooks
- **WHEN** a 20×10 frame at x=0, y=10 on a 100×96 wall has hooks at (5, 2) and (15, 2) from its top-left
- **THEN** the sheet lists hook 1 at 5 from the left and 84 above the floor and hook 2 at 15 from the left and 84 above the floor

#### Scenario: Hidden pieces omitted
- **WHEN** two frames are hidden
- **THEN** they are absent, the other frames keep their numbers, and the sheet states that 2 hidden pieces are not listed

### Requirement: Copy as text
The system SHALL produce a plain-text version of the sheet containing the wall size, the default hook offset, and one line per visible frame with all measurements, formatted in the current unit, listing every hook of a multi-hook frame.

#### Scenario: Text in centimeters
- **WHEN** the unit is cm
- **THEN** all lengths in the text use `cm`

#### Scenario: Multi-hook text
- **WHEN** a frame has two hooks
- **THEN** its line reads `Hooks: 1) … from left, … above floor; 2) … from left, … above floor.`
