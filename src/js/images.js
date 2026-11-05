// Frame picture bookkeeping: keys, sizing, an image store over an injectable backend, orphan collection. No DOM access.

export const MAX_SIDE = 1000;

export function newKey() {
  const r = () => Math.random().toString(36).slice(2, 10);
  return Date.now().toString(36) + r() + r();
}

// Scale (w,h) so the long side is at most `max`. Never enlarges. Result is whole pixels, at least 1.
export function fitWithin(w, h, max = MAX_SIDE) {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

// Every picture key used by `frames` and by each saved-layout snapshot in `layoutSnaps`.
export function liveKeys(frames, layoutSnaps = []) {
  const live = new Set();
  const add = list => { for (const f of list || []) if (f && typeof f.img === 'string' && f.img) live.add(f.img); };
  add(frames);
  for (const s of layoutSnaps) add(s && s.frames);
  return live;
}

// Async, Map-backed. Used as the fallback when IndexedDB is unavailable, and in tests.
export function memoryBackend() {
  const m = new Map();
  return {
    memory: true,
    async put(key, blob) { m.set(key, blob); },
    async get(key) { return m.has(key) ? m.get(key) : null; },
    async remove(key) { m.delete(key); },
    async keys() { return [...m.keys()]; },
  };
}

export function createImageStore(backend = memoryBackend()) {
  return {
    backend,
    put: (key, blob) => backend.put(key, blob),
    get: key => backend.get(key),
    remove: key => backend.remove(key),
    keys: () => backend.keys(),
    // Delete every stored picture whose key is not in `live`. Returns the removed keys.
    async collect(live) {
      const gone = [];
      for (const k of await backend.keys()) if (!live.has(k)) { await backend.remove(k); gone.push(k); }
      return gone;
    },
  };
}
