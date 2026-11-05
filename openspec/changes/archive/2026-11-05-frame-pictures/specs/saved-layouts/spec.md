## MODIFIED Requirements

### Requirement: What a saved layout contains
A saved layout SHALL contain the wall size, gallery area, frames and next id only. Each frame SHALL keep its picture key, so loading the layout on the same device shows the pictures again; picture data itself is not copied into the layout. It SHALL NOT contain calibration, projector settings, lock state, selection or unit.

#### Scenario: Load keeps device settings
- **WHEN** a saved layout is loaded after the calibration and unit were changed
- **THEN** the calibration and unit are unchanged

#### Scenario: Pictures come back
- **WHEN** a layout is saved with a picture on a frame, the frame's picture is removed, and the layout is loaded
- **THEN** the frame shows the picture again
