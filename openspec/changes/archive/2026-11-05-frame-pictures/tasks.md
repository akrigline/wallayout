## 1. Pure logic (tests first)

- [x] 1.1 Add `src/js/images.js`: `newKey`, `fitWithin(w,h,max)`, `liveKeys(frames, layoutSnaps)`, in-memory backend, `createImageStore(backend)` with `put/get/remove/collect(live)`; add `images.test.js`
- [x] 1.2 `shareCode.test.js`: a frame with `img` encodes without it and decodes without it; `layouts.test.js`: `img` survives save and get; `store.test.js`: `img` survives undo and redo, and `proj.pics` defaults to true and merges over older saves

## 2. UI wiring

- [x] 2.1 Add `src/ui/pictures.js`: IndexedDB backend with in-memory fallback and one-time toast, file input and canvas downscale to JPEG, object-URL cache with async load and re-render
- [x] 2.2 `store.js`: `proj.pics: true` default; `index.html`: "Pictures" toggle in the projection toolbar; `render.js`: set `--pic` and `.pic` on frames (design view, or projection with `proj.pics` on, not while calibrating), toggle state; Add / Replace / Remove picture buttons in the properties panel (not for obstacles)
- [x] 2.3 `interaction.js`: `addPic`, `replacePic`, `rmPic` actions that respect the lock, set or clear `f.img`, then `checkpoint()` and `renderAll()`; `actions.js`: duplicate copies `img`
- [x] 2.4 `main.js`: at boot collect unreferenced pictures against the working plan and saved layouts, skipping if layouts are unreadable
- [x] 2.5 `wall.css`/`projection.css`: `.fr.pic::before` cover picture, label above it with text shadow, greyscale under `.mono`, conflict stripes still visible

## 3. Verification

- [x] 3.1 Smoke test in `src/smoke.test.js`: selecting a frame shows Add picture, obstacles do not; duplicate keeps `img`
- [x] 3.2 `npm test` and `npm run build` pass
- [x] 3.3 Drive the built app in headless Chromium: add, reload, undo remove, saved-layout restore, projection shows it in each style and the toggle hides it, no console errors
