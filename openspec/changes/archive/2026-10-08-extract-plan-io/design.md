## Context

`sheetRows`, `sheetText`, `encodeSpec` and `decodeSpec` read the global `S` and `T.num`.

## Decisions

- **Plain data in.** `sheetRows(plan)` numbers frames itself (same rule as the UI's renumber). `sheetText(plan, unit)` formats with `fmt` from `units.js`. `conflictNotice(count)` returns the warning text (empty for 0). The HTML table remains in the UI code.
- **Share codes.** `encodeSpec(plan)` / `decodeSpec(text, defaults)` where defaults supplies `{gap, hook}`. The wire format is untouched. A 200,000-character cap is added before decoding (a 500-frame plan is far smaller). `escape`/`unescape` are kept for byte-compatibility.
- Importing still applies in `main.js` (`normArea`, history).

## Risks

- Adding the length cap could reject an exotic existing code; 500 frames encode to well under 100k characters, so risk is negligible.
