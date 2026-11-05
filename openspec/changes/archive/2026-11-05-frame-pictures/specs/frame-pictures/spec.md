## ADDED Requirements

### Requirement: Attach a picture to a frame
A selected frame (not an obstacle) SHALL offer "Add picture" in its properties, opening a file chooser limited to images. The chosen image SHALL be downscaled in the browser so its long side is at most 1000 px (never enlarged), stored locally as a JPEG, and linked to the frame by a random `img` key. A frame that already has a picture SHALL offer "Replace picture" and "Remove picture" instead. Each of attach, replace and remove SHALL be one undo step and SHALL be refused while the layout is locked.

#### Scenario: Add a picture
- **WHEN** an image file is chosen for a frame
- **THEN** the frame shows that picture and the properties panel offers Replace and Remove

#### Scenario: Large image is downscaled
- **WHEN** a 4000 × 3000 image is chosen
- **THEN** the stored picture is 1000 × 750

#### Scenario: Small image is not enlarged
- **WHEN** a 300 × 200 image is chosen
- **THEN** the stored picture is 300 × 200

#### Scenario: Not an image
- **WHEN** a file that cannot be decoded as an image is chosen
- **THEN** a toast says so and the frame is unchanged

#### Scenario: Remove then undo
- **WHEN** a frame's picture is removed and Undo is pressed
- **THEN** the picture is shown again

#### Scenario: Locked layout
- **WHEN** the layout is locked and Add picture is used
- **THEN** the lock message is shown and the frame is unchanged

#### Scenario: Obstacles have no picture
- **WHEN** an obstacle is selected
- **THEN** the properties panel does not offer Add picture

### Requirement: Picture display
A frame with a picture SHALL show it covering the whole frame, with the frame's number and name remaining readable, in the design view and in projection mode in every style (outline, wash and solid). In mono projection the picture SHALL be greyscale. A conflict marking SHALL still be visible over a picture. A picture SHALL NOT appear on the hang sheet. Duplicating a frame SHALL give the copy the same picture. Moving, resizing and rotating a frame SHALL keep its picture.

#### Scenario: Projection shows pictures
- **WHEN** projection mode is entered with a picture on a frame and Pictures is on
- **THEN** the frame is drawn with its picture in outline, wash and solid styles

#### Scenario: Mono projection
- **WHEN** Mono is on in projection mode
- **THEN** pictures are shown in greyscale

#### Scenario: Conflict over a picture
- **WHEN** a frame with a picture overlaps another frame
- **THEN** it is still flagged as a conflict

#### Scenario: Not on the hang sheet
- **WHEN** the hang sheet is opened
- **THEN** it contains no pictures

### Requirement: Pictures toggle in projection
The projection toolbar SHALL have a "Pictures" toggle, on by default, that shows or hides all frame pictures while projecting. The setting SHALL persist with the other projection settings, SHALL NOT be part of undo snapshots, saved layouts or plan codes, and SHALL NOT affect the design view.

#### Scenario: Hide while projecting
- **WHEN** Pictures is turned off in projection mode
- **THEN** frames are drawn without pictures and the design view still shows them

#### Scenario: Setting persists
- **WHEN** Pictures is turned off and the page is reloaded
- **THEN** it is still off

#### Scenario: Duplicate
- **WHEN** a frame with a picture is duplicated
- **THEN** both frames show the picture

#### Scenario: Missing picture data
- **WHEN** a frame's `img` key has no stored picture
- **THEN** the frame is drawn as a normal frame and the properties panel offers Add picture

### Requirement: Pictures are local to this device
Picture data SHALL be stored in the browser's IndexedDB, never in `localStorage`, plan codes or the hang sheet. The frame's `img` key SHALL persist with the working plan, saved layouts and undo history. If IndexedDB is unavailable the picture SHALL be kept in memory for the session and a toast SHALL say it will not survive a reload.

#### Scenario: Survives reload
- **WHEN** a picture is added and the page is reloaded
- **THEN** the frame still shows the picture

#### Scenario: Storage unavailable
- **WHEN** IndexedDB is unavailable and a picture is added
- **THEN** the picture shows and a toast warns it will not survive a reload

### Requirement: Unreferenced pictures are cleaned up
At startup the system SHALL delete every stored picture whose key is not used by a frame in the working plan or in any saved layout. It SHALL NOT delete pictures at the moment a frame is deleted or a picture is removed, so undo and saved layouts keep working. If saved layouts cannot be read, cleanup SHALL be skipped.

#### Scenario: Orphan removed at boot
- **WHEN** a picture was removed from its only frame and the page is reloaded
- **THEN** its stored data is deleted

#### Scenario: Saved layout keeps it
- **WHEN** a picture's frame was deleted but a saved layout still has that frame and the page is reloaded
- **THEN** the stored picture is kept, and loading the layout shows it

#### Scenario: Unreadable layouts
- **WHEN** the saved-layouts data is corrupt at boot
- **THEN** no stored picture is deleted
