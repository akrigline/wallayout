## ADDED Requirements

### Requirement: Four-corner calibration
In projection mode the system SHALL show four draggable numbered handles that map the wall (or a taped-off sub-area) onto the projector, with nudging by arrow keys (1 px, Shift 10 px) on a selected handle, a reference overlay, and Reset and Done controls. Calibration SHALL be saved.

#### Scenario: First projection
- **WHEN** the user enters projection mode with no saved calibration
- **THEN** calibration starts automatically with handles inset on the screen

#### Scenario: Done
- **WHEN** the user presses Done
- **THEN** calibration is marked set, handles hide, and the layout shows

### Requirement: Taped-off sub-area
The system SHALL let the user declare that the projector reaches only a taped area and enter its left, top, width and height, after which the corners map that area instead of the whole wall.

#### Scenario: Custom area
- **WHEN** the custom-area option is checked
- **THEN** reference fields appear and calibration restarts for that rectangle

### Requirement: Projection styles and toggles
The system SHALL offer outline, wash and solid styles and toggles for labels, hooks, grid, wall edge and all-white, persisted with the plan.

#### Scenario: Style choice
- **WHEN** Solid is chosen
- **THEN** frames render with filled color and the choice persists across reloads

### Requirement: Presentation controls
The system SHALL support fullscreen, hiding controls (H key or button; double-click empty space restores), locking the layout, opening the hang sheet, and exiting with Escape or Exit.

#### Scenario: Hide controls
- **WHEN** Hide controls is pressed
- **THEN** the toolbar and frame selection are hidden until H or a double-click on empty space

### Requirement: True scale
In projection mode the wall plane SHALL be drawn so that 12″ (or 25 cm) grid lines and line widths stay constant in wall units regardless of perspective scale.

#### Scenario: Grid spacing
- **WHEN** Grid is on
- **THEN** lines are 12 inches (25 cm in cm mode) apart on the wall
