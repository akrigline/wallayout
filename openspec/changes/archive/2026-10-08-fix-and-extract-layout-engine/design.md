## Context

Placement logic lives in the inline script and reads global `S` and `T`. `arrange()` declares `const area` after calling `area()`, so it throws; because boot calls `arrange(false)` on first run, a fresh visitor sees the app fail to start.

## Goals / Non-Goals

**Goals:** pure, tested `src/js/layout.js`; fix the crash; keep behavior otherwise identical.
**Non-Goals:** changing packing, snapping or messages.

## Decisions

- **Input shape.** Functions take a plan `{wall, area, gap, grid, snap, frames}` (the store state satisfies this).
- **No mutation.** `arrange` and `centerGroup` return `{moves: [{id,x,y}], overflow}` / `moves`; `main.js` applies them then checkpoints. `snapMove` returns `{x, y, guides}` and takes the snap threshold in inches (`8*T.u/K` computed by the caller). `normArea(area, wall)` returns a clamped copy.
- **RNG.** `arrange(plan, {shuffle, rng = Math.random})`.
- **Regression test first.** A smoke test boots the app with empty localStorage; it fails with the ReferenceError before the rename.
- Locking stays in `main.js` (UI concern) until the store change.

## Risks / Trade-offs

- Returning moves instead of mutating changes call sites slightly; covered by the smoke test and unit tests.
