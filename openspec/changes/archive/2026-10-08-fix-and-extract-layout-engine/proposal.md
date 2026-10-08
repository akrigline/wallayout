## Why

Frame placement logic (conflict detection, snapping, spot-finding, auto-arrange, centering) is the heart of the app and is currently tangled with DOM and global state. It also contains a live bug: `arrange()` calls `area()` and then declares a local `const area` in the same scope, so the call hits the temporal dead zone and **Auto-arrange and Shuffle throw a ReferenceError**.

## What Changes

- Write a failing test reproducing the Auto-arrange/Shuffle crash, then fix it by renaming the local.
- Extract `src/js/layout.js`: `computeBad`, `gapsOf`, `hit`, `snapMove`, `findSpot`, `arrange`, `centerGroup`, `normArea`, as pure functions over a plain `{wall, area, gap, grid, snap, frames}` input. Randomness (shuffle) takes an injectable RNG for deterministic tests.
- Tests cover overlap/off-wall/outside-area conflicts, snap thresholds and guides, grid snap, row-packing fit and the too-big-to-fit case, and group centering.

## Capabilities

### New Capabilities

- `frame-conflicts`: which frames are flagged (off wall, outside gallery area, overlapping) and the message each gets.
- `frame-snapping`: snap to wall/area edges, centers, and neighbors (with gap); grid snap; Alt to bypass.
- `auto-arrange`: tidy row packing within the gallery area, shuffle, center group, and the too-big warning.

### Modified Capabilities

None.

## Impact

New `src/js/layout.js` and tests; inline script delegates to it. Depends on `extract-measurement-and-projection-math` only for test conveniences. Fixes a user-visible bug.
