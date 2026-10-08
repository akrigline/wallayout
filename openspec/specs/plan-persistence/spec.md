# plan-persistence Specification

## Purpose
TBD - created by archiving change extract-state-and-history. Update Purpose after archive.
## Requirements
### Requirement: Autosave and restore
The system SHALL save the whole state (plan, settings, calibration, projection style, selection, lock) to browser storage under the versioned key `galleryWallPlanner.v1` whenever it changes, and restore it on the next visit.

#### Scenario: Restore after reload
- **WHEN** state was saved and the app starts again
- **THEN** the saved wall, frames and settings are restored and the visit is not treated as fresh

### Requirement: Saved state merges over defaults
Saved state SHALL be merged over the current defaults, including the nested calibration and projection settings, so fields added in newer versions get default values.

#### Scenario: Older save missing newer fields
- **WHEN** saved state lacks `proj.mono` and `cal.custom`
- **THEN** those fields take their default values and the rest of the save is kept

### Requirement: Storage failure is harmless
The system SHALL start with defaults when storage is missing, unreadable, throws, or holds corrupt JSON, and SHALL ignore failures when saving.

#### Scenario: Corrupt save
- **WHEN** the stored value is `{not json`
- **THEN** the app starts with defaults and treats the visit as fresh

#### Scenario: Storage throws on write
- **WHEN** saving throws a quota or security error
- **THEN** the app continues without an exception

### Requirement: Starter plan on first visit
On a fresh visit the system SHALL populate the starter frames and auto-arrange them without error.

#### Scenario: First visit
- **WHEN** no saved state exists
- **THEN** seven starter frames are placed on the wall

