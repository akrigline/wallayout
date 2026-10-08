# measurement-units Specification

## Purpose
TBD - created by archiving change extract-measurement-and-projection-math. Update Purpose after archive.
## Requirements
### Requirement: Display lengths in the chosen unit
The system SHALL format wall-plane lengths (stored in inches) for display in either inches or centimeters, depending on the unit setting.

#### Scenario: Inches use fractions to 1/8
- **WHEN** 16.5 is formatted in inches
- **THEN** the number is `16 1/2` and the full label is `16 1/2″`

#### Scenario: Fractions reduce
- **WHEN** 0.25 and 0.125 are formatted in inches
- **THEN** the results are `1/4` and `1/8`

#### Scenario: Rounding carries into the whole number
- **WHEN** 2.99 is formatted in inches
- **THEN** the result is `3`

#### Scenario: Centimeters use one decimal
- **WHEN** 16 inches is formatted in centimeters
- **THEN** the number is `40.6` and the full label is `40.6 cm`

### Requirement: Tolerant length parsing
The system SHALL parse user-typed lengths into inches, accepting whole numbers, decimals, mixed fractions, bare fractions, and optional unit words or quote marks, interpreting bare numbers in the current unit.

#### Scenario: Mixed and bare fractions
- **WHEN** `1 1/2` and `3/4` are parsed in inches
- **THEN** the results are 1.5 and 0.75

#### Scenario: Unit decoration is ignored
- **WHEN** `16"`, `16 in` and `16 inches` are parsed
- **THEN** each result is 16

#### Scenario: Centimeters convert to inches
- **WHEN** `40.6 cm` is parsed in centimeters
- **THEN** the result is 40.6 / 2.54 inches

#### Scenario: Garbage is rejected
- **WHEN** `abc` or an empty string is parsed
- **THEN** the result is NaN

### Requirement: Pasted size lists
The system SHALL parse a multi-line pasted list into frames, one per line, reading an optional name and a width and height separated by `x`, `×`, `*` or `by`.

#### Scenario: Named line
- **WHEN** the line `Harbor 24x36` is parsed
- **THEN** it yields a frame named `Harbor` of 24 by 36

#### Scenario: Spaced and fractional sizes
- **WHEN** the lines `Portrait 16 x 20` and `11 1/2 x 14` are parsed
- **THEN** both yield frames with those sizes, the second with an empty name

#### Scenario: Unparseable lines are skipped
- **WHEN** a line has no size, or a zero dimension
- **THEN** it produces no frame and the other lines are unaffected

