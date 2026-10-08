# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code. `AGENTS.md` is a copy of this file for other agent tools; keep them identical.

- Add durable project-specific notes here as they are discovered through real work.
- wallayout is a gallery wall planner: a client-side Vite app (no framework, plain ES modules) for laying out frames on a wall, producing a hang sheet, and projecting the layout onto a real wall via a four-corner projector calibration. It began as a single-file claude.ai artifact (`index.html`); the refactor into modules is tracked as OpenSpec changes in `openspec/changes/`.
- Do not adhere to or reference any documents in `brainstorming/` unless specifically mentioned by the user for a specific task.
- The `superpowers` plugin is a transient exploration/brainstorming tool, not the project's durable convention. OpenSpec is. Any superpowers output (plans, specs, SDD task artifacts) must be directed to `brainstorming/superpowers/` rather than the plugin's default `docs/` location. The `.superpowers/` runtime state directory is gitignored and can stay at the project root.
- Spec-driven development uses the OpenSpec CLI (`openspec` on PATH). Active change proposals live in `openspec/changes/<name>/`, completed ones are moved to `openspec/changes/archive/<date>-<name>/`, and the current merged capability specs live in `openspec/specs/<capability>/spec.md`. See the `openspec-propose`/`openspec-apply-change`/`openspec-archive-change` skills for the workflow.
- `npm test` runs vitest (happy-dom, see `vitest.config.js`); `npm run build` runs the Vite production build. Both must stay green before landing a change; a husky `pre-push` hook runs `npm test`.
- No component-testing library is installed. Logic worth testing lives in plain `.js` modules with no DOM access, so it can be unit-tested directly.
- The site is served from `https://wallayout.akrigline.com/` (GitHub Pages custom domain; `public/CNAME` ships it, DNS is a `wallayout` CNAME to `akrigline.github.io` in the Google Cloud DNS zone for akrigline.com), so `vite.config.js` sets `base: '/'`. The old `www.akrigline.com/wallayout/` path stops working once the custom domain is set.
- Release/deploy is a two-workflow chain, deliberately not a single push→deploy workflow: push to `main` runs `release.yml` (test + build, then a date-based tag like `v2026.10.07`, `-2`/`-3` for same-day repeats, in `America/New_York`, then `gh release create`), which explicitly dispatches `pages.yml` (build + `actions/deploy-pages`). The explicit dispatch exists because `GITHUB_TOKEN`-authored events don't trigger other workflows. `release-reconcile.yml` (daily cron) catches Dependabot auto-merges, which land via `GITHUB_TOKEN` and so never fire `release.yml`'s push trigger. `openspec/`, `brainstorming/`, `.claude/` and `*.md` changes don't cut a release.
- The `test` job id in `ci.yml` and `release.yml` must stay literally `test`: it is the status check the branch ruleset requires.
- Dependabot PRs (grouped minor/patch) auto-merge once `test` passes.

## Architecture

- `index.html` is markup only; `src/main.js` imports CSS from `src/css/` (tokens, layout, wall, projection, responsive: keep that order, responsive must stay last) and boots the UI.
- Pure, DOM-free logic in `src/js/`, each with a sibling `*.test.js`: `units`, `homography`, `layout` (conflicts, snapping, arrange), `hangSheet`, `shareCode` (`GWP1:` codes, must stay byte-compatible), `store` (state, localStorage persistence, 150-deep undo, lock).
- DOM code in `src/ui/`: `ctx.js` (shared `S`/`T`/store/element refs, `V` holds the current homography), `render.js`, `actions.js`, `modals.js`, `projection.js`, `interaction.js`, `toast.js`. The modules import each other circularly, which is fine because nothing runs at import time except `ctx.js`; listeners are registered by the `init*()` functions called from `main.js`.
- `src/smoke.test.js` boots the whole app in happy-dom (it must drop document-level listeners between boots) and drives clicks, keys and projection mode. happy-dom has no layout, so drag/snap and projection visuals need a real browser; the Chrome devtools tool was flaky, headless `chrome-headless-shell --screenshot` from `~/.cache/ms-playwright` works.

## Status and next steps

- Repo is public (`akrigline/wallayout`), pushed 2026-10-07. First CI run was green, the `main-require-ci` ruleset (requires `test`, admin bypass) is on, Pages is enabled with `build_type: workflow`, and release `v2026.10.07` deployed.
- The five-change module refactor is complete and archived in `openspec/changes/archive/`; current specs are in `openspec/specs/`.
- Fixed along the way: `arrange()` shadowed `area()` (Auto-arrange, Shuffle and the first-run boot threw), and the lock banner showed while unlocked (`.banner` `display:flex` beat `[hidden]`).
- Verified in headless Chromium on 2026-10-07 (drag with snap guides, area resize, projection outline/wash/solid, calibration panel; no console errors). Known cosmetic issue: labels clip on very small frames (e.g. 5×7).
- Deliberately omitted: `CONTRIBUTING.md` and its issue-before-PR rule (cookbook-maker has them because it is feature-complete; this project is not).
