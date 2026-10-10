// Named saved layouts: storage-backed CRUD plus thumbnails. No DOM access.

export const LAYOUTS_KEY = 'galleryWallPlanner.layouts.v1';

const defaultStorage = () => { try { return globalThis.localStorage; } catch (e) { return null; } };
const clone = v => JSON.parse(JSON.stringify(v));
const validSnap = s => s && typeof s === 'object' && s.wall && Array.isArray(s.frames);
const validEntry = e => e && typeof e === 'object' && typeof e.id === 'string' && validSnap(e.snap);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Entries are kept oldest-first in storage; list() reverses them. update() moves its entry to the end.
export function createLayouts({ storage = defaultStorage(), key = LAYOUTS_KEY, now = Date.now } = {}) {
  function read() {
    try {
      const raw = storage && storage.getItem(key);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(validEntry) : [];
    } catch (e) { return []; }
  }
  function write(arr) {
    try { if (!storage) return false; storage.setItem(key, JSON.stringify(arr)); return true; } catch (e) { return false; }
  }
  function nameFor(raw, arr, selfId) {
    const t = String(raw == null ? '' : raw).trim();
    if (t) return t;
    let max = 0;
    for (const e of arr) {
      if (e.id === selfId) continue;
      const m = /^Layout (\d+)$/.exec(e.name);
      if (m) max = Math.max(max, +m[1]);
    }
    return 'Layout ' + (max + 1);
  }

  return {
    list: () => read().reverse().map(clone),
    get(id) { const e = read().find(x => x.id === id); return e ? clone(e) : null; },
    // Each mutator returns the entry (or true for remove) on success and false on a missing id or failed write.
    save(name, snap) {
      if (!validSnap(snap)) return false;
      const arr = read();
      const e = { id: uid(), name: nameFor(name, arr), savedAt: now(), snap: clone(snap) };
      arr.push(e);
      return write(arr) ? clone(e) : false;
    },
    update(id, snap) {
      if (!validSnap(snap)) return false;
      const arr = read(), i = arr.findIndex(x => x.id === id);
      if (i < 0) return false;
      const [e] = arr.splice(i, 1);
      e.snap = clone(snap); e.savedAt = now();
      arr.push(e);
      return write(arr) ? clone(e) : false;
    },
    rename(id, name) {
      const arr = read(), e = arr.find(x => x.id === id);
      if (!e) return false;
      e.name = nameFor(name, arr, id);
      return write(arr) ? clone(e) : false;
    },
    remove(id) {
      const arr = read(), i = arr.findIndex(x => x.id === id);
      if (i < 0) return false;
      arr.splice(i, 1);
      return write(arr);
    },
  };
}

const TW = 120, TH = 90, PAD = 4;
const n = v => Math.round(v * 100) / 100;

// Derived on demand so it always matches the data. Numbers only, no frame names, so nothing to escape.
export function thumbnailSvg(snap) {
  const w = Math.max(+snap.wall.w || 1, 1), h = Math.max(+snap.wall.h || 1, 1);
  const k = Math.min((TW - 2 * PAD) / w, (TH - 2 * PAD) / h);
  const ox = (TW - w * k) / 2, oy = (TH - h * k) / 2;
  const box = (c, x, y, bw, bh, extra = '') =>
    `<rect class="${c}" x="${n(ox + x * k)}" y="${n(oy + y * k)}" width="${n(Math.max(bw * k, .5))}" height="${n(Math.max(bh * k, .5))}"${extra}/>`;
  let out = `<svg class="thumb" viewBox="0 0 ${TW} ${TH}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`;
  out += box('tw', 0, 0, w, h);
  const a = snap.area;
  if (a) out += box('ta', +a.x || 0, +a.y || 0, +a.w || 0, +a.h || 0);
  for (const f of snap.frames) {
    const obs = f.kind === 'obstacle';
    out += box(obs ? 'to' : 'tf', +f.x || 0, +f.y || 0, +f.w || 0, +f.h || 0, obs ? '' : ` style="--hh:${Math.round(+f.hue || 0)}"`);
  }
  return out + '</svg>';
}
