## ADDED Requirements

### Requirement: Loading a saved layout is undoable
Loading a saved layout SHALL be recorded as one history step, so undo returns to the layout from before the load and redo reapplies it.

#### Scenario: Undo a load
- **WHEN** a saved layout is loaded and the user then undoes
- **THEN** the wall, gallery area and frames return to what they were before the load

#### Scenario: Loading the identical layout
- **WHEN** the loaded layout equals the current layout
- **THEN** history does not grow
