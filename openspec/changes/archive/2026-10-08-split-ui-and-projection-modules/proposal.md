## Why

With logic extracted, what remains is DOM code: rendering, sidebar panels, pointer/keyboard interaction, and the projector calibration flow. It is still one file and one stylesheet inside `index.html`.

## What Changes

- Move CSS to `src/css/` (tokens, layout, wall, projection) and the DOM code to `src/ui/`: `render.js`, `panels.js`, `interaction.js` (drag, resize area, keyboard), `projection.js` (calibration handles, fullscreen, projection styles), `modals.js` (sheet, share), `toast.js`.
- `index.html` becomes markup plus `<script type="module" src="/src/main.js">`.
- Self-host the Instrument Sans font or keep the Google Fonts link (decide in design).
- Verify in a real browser (design view, drag/snap, projection with calibration) since there is no component-test library; document the manual checklist in the change's tasks.
- No user-visible behavior change.

## Capabilities

### New Capabilities

- `wall-planning-ui`: wall/units/gap/hook settings, frame add/edit/list, drag, resize of the gallery area, keyboard shortcuts.
- `projector-calibration`: four-corner calibration, taped-off sub-area, projection styles (outline/wash/solid, labels, hooks, grid, wall edge, white), hide controls, fullscreen.

### Modified Capabilities

None.

## Impact

Largest change; touches `index.html` and most of `src/`. Do last. May itself split into UI and projection sub-changes at design time.
