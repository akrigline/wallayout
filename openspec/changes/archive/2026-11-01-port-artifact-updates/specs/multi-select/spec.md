## ADDED Requirements

### Requirement: Build a selection
The system SHALL support selecting several frames: Shift, Ctrl or Cmd-click on a frame (on the wall or in the list) toggles it, a plain click selects only it, dragging on empty wall draws a marquee that selects every visible non-obstacle frame it touches (holding Shift/Ctrl/Cmd adds to the existing selection), Ctrl/Cmd+A and "Select all" select every visible non-obstacle frame, and Escape (with no dialog open and not in projection) or "Select none" clears it. A click on empty wall without dragging SHALL clear the selection. The last-chosen member is the primary selection.

#### Scenario: Toggle with Shift
- **WHEN** frame A is selected and Shift is held while clicking frame B
- **THEN** A and B are both selected

#### Scenario: Marquee
- **WHEN** the user drags a rectangle over three frames on empty wall
- **THEN** exactly those three frames are selected, updating as the rectangle changes

#### Scenario: Select all skips obstacles and hidden pieces
- **WHEN** Select all is pressed with an obstacle and a hidden frame in the plan
- **THEN** neither is selected

### Requirement: Group panel and status line
With more than one frame selected, the properties area SHALL show "N selected", the align and distribute buttons, "Center in gallery area", "Delete selected" and "Select none", and the status line SHALL show the count, the group's overall size and its distance from the left and from the ceiling.

#### Scenario: Status line
- **WHEN** two 10×10 frames at x=0 and x=20 on one row are selected
- **THEN** the status line reports 2 selected, 30 wide overall

### Requirement: Move a group
Dragging any selected frame SHALL move all selected frames together, snapping the group's outer bounding box to wall, area and non-member frame targets (never to its own members), unless Alt is held. Arrow keys SHALL nudge every selected frame by the usual steps. A drag or nudge SHALL be one undo step. Pressing a selected frame without dragging, when several are selected, SHALL collapse the selection to that frame.

#### Scenario: Group drag
- **WHEN** three selected frames are dragged 5 inches right
- **THEN** all three move 5 inches right and keep their relative positions

#### Scenario: Collapse on click
- **WHEN** three frames are selected and one is clicked without dragging
- **THEN** only that frame remains selected

#### Scenario: Locked
- **WHEN** the layout is locked
- **THEN** a group cannot be dragged or nudged

### Requirement: Align
Align left, horizontal centers, right, top, vertical centers and bottom SHALL move every selected frame so the chosen edge or center matches the group's outer bounding box, rounding to 1/16 inch, as one undo step.

#### Scenario: Align left
- **WHEN** frames at x=4, 10 and 7 are aligned left
- **THEN** all three have x=4

### Requirement: Distribute
With three or more frames selected, distribute horizontally or vertically SHALL keep the two outermost frames fixed and set equal gaps between all of them, ordered by center, rounding to 1/16 inch, as one undo step. With fewer than three selected the buttons SHALL be disabled and the action SHALL show a message.

#### Scenario: Even gaps
- **WHEN** three 10-wide frames spanning x=0 to x=50 are distributed horizontally
- **THEN** the gaps between them are both 10

### Requirement: Group delete and center
Delete or Backspace and "Delete selected" SHALL remove every selected frame. "Center in gallery area" SHALL translate the group so its bounding box is centered in the gallery area (or wall). Both are one undo step and are refused while locked. Rotate (R) SHALL do nothing while several frames are selected.

#### Scenario: Delete group
- **WHEN** three frames are selected and Delete is pressed
- **THEN** all three are removed with one undo step

#### Scenario: Center group selection
- **WHEN** two selected frames are centered in the area
- **THEN** the center of their bounding box equals the area's center
