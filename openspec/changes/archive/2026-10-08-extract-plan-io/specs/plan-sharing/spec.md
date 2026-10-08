## ADDED Requirements

### Requirement: Export a plan code
The system SHALL encode the unit, wall, gallery area, gap, hook offset and every frame (name, size, position, hue, kind) as a `GWP1:`-prefixed base64 string, byte-compatible with codes already shared.

#### Scenario: Round trip
- **WHEN** a plan is encoded and decoded
- **THEN** the decoded wall, area, gap, hook, unit and frames equal the original, with frame ids renumbered from 1

#### Scenario: Unicode names
- **WHEN** a frame is named `Café 🌅`
- **THEN** it survives a round trip

### Requirement: Import validates strictly
The system SHALL reject codes that are missing the `GWP1:` prefix, are not valid base64 or JSON, lack a positive wall size or a frames array, contain a frame with non-positive size or non-finite position, or exceed 200,000 characters. Whitespace inside a pasted code SHALL be ignored.

#### Scenario: Malformed
- **WHEN** the input is `hello`, `GWP1:@@@`, or valid base64 of non-JSON
- **THEN** decoding throws

#### Scenario: Oversized
- **WHEN** the code exceeds 200,000 characters
- **THEN** decoding throws

#### Scenario: Wrapped code
- **WHEN** a valid code is pasted with line breaks inside it
- **THEN** it decodes normally

### Requirement: Sanitized import
The system SHALL cap imports at 500 frames, truncate names to 80 characters, default a missing name to `Frame`, derive a hue when absent, coerce unknown kinds to `frame`, treat an invalid area as no area, and use supplied defaults for a missing or negative gap or hook.

#### Scenario: Frame cap
- **WHEN** a code holds 600 frames
- **THEN** 500 are imported

#### Scenario: Defaults
- **WHEN** gap and hook are absent
- **THEN** the caller's defaults are used

### Requirement: Calibration is not shared
Plan codes SHALL NOT contain projector calibration or projection style, since they depend on the local setup.

#### Scenario: Excluded fields
- **WHEN** a plan code is decoded to JSON
- **THEN** it has no `cal` or `proj` keys
