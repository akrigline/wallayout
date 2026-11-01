## ADDED Requirements

### Requirement: Hidden pieces are not snap targets or obstructions
Hidden pieces SHALL NOT be snap targets, SHALL NOT count in a frame's neighbor gaps, and SHALL NOT block the free-space search for new frames.

#### Scenario: Snap ignores hidden
- **WHEN** a dragged frame is near the edge of a hidden frame only
- **THEN** it does not snap to it

#### Scenario: Placement ignores hidden
- **WHEN** a hidden frame occupies the first free spot
- **THEN** a new frame is placed there

### Requirement: Snap a group by its bounding box
When several frames are dragged together, snapping SHALL treat the group's outer bounding box as the dragged frame and SHALL exclude the group's own members from the snap targets.

#### Scenario: Group snaps to wall edge
- **WHEN** a group's bounding box left edge is within the threshold of the wall's left edge
- **THEN** the whole group moves so that edge sits on the wall edge
