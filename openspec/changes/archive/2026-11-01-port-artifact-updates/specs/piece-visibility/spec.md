## ADDED Requirements

### Requirement: Hide and show a piece
Each piece SHALL have an eye toggle in the Frames list and a Hide/Show button in its properties. Hiding a piece SHALL remove it from the wall, from the selection and from the rest of the behaviors listed below, without deleting it; showing it SHALL restore it. Hide/show works while the layout is locked. Each toggle SHALL be one undo step. The list SHALL show hidden pieces dimmed and the count line SHALL include "N hidden".

#### Scenario: Hide a selected piece
- **WHEN** the selected piece is hidden
- **THEN** it disappears from the wall and the selection no longer includes it

#### Scenario: Show again
- **WHEN** a hidden piece is shown
- **THEN** it reappears at its position with its hooks and size unchanged

### Requirement: Hidden pieces are inert
A hidden piece SHALL NOT be drawn, have a margin halo, be hit-tested or marquee-selected, be a snap target, block free-space placement of new frames, be flagged or take part in conflicts, be moved by Auto-arrange, Shuffle or Center group, count toward "on the wall", or appear on the hang sheet. Numbers are stable labels: a hidden frame keeps its number and the other frames are not renumbered, so numbers on the wall always match the sheet.

#### Scenario: Not a conflict
- **WHEN** a hidden frame overlaps a visible frame
- **THEN** neither is flagged

#### Scenario: Not arranged
- **WHEN** Auto-arrange runs with one frame hidden
- **THEN** the hidden frame keeps its position

### Requirement: Show all and the projection pieces panel
The system SHALL offer "Show all" in the Frames section and in the projection pieces panel. The projection toolbar SHALL have a "Show / hide" button opening a panel with one checkbox per piece (checked when visible) so pieces can be switched while projecting.

#### Scenario: Show all
- **WHEN** three pieces are hidden and Show all is pressed
- **THEN** all pieces are visible

#### Scenario: Toggle while projecting
- **WHEN** a piece's checkbox is cleared in the projection panel
- **THEN** it is no longer projected
