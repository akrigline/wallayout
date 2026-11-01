## ADDED Requirements

### Requirement: Hidden pieces are not arranged
Auto-arrange, Shuffle and Center group SHALL leave hidden pieces where they are and SHALL ignore them when packing and when computing the group's bounding box. When no visible non-obstacle frames exist they SHALL show "Add some frames first."

#### Scenario: Hidden frame untouched
- **WHEN** Auto-arrange runs with one of three frames hidden
- **THEN** the hidden frame keeps its position and the other two are packed

#### Scenario: Only hidden frames
- **WHEN** every frame is hidden and Auto-arrange is pressed
- **THEN** a message asks to add some frames
