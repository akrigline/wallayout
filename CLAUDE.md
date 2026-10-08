# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code. `AGENTS.md` is a copy of this file for other agent tools; keep them identical.

- Add durable project-specific notes here as they are discovered through real work.
- wallayout is a gallery wall planner: a client-side Vite app (no framework, plain ES modules) for laying out frames on a wall, producing a hang sheet, and projecting the layout onto a real wall via a four-corner projector calibration. It began as a single-file claude.ai artifact (`index.html`); the refactor into modules is tracked as OpenSpec changes in `openspec/changes/`.
- Do not adhere to or reference any documents in `brainstorming/` unless specifically mentioned by the user for a specific task.
- The `superpowers` plugin is a transient exploration/brainstorming tool, not the project's durable convention. OpenSpec is. Any superpowers output (plans, specs, SDD task artifacts) must be directed to `brainstorming/superpowers/` rather than the plugin's default `docs/` location. The `.superpowers/` runtime state directory is gitignored and can stay at the project root.
- Spec-driven development uses the OpenSpec CLI (`openspec` on PATH). Active change proposals live in `openspec/changes/<name>/`, completed ones are moved to `openspec/changes/archive/<date>-<name>/`, and the current merged capability specs live in `openspec/specs/<capability>/spec.md`. See the `openspec-propose`/`openspec-apply-change`/`openspec-archive-change` skills for the workflow.
- `npm test` runs vitest (happy-dom, see `vitest.config.js`); `npm run build` runs the Vite production build. Both must stay green before landing a change; a husky `pre-push` hook runs `npm test`.
- No component-testing library is installed. Logic worth testing lives in plain `.js` modules with no DOM access, so it can be unit-tested directly.
- The site is served from `https://akrigline.github.io/wallayout/`, so `vite.config.js` sets `base: '/wallayout/'`. There is no custom domain/`CNAME`.
- Release/deploy is a two-workflow chain, deliberately not a single push→deploy workflow: push to `main` runs `release.yml` (test + build, then a date-based tag like `v2026.10.07`, `-2`/`-3` for same-day repeats, in `America/New_York`, then `gh release create`), which explicitly dispatches `pages.yml` (build + `actions/deploy-pages`). The explicit dispatch exists because `GITHUB_TOKEN`-authored events don't trigger other workflows. `release-reconcile.yml` (daily cron) catches Dependabot auto-merges, which land via `GITHUB_TOKEN` and so never fire `release.yml`'s push trigger. `openspec/`, `brainstorming/`, `.claude/` and `*.md` changes don't cut a release.
- The `test` job id in `ci.yml` and `release.yml` must stay literally `test`: it is the status check the branch ruleset requires.
- Dependabot PRs (grouped minor/patch) auto-merge once `test` passes.

## Status and next steps

- Repo is public by decision (`akrigline/wallayout`). As of 2026-10-07 it exists only locally: the GitHub repo has not been created or pushed, the branch ruleset requiring the `test` check is not on, and Pages is not enabled. Order matters: push, let CI go green once, then add the ruleset (see the `github-ci-scaffold` skill's `references/branch-protection.md`) and enable Pages with `build_type: workflow`. Requiring `test` before the first green run would block merging the PR that adds it.
- The module refactor is five OpenSpec changes in `openspec/changes/` (order in `README.md`). They currently have proposals only; run `/opsx:propose` on each to generate specs, design and tasks before implementing.
- `vitest.config.js` has `passWithNoTests: true` as a stopgap; remove it in the first change that adds tests.
- Known bug in the original code: `arrange()` shadows `area()` with a local `const area`, so Auto-arrange and Shuffle throw a ReferenceError. Fixed in `fix-and-extract-layout-engine`.
- Deliberately omitted: `CONTRIBUTING.md` and its issue-before-PR rule (cookbook-maker has them because it is feature-complete; this project is not).
