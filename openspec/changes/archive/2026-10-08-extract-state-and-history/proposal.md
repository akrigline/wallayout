## Why

State, persistence, and undo/redo live in module-level globals (`S`, `T`) mutated everywhere, which blocks splitting the UI. A small store gives the view code one place to read, change, and subscribe.

## What Changes

- Extract `src/js/store.js`: default state, localStorage load/save with try/catch fallback, versioned key, `checkpoint`/`undo`/`redo` snapshot history (150 deep), lock semantics, and a change subscription.
- Tests for history truncation on new edits, the 150 cap, lock blocking edits, corrupt/missing localStorage, and merging saved state over new defaults.
- Rendering still happens in the inline script, now subscribing to the store.

## Capabilities

### New Capabilities

- `plan-persistence`: autosave and restore of the plan and settings in the browser.
- `undo-history`: undo/redo of layout edits, and what is and is not tracked (wall, area, frames; not view settings or calibration).
- `layout-lock`: locking a layout blocks edits, undo, and arrange until unlocked.

### Modified Capabilities

None.

## Impact

New `src/js/store.js` and tests. Should follow the two extraction changes above so it can import them.
