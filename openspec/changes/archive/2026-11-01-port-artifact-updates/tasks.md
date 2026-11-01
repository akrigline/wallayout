## 1. Pure logic (tests first)

- [x] 1.1 Add `src/js/hooks.js` (`hooksOf`, `cleanHooks`, `scaleHooks`) with `hooks.test.js`
- [x] 1.2 Add `src/js/selection.js` (`boundsOf`, `alignMoves`, `distributeMoves`) with `selection.test.js`
- [x] 1.3 `layout.js`: skip hidden pieces everywhere; obstacles never conflict; `hit` prefers frames over obstacles; `snapMove` takes an `exclude` set; update `layout.test.js`
- [x] 1.4 `hangSheet.js`: per-hook rows, hidden omitted with stable numbers, hidden count, multi-hook text; update `hangSheet.test.js`
- [x] 1.5 `shareCode.js`: optional `margin`, per-frame `hooks` and `hidden`, sanitizing; update `shareCode.test.js`
- [x] 1.6 `store.js`: defaults `margin: 3` and `proj.margin: true`, merged over older saves; update `store.test.js`

## 2. Markup and CSS

- [x] 2.1 `index.html`: margin field, "Default hook below top" label, Select all / Show all buttons, `#mgl` and `#marq` in the wall, "Show / hide" button, Margins toggle, `#piecesPanel`
- [x] 2.2 CSS: halo layer, list row with eye button, marquee, hook list and align toolbar, obstacle z-index and opacity, drop `.fr` overflow clipping, `.hk` positioned per hook, `#piecesPanel`

## 3. UI wiring

- [x] 3.1 `ctx.js`: `T.sels`, `T.marq`, `T.hkdrag`, `T.piecesOpen`; selection helpers (`syncSel`, `setSelection`, `toggleSel`, `selFrames`)
- [x] 3.2 `render.js`: halos, per-hook marks, hidden frames, eye list rows, group panel and HUD, hook panel, pieces panel, hidden count
- [x] 3.3 `actions.js`: hook-aware `addFrame`, hide-aware helpers; `modals.js`: hang sheet table and share code use the new data
- [x] 3.4 `interaction.js`: click actions (select with modifiers, align, dist, hook add/two/reset/delete, vis, showAll, pieces, selAll, selNone, delSel, centerSel), margin input, hook inputs, pieces panel checkboxes, stage pointer (marquee, group drag, hook drag), keyboard (Ctrl+A, Escape, group delete and nudge, rotate guard)

## 4. Verify

- [x] 4.1 Extend `src/smoke.test.js` for hide/show, multi-select with align, hooks and the margin setting
- [x] 4.2 `npm test` and `npm run build` pass
- [x] 4.3 Check drag, marquee, hook drag, halos and the projection panels in headless Chromium; no console errors

## 5. Ship

- [x] 5.1 Update `CLAUDE.md` and `AGENTS.md` (identical) with the new modules and sharp edges
- [x] 5.2 Sync specs, archive the change, commit, push the branch, open the PR, wait for `test`, merge to `main`, confirm the release and Pages deploy
