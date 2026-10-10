## ADDED Requirements

### Requirement: Locking blocks loading and updating saved layouts
While the layout is locked, the system SHALL refuse to load a saved layout or to update a saved layout from the current layout, telling the user to unlock. Saving a new entry, renaming and deleting SHALL remain available because they do not change the live layout.

#### Scenario: Load while locked
- **WHEN** the layout is locked and the user tries to load a saved layout
- **THEN** the layout is unchanged and the user is told to unlock

#### Scenario: Save while locked
- **WHEN** the layout is locked and the user saves the current layout
- **THEN** a new entry is added
