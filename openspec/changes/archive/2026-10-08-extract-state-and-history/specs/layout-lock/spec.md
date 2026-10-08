## ADDED Requirements

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
