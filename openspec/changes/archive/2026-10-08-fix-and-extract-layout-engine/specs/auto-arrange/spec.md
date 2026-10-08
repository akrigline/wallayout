## ADDED Requirements

### Requirement: Tidy row packing
Auto-arrange SHALL pack all non-obstacle frames, largest first, into rows within the gallery area (or the whole wall), separated by the gap, vertically centering frames in each row and centering the whole cluster in the area, with positions rounded to 1/16 inch. Obstacles are not moved.

#### Scenario: Cluster is centered
- **WHEN** frames are arranged
- **THEN** the cluster's bounding box is centered in the area and no frames overlap

#### Scenario: Works without error
- **WHEN** Auto-arrange or Shuffle runs on a plan with frames (including the first-run starter plan)
- **THEN** it completes without throwing

#### Scenario: Obstacles stay put
- **WHEN** the plan contains an obstacle
- **THEN** its position is unchanged

### Requirement: Shuffle
Shuffle SHALL use the same packing with the frame order randomized by an injectable random source.

#### Scenario: Deterministic with a fixed source
- **WHEN** the same random source sequence is used twice
- **THEN** both runs produce identical positions

### Requirement: Too-big warning
When the packed cluster is taller than the area, the system SHALL still place the frames and report that they are too big to fit.

#### Scenario: Overflow
- **WHEN** frames cannot fit in the area with the given gap
- **THEN** the result reports overflow

### Requirement: Locked layouts are not arranged
Arrange, Shuffle and Center group SHALL do nothing and tell the user the layout is locked while locked.

#### Scenario: Locked
- **WHEN** the layout is locked and Auto-arrange is pressed
- **THEN** no frame moves

### Requirement: Center group
The system SHALL translate all non-obstacle frames together so their bounding box is centered in the area, rounding to 1/16 inch.

#### Scenario: Group centering
- **WHEN** Center group runs
- **THEN** relative positions are preserved and the bounding box center equals the area center
