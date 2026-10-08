## 1. CSS

- [x] 1.1 Move inline CSS to `src/css/` (tokens, layout, wall, projection, responsive) and import from `src/main.js`

## 2. UI modules

- [x] 2.1 Create `src/ui/ctx.js` and `toast.js`
- [x] 2.2 Create `render.js`, `actions.js`, `modals.js`, `projection.js`, `interaction.js` and move code out of `src/main.js` without changing behavior
- [x] 2.3 Reduce `src/main.js` to imports, init and boot; `index.html` is markup plus the module script

## 3. Verification

- [x] 3.1 Extend happy-dom tests: clicking chips adds frames, Auto-arrange/Shuffle run, undo/redo buttons, lock blocks edits, sheet and share modals open, projection mode toggles and calibration Done
- [x] 3.2 `npm test` and `npm run build` pass
- [x] 3.3 Manual browser checklist: design view rendered correctly in headless Chrome against `vite preview` (CSS, font, frames, hook marks). Drag/snap, area resize, and projection visuals were not run in a real browser (the browser tool was unavailable); they are covered only by happy-dom tests and verbatim-moved CSS.
