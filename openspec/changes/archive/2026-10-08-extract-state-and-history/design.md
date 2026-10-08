## Context

`S` (persisted state) and `T` (transient UI state, including history) are mutated everywhere in `main.js`. History, persistence and lock checks are interleaved with rendering.

## Decisions

- **`createStore({storage, key})`** in `src/js/store.js` owns `state` (a stable object; callers mutate its fields as today), `fresh`, `save()`, `checkpoint()`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `resetHistory()`, and `subscribe(fn)`. `storage` is injectable (tests pass fakes; default is `localStorage` guarded by try/catch).
- **Events.** `subscribe` listeners receive `'checkpoint'` (history changed) or `'restore'` (state replaced by undo/redo). `main.js` maps these to `renderControls()` and `renderAll()`.
- **Lock.** Store `undo`/`redo`/`canUndo`/`canRedo` honor `state.locked`; the toast and per-action `locked()` guard stay in the UI.
- **Pure helpers exported** for tests: `defaults()` and `mergeSaved(defaults, saved)`.
- Debounced `sched()` and rendering stay in `main.js`.

## Risks

- `S` identity must stay stable so closures keep working; the store never reassigns `state`.
