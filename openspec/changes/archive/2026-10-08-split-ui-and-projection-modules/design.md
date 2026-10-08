## Context

After the logic extractions, `src/main.js` is ~500 lines of DOM code sharing module-level `S`, `T` and element refs, and `index.html` still carries ~150 lines of inline CSS.

## Decisions

- **Shared context module** `src/ui/ctx.js` exports `K`, `$`, `S`, `T`, `store`, element refs, unit wrappers, and a `V` object holding the current homography (`V.Hm`, `V.Hi`) so it can be mutated across modules.
- **Modules under `src/ui/`:** `toast.js` (toast, lock guard), `render.js` (layout transform, frames, list, props, controls, `renderAll`, checkpoint/subscribe), `actions.js` (add/arrange/center/unit/undo), `modals.js` (sheet, share, copy), `projection.js` (mode, fullscreen, calibration handles, resize), `interaction.js` (click delegation, inputs, pointer, keyboard). Imports between them are circular but only used at call time, which ES modules allow. `src/main.js` imports CSS and the UI modules, then boots.
- **CSS** moves verbatim to `src/css/{tokens,layout,wall,projection,responsive}.css`, imported in that order from `main.js` (responsive last so its overrides still win).
- **Font:** keep the Google Fonts link in `index.html`. Self-hosting would add a font dependency to the repo for no behavioral gain; revisit if offline use matters.
- **No behavior change.** Verified by the existing smoke test plus extended happy-dom tests (render, click flows, projection mode toggles) and a manual browser checklist, since there is no browser-test tooling.

## Risks

- Circular imports can break if something runs at module-evaluation time; listeners are registered inside an `init*()` called from `main.js`, after all modules load.
- Visual regressions are not covered by automated tests; see the manual checklist in tasks.
