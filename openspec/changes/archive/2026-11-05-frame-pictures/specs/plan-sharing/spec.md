## ADDED Requirements

### Requirement: Pictures are not shared
A plan code SHALL NOT contain any frame picture or picture key. Importing a code SHALL produce frames without pictures.

#### Scenario: Export omits pictures
- **WHEN** a frame with a picture is encoded
- **THEN** its encoded object has no `img` key and the code contains no image data

#### Scenario: Import has no pictures
- **WHEN** a code is imported
- **THEN** none of the resulting frames has a picture
