## 1. Units module

- [x] 1.1 Create `src/js/units.js` with `fracIn`, `num`, `fmt`, `parseLen`, `parseBulk` taking `unit` explicitly
- [x] 1.2 Add `src/js/units.test.js` covering the measurement-units scenarios

## 2. Homography module

- [x] 2.1 Create `src/js/homography.js` with `solve`, `homography`, `inv3`, `mapPt`
- [x] 2.2 Add `src/js/homography.test.js` covering the projection-mapping scenarios

## 3. Wire in

- [x] 3.1 Move the inline script to `src/main.js`, import the modules, and keep `S.unit` wrappers
- [x] 3.2 Load `src/main.js` from `index.html` as a module
- [x] 3.3 Remove `passWithNoTests` from `vitest.config.js`
- [x] 3.4 `npm test` and `npm run build` pass
