## 1. Reproduce the bug

- [x] 1.1 Make the smoke test boot twice: from saved state and from empty localStorage; confirm the fresh boot fails with the ReferenceError

## 2. Layout module

- [x] 2.1 Create `src/js/layout.js` (`areaOf`, `normArea`, `computeBad`, `gapsOf`, `hit`, `snapMove`, `findSpot`, `arrange`, `centerGroup`) with the `area` shadowing fixed
- [x] 2.2 Add `src/js/layout.test.js` covering the frame-conflicts, frame-snapping and auto-arrange scenarios

## 3. Wire in

- [x] 3.1 Make `src/main.js` delegate to `layout.js` and apply returned moves
- [x] 3.2 Remove the saved-state workaround comment from the smoke test; fresh boot passes
- [x] 3.3 `npm test` and `npm run build` pass
