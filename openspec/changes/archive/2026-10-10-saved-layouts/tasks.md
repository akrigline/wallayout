## 1. Store snapshot API

- [x] 1.1 Add `snapshot()` and `applySnapshot(snap)` to `src/js/store.js` (deep copies, clear stale `sel`, route through `checkpoint()`)
- [x] 1.2 Extend `src/js/store.test.js`: apply is undoable and redoable, identical snapshot adds no history, stale selection clears, snapshot is a deep copy

## 2. Layouts module

- [x] 2.1 Create `src/js/layouts.js` with `createLayouts({ storage, key })`: `list` (newest first), `get`, `save`, `update`, `rename`, `remove`, name trimming and `Layout N` defaults, deep-copied snapshots, tolerant of corrupt or unavailable storage, write failures reported to the caller
- [x] 2.2 Add `thumbnailSvg(snap)` to `src/js/layouts.js` (wall outline, optional area, one shape per frame, obstacles distinct, fixed viewBox)
- [x] 2.3 Write `src/js/layouts.test.js` covering CRUD, ordering, default names, rename-to-blank, corrupt and failing storage, aliasing, and thumbnail shape counts (including empty wall and area)

## 3. UI

- [x] 3.1 Create the layouts instance in `src/ui/ctx.js` next to the store
- [x] 3.2 Add the "Layouts" header button and `#layouts` modal markup to `index.html` (name field, Save button, list container, Close)
- [x] 3.3 Add open, close and list rendering to `src/ui/modals.js` (cards with thumbnail, name, date, "N frames · W×H unit", Load/Update/Rename/Delete, empty-state note, Load and Update disabled with hint when locked)
- [x] 3.4 Add `data-act` handlers in `src/ui/interaction.js` for open/close, save, load (with `locked()` guard, toast, `renderAll`), update (confirm, `locked()` guard), rename (prompt), delete (confirm), and error toast on write failure
- [x] 3.5 Add modal and card styles under `src/css/` (keep import order, responsive last) including phone width

## 4. Verification

- [x] 4.1 Add a `src/smoke.test.js` flow: open Layouts, save, change the layout, load the save, undo the load, update, rename, delete, and check Load is refused while locked
- [x] 4.2 Run `npm test` and `npm run build`
- [x] 4.3 Check the modal, thumbnails and phone width in headless Chromium via `chrome-headless-shell --screenshot` and look for console errors
- [x] 4.4 Update `openspec/specs` via archive and refresh `CLAUDE.md`/`AGENTS.md` (keep identical) with the new `layouts` module and storage key
