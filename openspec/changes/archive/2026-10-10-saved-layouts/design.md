## Context

The working plan lives in one localStorage key (`galleryWallPlanner.v1`) managed by `src/js/store.js`, which already keeps a snapshot of `{wall, area, frames, nextId}` for undo. Loading a share code replaces the layout through the same checkpoint path and is undoable. UI actions are dispatched from `data-act` buttons in `src/ui/interaction.js`; modals are plain `.modal` elements shown and hidden by `src/ui/modals.js`. Pure logic lives in DOM-free `src/js/` modules with sibling tests.

## Goals / Non-Goals

**Goals:**
- Save, list, load, update, rename and delete named layouts, persisted across reloads.
- Thumbnails so a liked layout is recognizable at a glance.
- Loading is undoable and respects the layout lock.
- Logic is pure and unit-tested; UI is thin.

**Non-Goals:**
- Live or peer-to-peer collaborative sharing (parked for a later exploration).
- Exporting or importing saved layouts between devices (share codes already move a single plan).
- Automatic or timed snapshots, and a cap on the number of saves.
- Saving calibration, projector settings, lock state, selection or unit.

## Decisions

**Separate storage key `galleryWallPlanner.layouts.v1`.** Not nested in the plan state. Undo and `GWP1:` share codes are unaffected, and a corrupt list cannot break the working plan. Alternative: a `layouts` array inside `state` — rejected because `store.save()` would serialize it on every edit and share/undo code would need to ignore it.

**Entry shape `{ id, name, savedAt, snap }`** with `snap = { wall, area, frames, nextId }`, the same shape as the undo snapshot, so `store` can apply it directly. `id` is a generated unique string (so duplicate names are allowed), `savedAt` an epoch-ms number.

**`src/js/layouts.js` is storage-injected and DOM-free**, mirroring `createStore({ storage, key })`: `createLayouts({ storage, key })` returns `list()` (newest first), `get(id)`, `save(name, snap)`, `update(id, snap)`, `rename(id, name)`, `remove(id)`. Names are trimmed; a blank name becomes `Layout N` (N = one more than the highest existing `Layout N`). Unreadable or malformed stored data yields an empty list. Write failures (quota, unavailable storage) are reported to the caller (the mutating methods return `false`, or the entry on success) so the UI can toast instead of showing a phantom entry. Mutations deep-copy the snapshot so later edits to live state cannot alias a saved entry.

**Thumbnails are derived, not stored.** `thumbnailSvg(snap)` returns an SVG string: wall outline, the gallery area when set, and a rect per frame (obstacles styled distinctly), scaled to a fixed viewBox. Storing nothing extra keeps entries small and thumbnails always consistent with the data. Frame names are never included, so no escaping surface beyond numbers.

**`store.snapshot()` and `store.applySnapshot(snap)`.** `snapshot()` returns a deep copy of the undo-shape state. `applySnapshot()` deep-copies the incoming snapshot into state, clears `sel` if the frame is gone, then calls `checkpoint()`, so loading appears in undo history as one step and persists. It does not check the lock; the UI layer does, consistent with how other edits call `locked()` first. Alternative: have the store refuse while locked — rejected to stay consistent with the existing split (store guards undo/redo only because those are store-level actions).

**UI is a modal like `#share`.** New `#layouts` modal and a "Layouts" header button next to Share; open/close and rendering in `modals.js`, handlers in `interaction.js`, markup in `index.html`, styles in `src/css/layout.css`/`wall.css` as fits. The list is re-rendered from `layouts.list()` after each change. `Update` and `Delete` use `window.confirm` naming the entry, which matches the app's lightweight style (no custom dialog component exists). Rename uses `window.prompt`. Displayed sizes use `fmt()` so they follow the current unit. The layouts instance is created in `ctx.js` next to the store.

**Lock behavior.** Load and Update call the existing `locked()` guard and also render disabled with a hint while `S.locked`. Save, Rename and Delete stay available since they do not change the live layout.

## Risks / Trade-offs

- [localStorage quota with many large layouts] → Entries are small JSON (frames only, no images); on write failure the UI shows an error toast and nothing is added. No cap, so the browser quota is the limit.
- [`confirm`/`prompt` look dated and can be suppressed in embedded browsers] → Accepted for consistency and simplicity; a custom dialog can replace them later without touching the data layer.
- [Saved layouts are per-browser, per-device] → Stated in the empty-state note; moving a layout between devices is what share codes are for.
- [Thumbnail and modal visuals cannot be verified in happy-dom] → Verify in headless Chromium with a screenshot, per the project notes.
- [Loading a layout whose `nextId` is lower than ids already used elsewhere] → Not possible within one snapshot; `nextId` travels with the frames it belongs to.
