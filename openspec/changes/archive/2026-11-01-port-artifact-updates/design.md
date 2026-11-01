## Context

The original single-file artifact gained five features after `index.html` was split into `src/js` (pure) and `src/ui` (DOM) modules. The artifact is the reference behavior; the repo's structure, tests and specs are the constraints. Frames are plain objects shared by undo snapshots, saved layouts and share codes, and the store persists whole `state` to `galleryWallPlanner.v1`.

## Goals / Non-Goals

**Goals:**
- Behave like the artifact for the five features, with the logic in DOM-free modules covered by unit tests and the wiring covered by the happy-dom smoke test.
- Keep every previously shared `GWP1:` code loading, and keep undo, saved layouts and the lock working for the new state.

**Non-Goals:**
- Live collaboration (parked on `add-live-collaboration`); its doc schema will need `margin`, `hooks` and `hidden` when it is rebased.
- Resizing frames by dragging, or per-frame margins.
- Making projection-mode hook dragging work (hook dragging is a design-mode editing aid, as in the artifact it is simply gated by lock and by a single selection).

## Decisions

1. **New state lives where its lifetime matches.**
   - `hooks` and `hidden` are properties of the frame object, so snapshots (undo, saved layouts) carry them with no change to `store.snapshot()`.
   - `margin` is a plan setting next to `gap` and `hook`: `S.margin` (default 3) and `S.proj.margin` (default true), saved by `store.save()` and merged over defaults like other settings, not undoable, not part of saved layouts.
   - Alternative: put margin in the snapshot. Rejected: saved layouts deliberately hold only wall, area, frames and next id.

2. **Pure helpers in two new modules.**
   - `src/js/hooks.js`: `hooksOf(frame, defaultY)` (frame's own list, else one hook at centre-x/default-y), `cleanHooks(frame)` (finite, clamped to the frame, max 8, `undefined` when empty), `scaleHooks(frame, axis, oldSize, newSize)`.
   - `src/js/selection.js`: `boundsOf(frames)`, `alignMoves(frames, how)`, `distributeMoves(frames, axis)`, `nudge`-style helpers returning `{id,x,y}` moves like the existing `arrange`/`centerGroup`.
   - Alternative: keep the artifact's inline helpers in `ui/`. Rejected: the project rule is that testable logic lives in DOM-free modules.

3. **Selection is `S.sel` (primary) plus `T.sels` (a Set, per session).**
   - `S.sel` stays persisted and is always the most recently selected member, so existing single-selection code (`sel()`, props panel, HUD) keeps working; `T.sels` is derived from it on load and reconciled by `syncSel()` whenever the frame list changes.
   - The properties panel shows the frame editor when exactly one piece is selected and the group panel otherwise.
   - Alternative: replace `S.sel` with an array. Rejected: it changes the persisted shape and every consumer for no gain.

4. **Engine functions grow optional parameters, not new copies.**
   - `computeBad`, `gapsOf`, `findSpot`, `arrange`, `centerGroup`, `snapMove` and `sheetRows` skip `hidden` pieces; `computeBad` also skips obstacles for the wall-edge and overlap checks.
   - `snapMove(p, f, nx, ny, free, thr, exclude)` takes an `exclude` set so a group (represented by its bounding box `{w,h}`) never snaps to its own members.
   - `hit(frames, x, y)` tests non-obstacle pieces first (topmost first), then obstacles, ignoring hidden ones.

5. **Share code format.** `margin` is written whenever finite; `hooks` and `hidden` only when set. Decode sanitizes hooks with `cleanHooks`, accepts `hidden` only when it is exactly `true`, and takes `margin` from the code when finite and non-negative, else from the caller's defaults (as gap and hook do).

6. **Rendering.** The margin halo is a separate `#mgl` layer under the frames (one `.mg` div per visible frame) so halos can overlap without covering anything. Each hook is its own `<i class="hk">` inside the frame, positioned from the frame's top-left, so `.fr` loses `overflow:hidden` (labels already clip through `.lb`). Obstacles get `z-index:0` and 45% opacity so frames always paint above them. The marquee is one absolutely positioned `#marq` element in the wall plane.

7. **History.** Hook edits, hide/show, align, distribute, group delete and group drag each end in one `checkpoint()`, so each is one undo step. Selection changes are not history.

## Risks / Trade-offs

- [Obstacles stop being flagged, hiding a genuinely bad layout] → intended per the artifact (a sofa under frames is the point); documented as a BREAKING change in the proposal and spec.
- [`overflow:hidden` removal lets a label spill on tiny frames] → `.lb` keeps `overflow:hidden; max-height:100%`; the known tiny-frame label clipping stays cosmetic.
- [The collab branch conflicts with this one] → it is already committed on its own branch; the rebase is a separate task and its schema additions are listed in the proposal.
- [Drag, marquee and projection visuals cannot be checked in happy-dom] → verify in headless Chromium before merging, and unit-test the geometry in the pure modules.

## Migration Plan

No data migration: saved state, saved layouts and old share codes lack the new fields and take defaults (`margin` 3, `proj.margin` true, default single hook, nothing hidden). Rolling back to a build without these features leaves harmless extra fields in saved data. Ship through the normal PR, `test` check, merge to `main`, release and Pages chain.

## Open Questions

None.
