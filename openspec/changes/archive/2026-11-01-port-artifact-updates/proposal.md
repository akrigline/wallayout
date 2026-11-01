## Why

The planner kept evolving in its original claude.ai artifact after the module refactor, so the live site is missing five features the owner already uses: a visual margin halo, several hooks per frame, hide/show for individual pieces, multi-select with align and distribute, and obstacles that sit behind frames. This change ports them into the modular app so the live site matches the artifact.

## What Changes

- **Visual margin**: a faint halo of `margin` inches (default 3) drawn around every non-obstacle, visible frame. It never blocks placement. A "Visual margin around art" setting (0 hides it) and a "Margins" toggle in projection mode control it. Margin is part of the share code.
- **Multiple hooks per frame**: a frame can carry its own list of hooks (up to 6 in the UI, 8 accepted on import), each measured from the frame's top-left corner. Hooks are dragged on the wall (selected frame only), typed in the properties panel, added, removed, set to two, or reset to the default single hook. The hang sheet and its text export list every hook. Rotating a frame resets its hooks; resizing scales them. The "Hook below frame top" setting is renamed "Default hook below top".
- **Hide/show pieces**: each piece gets an eye toggle in the list, a Hide/Show button in its properties, a "Show / hide" panel in projection mode, and a "Show all" button. Hidden pieces are not drawn, selected, snapped to, conflict-checked, arranged, or listed on the hang sheet, and the hang sheet says how many are hidden. Hidden state is part of the share code.
- **Multi-select**: Shift/Ctrl/Cmd-click toggles, dragging empty wall draws a marquee, Ctrl/Cmd+A and "Select all" select every visible frame, Escape clears. A group drags (with snapping on its outer box), nudges with arrow keys, and deletes together. Align (6 ways) and distribute (2 ways, 3+ pieces) buttons and "Center in gallery area" act on the group.
- **Obstacle layering**: obstacles are drawn behind frames, a click picks a frame before an obstacle, and obstacles are never flagged as conflicts (they may be overlapped and may extend past the wall).
- **BREAKING (conflict semantics)**: an obstacle that extends past the wall, or overlaps a frame, is no longer flagged.
- Frames lose `overflow:hidden` so the margin halo and hook marks are never clipped.
- Share codes stay compatible in both directions: every new field (`margin`, per-frame `hooks`, per-frame `hidden`) is optional on decode, so every code shared before this change still loads; `hooks` and `hidden` are omitted when unused, so such frames encode exactly as before; older builds ignore the extra fields.

## Capabilities

### New Capabilities
- `visual-margins`: the margin setting, halo rendering rules, projection toggle.
- `multiple-hooks`: per-frame hook lists, editing, defaults, rotate/resize behavior.
- `piece-visibility`: hiding and showing pieces and what hidden pieces are excluded from.
- `multi-select`: selection set, marquee, group move/nudge/delete, align, distribute, center.

### Modified Capabilities
- `frame-conflicts`: obstacles and hidden pieces are never flagged.
- `frame-snapping`: hidden pieces are not snap targets or obstructions for new frames; group snapping uses the group's outer box.
- `auto-arrange`: hidden pieces are not arranged and do not take part in Center group.
- `hang-sheet`: hidden pieces excluded, one line per hook, hidden-count note.
- `plan-sharing`: optional `margin`, `hooks`, `hidden` fields in the code and their sanitizing rules.
- `wall-planning-ui`: obstacle layering and hit-testing, selection model, Escape and Ctrl+A keys, Delete/R/arrow behavior with a group.
- `plan-persistence`: `margin` and `proj.margin` are persisted settings.

## Impact

- Pure logic: `src/js/layout.js`, `hangSheet.js`, `shareCode.js`, `store.js`, plus a new DOM-free `src/js/hooks.js` and `src/js/selection.js` (hook helpers, bounds/align/distribute), each with a test file.
- DOM: `src/ui/ctx.js`, `render.js`, `actions.js`, `interaction.js`, `modals.js`; markup in `index.html`; CSS in `src/css/wall.css`, `layout.css`, `projection.css`.
- No new dependencies. Saved layouts and undo carry `hooks` and `hidden` automatically because they live on the frame objects; `margin` is a setting, not part of a saved layout.
- The parked `add-live-collaboration` branch touches the same files and will need a rebase and schema additions (`margin`, hooks, hidden) later; out of scope here.
