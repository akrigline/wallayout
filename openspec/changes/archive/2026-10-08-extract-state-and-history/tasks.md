## 1. Store

- [x] 1.1 Create `src/js/store.js` with `defaults`, `mergeSaved`, `createStore`
- [x] 1.2 Add `src/js/store.test.js` covering persistence, merge, corrupt/throwing storage, history truncation and cap, tracked fields, selection clearing, and lock

## 2. Wire in

- [x] 2.1 Replace `S`, history, `save`, `checkpoint`, `restore`, `undo`, `redo` in `src/main.js` with the store and subscribe for rendering
- [x] 2.2 `npm test` and `npm run build` pass
