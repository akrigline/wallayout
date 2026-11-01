## ADDED Requirements

### Requirement: Obstacle layering and picking
Obstacles SHALL be drawn behind frames at reduced opacity (more opaque when selected). A click on the wall SHALL pick a visible non-obstacle frame under the pointer before any obstacle, topmost first.

#### Scenario: Frame over obstacle
- **WHEN** a frame lies over an obstacle and the overlap is clicked
- **THEN** the frame is selected

#### Scenario: Obstacle still pickable
- **WHEN** the part of an obstacle not covered by a frame is clicked
- **THEN** the obstacle is selected

### Requirement: Selection-aware keyboard editing
With a selection, Delete or Backspace SHALL delete every selected piece, arrow keys SHALL nudge every selected piece, R SHALL rotate only when exactly one piece is selected, and Escape (with no dialog open and not projecting) SHALL clear the selection. Ctrl/Cmd+A SHALL select all visible frames.

#### Scenario: Delete group
- **WHEN** three frames are selected and Delete is pressed
- **THEN** all three are removed

#### Scenario: Escape clears
- **WHEN** frames are selected, no dialog is open and the app is in design mode
- **THEN** Escape clears the selection
