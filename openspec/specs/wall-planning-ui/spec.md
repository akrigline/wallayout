# wall-planning-ui Specification

## Purpose
TBD - created by archiving change split-ui-and-projection-modules. Update Purpose after archive.
## Requirements
### Requirement: Wall and settings
The system SHALL let the user set the unit (inches or centimeters), wall width and height, gap between frames, hook offset, grid snap, snapping, and hook marks, accepting tolerant length input and rejecting non-numbers with a message.

#### Scenario: Change wall size
- **WHEN** the user types a valid length such as `144` in wall width
- **THEN** the wall resizes, the gallery area is re-clamped to it, and the change is undoable

#### Scenario: Invalid input
- **WHEN** the user types `abc` in a length field
- **THEN** a "didn't look like a number" message appears and the field reverts

### Requirement: Add and edit frames
The system SHALL add frames from size chips, a custom name/size form, or a pasted list, mark items as obstacles, and edit the selected frame's name, size, position and kind, with rotate, duplicate, center left–right, center up–down and delete.

#### Scenario: Pasted list
- **WHEN** the user pastes `Harbor 24x36` and presses Add all
- **THEN** a frame named Harbor, 24 by 36, is placed in free space and selected state is cleared

#### Scenario: Clear all needs confirmation
- **WHEN** Clear all is pressed once
- **THEN** it asks for a second press within 3 seconds before deleting

### Requirement: Drag and keyboard editing
The system SHALL move frames by dragging (with snapping unless Alt is held) and by arrow keys (0.25″, Shift 1″, Alt 1/16″), rotate with R, delete with Delete/Backspace, and undo/redo with Ctrl/Cmd+Z, Shift+Ctrl+Z and Ctrl+Y.

#### Scenario: Arrow nudge
- **WHEN** a frame is selected and ArrowRight is pressed
- **THEN** it moves 0.25 inch right and the change is checkpointed shortly after

#### Scenario: Locked
- **WHEN** the layout is locked and the user drags a frame
- **THEN** the frame does not move and a locked message is shown

### Requirement: Gallery area
The system SHALL let the user limit the gallery to an area, edit it numerically or by dragging its edges and corners, and fit it to the current frames.

#### Scenario: Drag area edge
- **WHEN** the user drags the area's right edge
- **THEN** the area resizes within the wall, values round to 1/16″ on release, and the change is undoable

### Requirement: Layout conflicts are visible
Frames with conflicts SHALL be shown with a warning pattern, listed with a warning mark, and counted in the frames header.

#### Scenario: Overlap
- **WHEN** two frames overlap
- **THEN** both are styled as conflicts and the header shows "2 with conflicts"

