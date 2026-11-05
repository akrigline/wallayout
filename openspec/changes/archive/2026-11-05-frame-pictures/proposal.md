## Why

Frames on the wall are flat coloured boxes, so it is hard to judge how a real arrangement will look. Letting a user attach a photo of the actual piece to its frame makes the layout recognisable at a glance. The photos are the user's own files and can be large and private, so they must stay on the device and never travel in a plan code.

## What Changes

- A frame (not an obstacle) can have a picture attached from a local file, replaced, or removed, from the properties panel.
- The picture is downscaled in the browser to a JPEG no larger than 1000 px on its long side and stored as a blob in IndexedDB, not in `localStorage`.
- The frame carries only a random `img` key. The key rides in undo snapshots, saved layouts and the working plan, so undo, redo and loading a saved layout bring the picture back on the same device.
- The picture is drawn inside the frame, covering the frame's box, in the design view and in projection mode (all three styles). It is not on the hang sheet.
- The projection toolbar gets a "Pictures" toggle (persisted in `proj`, default on) so pictures can be switched off while projecting, e.g. when the real art is already hung.
- `GWP1:` codes never include `img`, and importing a code produces frames without pictures. **No change to the code format.**
- Blobs no longer referenced by the working plan or any saved layout are deleted at boot.
- If IndexedDB is unavailable, picking a picture still works for the session (in-memory) and a toast says it will not survive a reload.

## Capabilities

### New Capabilities
- `frame-pictures`: attaching, showing, replacing and removing a local-only picture on a frame, its storage, and cleanup.

### Modified Capabilities
- `plan-sharing`: a plan code SHALL NOT contain frame pictures or their keys.
- `saved-layouts`: a saved layout keeps each frame's picture key, so loading it restores pictures on the same device.

## Impact

- New `src/js/images.js` (DOM-free: key generation, size fitting, an image store over an injectable backend, orphan collection) with `images.test.js`.
- New `src/ui/pictures.js` (file input, canvas downscale, IndexedDB backend, object-URL cache).
- `src/js/store.js` (`proj.pics` default), `src/ui/render.js` (frame picture, properties panel buttons, toggle state), `src/ui/interaction.js` (actions), `src/ui/actions.js` (duplicate keeps the key), `src/main.js` (boot cleanup), `src/css/wall.css` and `projection.css`, `index.html` (toggle button).
- `src/js/shareCode.js` is unchanged in behaviour; a test locks in that `img` is never encoded.
- No new dependencies.
