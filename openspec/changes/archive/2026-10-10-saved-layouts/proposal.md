## Why

Arranging a wall is exploratory: you reach a layout you like, try something different, and want to get back to the one you liked. Today the only way back is undo, which is linear, capped at 150 steps, and lost on reload. Named saved layouts let people branch and return.

## What Changes

- Add named saved layouts: save the current layout under a name, then list, load, update, rename and delete saved entries.
- Each saved entry shows a generated thumbnail, its name, when it was saved, and a summary (frame count and wall size).
- Saved layouts persist in the browser, in their own localStorage key, separate from the working plan.
- Loading a saved layout replaces the current wall, gallery area and frames, and is undoable.
- Load and Update are unavailable while the layout is locked.
- A "Layouts" toolbar button opens the saved-layouts modal.
- Live peer-to-peer collaborative sharing is **out of scope**; it is parked for a later exploration.

## Capabilities

### New Capabilities
- `saved-layouts`: named layout snapshots (wall, gallery area, frames, next id), their persistence, thumbnails, and the management modal.

### Modified Capabilities
- `undo-history`: loading a saved layout becomes a recorded, undoable edit.
- `layout-lock`: loading or updating a saved layout is refused while locked.

## Impact

- New `src/js/layouts.js` (+ test): storage-backed list and CRUD, plus `thumbnailSvg`.
- `src/js/store.js`: new `snapshot()` and `applySnapshot()`; tests extended.
- `src/ui/`: new Layouts modal wiring (`modals.js`, `actions.js`, `render.js`), a toolbar button and modal markup in `index.html`, small CSS additions.
- `src/smoke.test.js`: new flow covering save, change, load, update, delete.
- No new dependencies. `GWP1:` share codes and the existing plan storage key are unchanged.
