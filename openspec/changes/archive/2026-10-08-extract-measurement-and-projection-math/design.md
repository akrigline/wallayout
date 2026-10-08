## Context

`index.html` holds unit, parsing and homography helpers inside one IIFE; `num`/`fmt`/`parseLen` read the global `S.unit`.

## Goals / Non-Goals

**Goals:** DOM-free, tested modules with identical behavior; Vite entry `src/main.js`.
**Non-Goals:** moving DOM code, changing any behavior.

## Decisions

- **Unit as a parameter.** `num(v, unit)`, `fmt(v, unit)`, `parseLen(s, unit)`, `parseBulk(txt, unit)`. The inline script keeps thin wrappers (`const num = v => N(v, S.unit)`) so call sites are untouched.
- **Homography code moved verbatim.** `solve` is exported for testing; `homography` returns `null` for singular systems and `inv3` for near-zero determinants (already the case).
- **Entry point.** `index.html` keeps its inline script for now but converts it to `<script type="module" src="/src/main.js">` with the old script moved to `src/main.js` unchanged apart from imports. Inline CSS stays in `index.html` until the UI split.
- **Fonts** remain the Google Fonts link.

## Risks / Trade-offs

- Moving the script into a module makes it deferred and strict; it already used `'use strict'` and runs after the DOM, so no change expected. Verified by build + test.
