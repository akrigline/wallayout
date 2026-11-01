## MODIFIED Requirements

### Requirement: Export a plan code
The system SHALL encode the unit, wall, gallery area, visual margin, gap, default hook offset and every frame (name, size, position, hue, kind, and, when present, its custom hooks and hidden flag) as a `GWP1:`-prefixed base64 string. Frames without custom hooks or a hidden flag SHALL encode exactly as before, and every code shared before this change SHALL still decode.

#### Scenario: Round trip
- **WHEN** a plan is encoded and decoded
- **THEN** the decoded wall, area, margin, gap, hook, unit and frames equal the original, with frame ids renumbered from 1

#### Scenario: Unicode names
- **WHEN** a frame is named `Café 🌅`
- **THEN** it survives a round trip

#### Scenario: Hooks and hidden survive
- **WHEN** a frame with two custom hooks that is hidden is encoded and decoded
- **THEN** the decoded frame has the same two hooks and is hidden

#### Scenario: Plain frames unchanged
- **WHEN** a frame has no custom hooks and is visible
- **THEN** its encoded object has no `hooks` or `hidden` key

### Requirement: Sanitized import
The system SHALL cap imports at 500 frames, truncate names to 80 characters, default a missing name to `Frame`, derive a hue when absent, coerce unknown kinds to `frame`, treat an invalid area as no area, and use supplied defaults for a missing or negative gap, hook or margin. Hooks SHALL be kept only when finite, limited to 8 per frame and clamped into the frame, and dropped entirely when none are valid. A frame SHALL be hidden only when its hidden flag is exactly `true`.

#### Scenario: Frame cap
- **WHEN** a code holds 600 frames
- **THEN** 500 are imported

#### Scenario: Defaults
- **WHEN** gap, hook and margin are absent
- **THEN** the caller's defaults are used

#### Scenario: Bad hooks
- **WHEN** a frame's hooks include `{x:"a"}`, a negative value and a position beyond the frame
- **THEN** the invalid entry is dropped and the others are clamped into the frame

#### Scenario: Truthy but not true
- **WHEN** a frame has `hidden: "yes"`
- **THEN** it is imported visible
