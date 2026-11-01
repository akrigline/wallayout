## ADDED Requirements

### Requirement: Save the current layout under a name
The system SHALL let the user save the current wall size, gallery area, frames and next id as a new named entry. A blank name SHALL be replaced by a default of the form "Layout N", where N is one more than the highest existing default number. Names SHALL be trimmed, and duplicate names SHALL be allowed.

#### Scenario: Save with a name
- **WHEN** the user saves the current layout as "Salon wall"
- **THEN** a new entry named "Salon wall" appears at the top of the list

#### Scenario: Blank name gets a default
- **WHEN** the user saves with an empty name and entries "Layout 1" and "Layout 2" exist
- **THEN** the new entry is named "Layout 3"

#### Scenario: Saving does not alter the live layout
- **WHEN** the user saves, then edits a frame
- **THEN** the saved entry still holds the layout as it was when saved

### Requirement: Saved layouts persist separately from the working plan
Saved layouts SHALL be stored in their own browser storage key and SHALL survive a reload. A missing, unreadable or malformed stored list SHALL be treated as empty without affecting the working plan.

#### Scenario: Reload keeps saves
- **WHEN** the page is reloaded after saving two layouts
- **THEN** both layouts are listed

#### Scenario: Corrupt saved list
- **WHEN** the stored saved-layouts data is not valid
- **THEN** the list is empty and the current plan loads normally

### Requirement: What a saved layout contains
A saved layout SHALL contain the wall size, gallery area, frames and next id only. It SHALL NOT contain calibration, projector settings, lock state, selection or unit.

#### Scenario: Load keeps device settings
- **WHEN** a saved layout is loaded after the calibration and unit were changed
- **THEN** the calibration and unit are unchanged

### Requirement: List saved layouts
The system SHALL list saved layouts newest first. Each entry SHALL show a thumbnail of the layout, its name, when it was saved, and a summary of its frame count and wall size in the current unit. When none exist the system SHALL show a short note explaining saved layouts.

#### Scenario: Entry summary
- **WHEN** a layout with 7 frames on a 120 × 96 in wall is saved
- **THEN** its entry shows "7 frames" and the wall size

#### Scenario: Empty list
- **WHEN** no layouts are saved
- **THEN** the panel shows an explanatory note instead of cards

### Requirement: Thumbnails reflect the layout
The system SHALL generate each thumbnail from the saved data, showing the wall outline, the gallery area when set, and one shape per frame, scaled to fit.

#### Scenario: One shape per frame
- **WHEN** a thumbnail is generated for a layout with 5 frames
- **THEN** it contains 5 frame shapes

#### Scenario: Empty wall
- **WHEN** a thumbnail is generated for a layout with no frames
- **THEN** it shows the wall outline with no frame shapes

### Requirement: Load a saved layout
The system SHALL replace the current wall size, gallery area and frames with those of a chosen saved layout, SHALL clear the selection if the selected frame no longer exists, and SHALL show a confirmation toast. Loading SHALL NOT require a confirmation prompt.

#### Scenario: Load restores the layout
- **WHEN** the user saves, rearranges the frames, then loads the saved entry
- **THEN** the frames are back where they were when saved

### Requirement: Update a saved layout
The system SHALL let the user overwrite an existing entry with the current layout after confirming the entry's name. The entry SHALL keep its name and move to the top of the list by its new saved time.

#### Scenario: Update after tweaking
- **WHEN** the user loads an entry, moves a frame, and confirms Update on that entry
- **THEN** loading that entry later shows the moved frame

#### Scenario: Update declined
- **WHEN** the user cancels the Update confirmation
- **THEN** the entry is unchanged

### Requirement: Rename and delete
The system SHALL let the user rename an entry, applying the same trimming and default-name rules as saving, and delete an entry after confirming.

#### Scenario: Delete confirmed
- **WHEN** the user confirms deleting an entry
- **THEN** it no longer appears in the list

#### Scenario: Rename to blank
- **WHEN** the user renames an entry to an empty name
- **THEN** it receives a default "Layout N" name

### Requirement: Storage failures are reported
If a saved-layouts write fails, the system SHALL show an error message and SHALL NOT show an entry that was not stored.

#### Scenario: Storage full
- **WHEN** saving fails because storage is full or unavailable
- **THEN** an error toast is shown and the list is unchanged

### Requirement: Layouts panel access
The system SHALL provide a "Layouts" button in the header that opens the saved-layouts panel, and the panel SHALL close from its Close button or by clicking outside it.

#### Scenario: Open and close
- **WHEN** the user clicks Layouts and then Close
- **THEN** the panel opens and then hides
