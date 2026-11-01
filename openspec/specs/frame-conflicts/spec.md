# frame-conflicts Specification

## Purpose
TBD - created by archiving change fix-and-extract-layout-engine. Update Purpose after archive.
## Requirements
### Requirement: Flag frames that extend past the wall
The system SHALL flag any visible frame whose rectangle extends beyond the wall with the message `Extends past the wall`, ignoring overshoots under 0.001 inch. Obstacles and hidden pieces SHALL NOT be flagged.

#### Scenario: Frame hangs off the right edge
- **WHEN** a frame's right edge is beyond the wall width
- **THEN** it is flagged `Extends past the wall`

#### Scenario: Frame exactly on the wall edge
- **WHEN** a frame's edge coincides with the wall edge
- **THEN** it is not flagged

#### Scenario: Obstacle past the wall
- **WHEN** an obstacle extends beyond the wall
- **THEN** it is not flagged

#### Scenario: Hidden frame past the wall
- **WHEN** a hidden frame extends beyond the wall
- **THEN** it is not flagged

### Requirement: Flag frames outside the gallery area
When a gallery area is set, the system SHALL flag each non-obstacle frame not fully inside it with `Outside the gallery area`, unless it already has a wall conflict. Obstacles are exempt.

#### Scenario: Frame outside area
- **WHEN** an area is set and a frame lies partly outside it but on the wall
- **THEN** the frame is flagged `Outside the gallery area`

#### Scenario: Obstacle outside area
- **WHEN** an obstacle lies outside the area
- **THEN** it is not flagged

### Requirement: Flag overlapping frames
The system SHALL flag both frames of any overlapping pair of visible, non-obstacle frames with `Overlaps <other name>`, keeping an earlier flag if one exists. Touching edges are not overlap. Obstacles and hidden pieces SHALL NOT take part in overlap checks.

#### Scenario: Overlap
- **WHEN** frames A and B overlap
- **THEN** A is flagged `Overlaps B` and B is flagged `Overlaps A`

#### Scenario: Touching
- **WHEN** two frames share an edge only
- **THEN** neither is flagged

#### Scenario: Frame over an obstacle
- **WHEN** a frame overlaps an obstacle
- **THEN** neither is flagged

#### Scenario: Hidden frame overlap
- **WHEN** a hidden frame overlaps a visible frame
- **THEN** neither is flagged

