## Why

The planner is one 1000-line inline script, so none of its logic is testable or reusable. Unit parsing/formatting and the four-corner homography are pure math that every other piece depends on; extracting them first gives the later changes a tested foundation.

## What Changes

- Add `src/js/units.js` (`fracIn`, `num`/`fmt`, `parseLen`, `parseBulk`) and `src/js/homography.js` (`solve`, `homography`, `inv3`, `mapPt`) as DOM-free modules taking explicit arguments instead of reading global state (`S.unit` becomes a parameter).
- Add vitest suites for both, and remove `passWithNoTests` from `vitest.config.js`.
- Introduce `src/main.js` as the Vite entry; `index.html` loads it as a module. The remaining inline script keeps working by importing these modules.
- No user-visible behavior change.

## Capabilities

### New Capabilities

- `measurement-units`: inch/cm display, fractional-inch formatting to 1/8, tolerant length parsing (`16`, `1 1/2`, `3/4`, `40.6 cm`), and pasted-list parsing (`Harbor 24x36`).
- `projection-mapping`: four-corner perspective mapping between the wall plane and the screen, including degenerate-corner handling.

### Modified Capabilities

None.

## Impact

New `src/js/units.js`, `src/js/homography.js`, tests, `src/main.js`. `index.html` script moves into modules incrementally. Smallest change; do first.
