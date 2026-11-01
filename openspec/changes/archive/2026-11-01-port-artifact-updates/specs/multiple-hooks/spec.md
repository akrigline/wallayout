## ADDED Requirements

### Requirement: Default and custom hooks
Every non-obstacle frame SHALL have at least one hook. A frame with no custom hooks SHALL have one default hook at the horizontal center of the frame and at the "Default hook below top" distance from its top edge. A frame MAY carry its own list of hooks, each stored as a distance from the frame's left edge and a distance below the frame's top edge. Obstacles have no hooks.

#### Scenario: Default hook
- **WHEN** a 10×20 frame has no custom hooks and the default hook distance is 2
- **THEN** its hook is 5 from its left and 2 below its top

#### Scenario: Obstacle
- **WHEN** a piece is an obstacle
- **THEN** no hook is shown and the hook controls are not offered

### Requirement: Edit hooks in the properties panel
For a single selected frame the system SHALL show a Hooks section listing each hook with editable "From left" and "Below top" fields in the current unit, a remove button per hook (disabled when only one hook remains), "Add hook" (disabled at 6 hooks), "Two hooks" (sets hooks at 25% and 75% of the width, at the first hook's height) and "Reset to default" (disabled when the frame uses the default). Entered values SHALL be clamped into the frame, rounded to 1/16 inch, and each edit SHALL be one undo step. Invalid values SHALL be rejected without change.

#### Scenario: Add a hook
- **WHEN** the user presses Add hook on a frame with one hook
- **THEN** the frame has two hooks, the new one a quarter of the width to the right of the last, at the same height

#### Scenario: Two hooks
- **WHEN** the user presses Two hooks on a 20-wide frame whose hook is 2 below the top
- **THEN** its hooks are at 5 and 15 from the left, both 2 below the top

#### Scenario: Clamped entry
- **WHEN** the user types a hook position larger than the frame
- **THEN** the hook is placed at the frame edge

#### Scenario: Reset
- **WHEN** the user presses Reset to default
- **THEN** the frame's own hooks are removed and the default hook applies

### Requirement: Drag hooks on the wall
When exactly one frame is selected, the layout is unlocked and hook marks are shown, the user SHALL be able to drag any of that frame's hook marks within the frame. Dragging SHALL snap a hook to the frame's horizontal center and to the height of its other hooks within the snap threshold unless Alt is held. While dragging, the status bar SHALL show the hook's position relative to the frame and on the wall (from the left and above the floor). Dragging a default hook SHALL turn the frame's hooks into a custom list. A drag SHALL be one undo step.

#### Scenario: Drag to center
- **WHEN** a hook is dragged to within the threshold of the frame's center
- **THEN** it snaps to the center unless Alt is held

#### Scenario: Locked
- **WHEN** the layout is locked
- **THEN** hook marks cannot be dragged

### Requirement: Rotate and resize
Rotating a frame SHALL discard its custom hooks. Changing a frame's width SHALL scale each hook's horizontal position proportionally, and changing its height SHALL limit each hook's vertical position to the new height.

#### Scenario: Rotate
- **WHEN** a frame with two custom hooks is rotated
- **THEN** it has the default hook

#### Scenario: Widen
- **WHEN** a 10-wide frame with a hook 4 from the left is changed to 20 wide
- **THEN** the hook is 8 from the left

### Requirement: Duplicate keeps hooks
Duplicating a frame SHALL copy its custom hooks to the new frame.

#### Scenario: Duplicate
- **WHEN** a frame with two custom hooks is duplicated
- **THEN** the copy has the same two hooks, independent of the original
