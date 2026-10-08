# projection-mapping Specification

## Purpose
TBD - created by archiving change extract-measurement-and-projection-math. Update Purpose after archive.
## Requirements
### Requirement: Four-corner perspective mapping
The system SHALL compute a 3×3 homography from four source points to four destination points and map points through it, so the wall plane can be displayed on screen or projector.

#### Scenario: Identity-like mapping
- **WHEN** a homography is computed with identical source and destination corners
- **THEN** mapping any point returns that same point

#### Scenario: Corners map to corners
- **WHEN** a homography is computed from a rectangle to an arbitrary convex quadrilateral
- **THEN** each source corner maps to its destination corner

### Requirement: Invertible mapping
The system SHALL invert a homography so screen points can be converted back to wall-plane points.

#### Scenario: Round trip
- **WHEN** a point is mapped through a homography and then through its inverse
- **THEN** the original point is recovered within floating-point tolerance

### Requirement: Degenerate corners are detected
The system SHALL return no homography (and no inverse) when the corners cannot define a valid mapping, rather than throwing or returning non-finite values.

#### Scenario: Collinear destination
- **WHEN** all four destination corners lie on one line
- **THEN** the homography is `null`

#### Scenario: Singular matrix
- **WHEN** a singular matrix is inverted
- **THEN** the result is `null`

