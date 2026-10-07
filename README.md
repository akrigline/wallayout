# wallayout

Gallery wall planner: lay out picture frames on a wall, get a hang sheet with exact measurements, and project the layout onto the real wall with a four-corner projector calibration.

Live at https://akrigline.github.io/wallayout/ (once deployed).

## Development

```
npm install
npm run dev     # local dev server
npm test        # vitest
npm run build   # production build to dist/
```

Plans are saved in the browser's localStorage and can be shared as a `GWP1:` code.

## Roadmap

The app started as a single-file artifact and is being split into tested modules. The work is tracked as OpenSpec changes in `openspec/changes/`, in this order:

1. `extract-measurement-and-projection-math`
2. `fix-and-extract-layout-engine` (also fixes Auto-arrange/Shuffle, which currently throw)
3. `extract-plan-io` (parallel with 2)
4. `extract-state-and-history`
5. `split-ui-and-projection-modules`
