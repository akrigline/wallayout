## Context

Frames are plain objects in `S.frames`. The whole frame list is JSON-copied into undo snapshots (`store.snap`), saved layouts (`layouts.js`) and the working plan in `localStorage`. `shareCode.encodeSpec` copies an explicit whitelist of fields, so a new field is excluded from codes by default. `localStorage` holds about 5 MB per origin and is already used for the plan and saved layouts, so image bytes cannot go there.

## Goals / Non-Goals

**Goals:**
- Attach, replace and remove a picture on a frame, with undo and redo working across those actions.
- Pictures stay on the device and are never encoded in a plan code.
- Saved layouts keep their pictures on the same device.
- No orphaned image data builds up over time.

**Non-Goals:**
- Sharing, syncing or exporting pictures between devices or in the hang sheet.
- Per-frame choice of whether a picture projects; the toggle is global.
- Cropping, rotating or per-frame fit options; the picture always covers the frame.
- Pictures on obstacles.

## Decisions

**Frame holds a key, IndexedDB holds the bytes.** A frame gets an optional `img` string (random id). Blobs live in an IndexedDB database `galleryWallPlanner.images` (object store `img`, key = `img` string). Because the key is plain frame data, undo, redo, duplicate, saved layouts and autosave carry it with no extra code. Alternatives: keying by frame id (rejected: ids are reused after delete or after loading a layout and would show the wrong picture); data URLs in the frame (rejected: blows the `localStorage` quota and every undo snapshot, and would leak into codes if the whitelist ever changed).

**Never delete eagerly; collect at boot.** Removing a picture, deleting a frame, or replacing a picture only changes frame data. A key can still be reachable through undo history, another duplicate or a saved layout, so deleting its blob at that moment could break those. At boot, history is empty, so the live set is exactly the keys in `S.frames` plus every saved layout's frames; every other blob is deleted. Alternative: reference counting (rejected: needs bookkeeping across undo and layout edits).

**Downscale on import.** Decode with `createImageBitmap`, draw to a canvas with the long side at most 1000 px (never upscaled), and store `canvas.toBlob('image/jpeg', 0.85)`. This bounds each picture to a few hundred KB. A file that fails to decode is rejected with a toast and nothing changes. Non-image files are rejected by the file input's `accept` and a type check.

**Pure store over an injectable backend.** `src/js/images.js` exports `newKey()`, `fitWithin(w, h, max)`, `liveKeys(frames, layouts)`, and `createImageStore(backend)` with `put/get/remove/keys/collect(live)`. The backend is an object with the same async methods; the UI supplies an IndexedDB backend and `images.js` provides an in-memory one used as the fallback and in tests. This keeps the logic DOM-free and unit-testable, as the project requires.

**Rendering through object URLs and a pseudo-element.** `pictures.js` keeps a `Map<key, objectURL>`. `render.js` sets a `--pic` custom property on the frame element and adds class `pic`; CSS draws it on `.fr.pic::before` (`inset:0`, `background-size: cover`). A pseudo-element is used so the frame's own background (tint, obstacle stripes) is left alone. That background paints *under* the picture, so for a conflicting frame with a picture the red stripes move to `::after`, which paints above it; the red border is unaffected. The label sits above it with a text shadow so it stays readable. Pictures load asynchronously: `renderFrames` asks `pictures.url(key)`; if not cached it starts the load and re-renders when it resolves.

**Projection.** The picture shows in outline, wash and solid styles; the colour tint of wash and solid sits under it. In mono mode the picture is greyscale (`filter: grayscale(1)`). `proj.pics` (default `true`, persisted like `proj.margin`, not part of snapshots or codes) hides pictures when off; the class `pic` is applied only in the design view or when `proj.pics` is on. Pictures are not drawn while calibrating (frames are already dimmed then).

**Changes go through the normal frame path.** Attach, replace and remove set or clear `f.img`, then `checkpoint()` and `renderAll()`, and respect the layout lock (`locked()`). Duplicate copies `img`. Rotate, resize and move do not touch it.

**Plan codes.** `encodeSpec` already whitelists fields, so `img` is omitted; a test asserts this and that decode yields frames with no `img`. Plan-sharing's spec gains an explicit requirement so a future edit cannot add it quietly.

## Risks / Trade-offs

- [IndexedDB unavailable or quota exceeded] → fall back to the in-memory backend for the session and show a toast saying the picture will not survive a reload.
- [Pictures only exist on one device, so a frame can carry a key whose blob is missing, e.g. a plan restored from another profile's `localStorage`] → a missing blob renders as a normal frame; the properties panel shows no picture and offers "Add picture".
- [Boot collection deletes a blob that is still wanted] → only blobs absent from both the working plan and every saved layout are deleted; if saved layouts fail to read, collection is skipped.
- [Object URLs leak memory] → one URL per key, revoked when the blob is removed by collection; the set is small.
- [A bright picture projected onto a real wall competes with the actual art] → the Pictures toggle turns it off in one click.
- [Large photos slow the page] → downscale happens once at import and only the small blob is stored.

## Migration Plan

Additive. Existing plans have no `img` and behave as before. Rolling back leaves harmless unused `img` keys in saved data and an unused IndexedDB database.
