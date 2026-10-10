# layout-lock Specification

## Purpose
TBD - created by archiving change extract-state-and-history. Update Purpose after archive.
## Requirements
### Requirement: Locking blocks layout edits
While the layout is locked, the system SHALL refuse undo and redo, and the UI SHALL refuse arranging, adding, moving, resizing and deleting frames, telling the user to unlock.

#### Scenario: Undo while locked
- **WHEN** the layout is locked and undo is requested
- **THEN** nothing changes and undo/redo are reported unavailable

#### Scenario: Unlock restores editing
- **WHEN** the layout is unlocked
- **THEN** undo and redo work again with history intact

### Requirement: Lock persists
The lock state SHALL be saved and restored with the plan.

#### Scenario: Reload locked
- **WHEN** the page reloads after locking
- **THEN** the layout is still locked

### Requirement: Locking blocks loading and updating saved layouts
While the layout is locked, the system SHALL refuse to load a saved layout or to update a saved layout from the current layout, telling the user to unlock. Saving a new entry, renaming and deleting SHALL remain available because they do not change the live layout.

#### Scenario: Load while locked
- **WHEN** the layout is locked and the user tries to load a saved layout
- **THEN** the layout is unchanged and the user is told to unlock

#### Scenario: Save while locked
- **WHEN** the layout is locked and the user saves the current layout
- **THEN** a new entry is added
