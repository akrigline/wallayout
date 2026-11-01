# undo-history Specification

## Purpose
TBD - created by archiving change extract-state-and-history. Update Purpose after archive.
## Requirements
### Requirement: Snapshot history of layout edits
The system SHALL record a snapshot of the wall, gallery area, frames and next id after each committed edit, and let the user undo and redo through up to 150 snapshots.

#### Scenario: Undo and redo
- **WHEN** a frame is moved and committed, then undo, then redo
- **THEN** the frame returns to its old position and then to the new one

#### Scenario: No-op edits are not recorded
- **WHEN** a checkpoint is taken with no change since the last one
- **THEN** history does not grow

### Requirement: New edits truncate redo
Committing an edit after undoing SHALL discard the redo snapshots.

#### Scenario: Branching
- **WHEN** the user undoes twice and then edits
- **THEN** redo is unavailable

### Requirement: History cap
History SHALL keep at most 150 snapshots, dropping the oldest.

#### Scenario: Cap
- **WHEN** 200 distinct edits are committed
- **THEN** only the latest 150 snapshots remain and undo can go back 149 steps

### Requirement: What is tracked
Undo SHALL cover wall size, gallery area and frames only; unit, gap, hook, grid, snap, hook marks, projection style, calibration and lock state are not rolled back.

#### Scenario: Calibration survives undo
- **WHEN** a frame edit is undone after the calibration changed
- **THEN** the calibration is unchanged

### Requirement: Selection after restore
If the selected frame no longer exists after undo or redo, the selection SHALL clear.

#### Scenario: Undo an add
- **WHEN** the selected frame was just added and the add is undone
- **THEN** nothing is selected

### Requirement: Loading a saved layout is undoable
Loading a saved layout SHALL be recorded as one history step, so undo returns to the layout from before the load and redo reapplies it.

#### Scenario: Undo a load
- **WHEN** a saved layout is loaded and the user then undoes
- **THEN** the wall, gallery area and frames return to what they were before the load

#### Scenario: Loading the identical layout
- **WHEN** the loaded layout equals the current layout
- **THEN** history does not grow
