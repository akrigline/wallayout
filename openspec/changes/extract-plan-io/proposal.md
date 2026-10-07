## Why

Hang-sheet generation and `GWP1:` share codes are self-contained, user-facing contracts (a code someone sends must keep loading) that deserve specs and tests before the UI is restructured.

## What Changes

- Extract `src/js/hangSheet.js` (`sheetRows`, `sheetText`) and `src/js/shareCode.js` (`encodeSpec`, `decodeSpec`), taking plain data in and out.
- Tests: hang-sheet measurements from ceiling and floor, hook position, obstacle exclusion; share-code round trip, unicode names, malformed/oversized/hostile codes rejected, 500-frame cap, defaults for missing fields.
- Keep the `GWP1:` format byte-compatible with codes already shared.

## Capabilities

### New Capabilities

- `hang-sheet`: per-frame left/top/bottom/hook measurements, copy-as-text, conflict warning.
- `plan-sharing`: export and import of plan codes, validation, and what is deliberately excluded (projector calibration).

### Modified Capabilities

None.

## Impact

New `src/js/hangSheet.js`, `src/js/shareCode.js`, tests. Independent of the layout change; can run in parallel.
