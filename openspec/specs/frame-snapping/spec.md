# frame-snapping Specification

## Purpose
TBD - created by archiving change fix-and-extract-layout-engine. Update Purpose after archive.
## Requirements
### Requirement: Snap to edges, centers and neighbors
While dragging with snapping enabled, the system SHALL snap a frame's left/center/right and top/middle/bottom to the wall and gallery-area edges and centers, and to other frames' edges, centers, and edges offset by the gap, when within a threshold of 8 screen pixels, and report a guide line per snapped axis.

#### Scenario: Snap to neighbor with gap
- **WHEN** a dragged frame's left edge is within the threshold of another frame's right edge plus the gap
- **THEN** its x moves to exactly that position and a vertical guide is reported there

#### Scenario: Nearest candidate wins
- **WHEN** several snap targets are in range on one axis
- **THEN** the closest one is used

#### Scenario: Out of range
- **WHEN** no target is within the threshold
- **THEN** the position is unchanged and no guides are reported

### Requirement: Grid snap
When a grid size is set, the system SHALL round each axis to the grid unless that axis snapped to a target.

#### Scenario: Grid only on unsnapped axis
- **WHEN** grid is 1 and x snaps to a neighbor but y does not
- **THEN** x keeps the neighbor position and y is rounded to the grid

#### Scenario: Grid with snapping off
- **WHEN** snapping is disabled and grid is 0.5
- **THEN** both axes round to 0.5

### Requirement: Bypass snapping
The system SHALL skip all snapping and grid rounding when the caller requests free movement (Alt held).

#### Scenario: Free move
- **WHEN** free movement is requested
- **THEN** the requested position is returned unchanged

### Requirement: Place new frames in free space
The system SHALL choose a position for a new frame by scanning the gallery area in 1-inch steps for the first spot clear of existing frames by half the gap, falling back to the area's center clamped onto the wall.

#### Scenario: First free spot
- **WHEN** the top-left of the area is occupied
- **THEN** the new frame goes to the first clear position scanning rows then columns

#### Scenario: No room
- **WHEN** nothing fits
- **THEN** the frame is centered in the area, clamped to the wall

