// Frame pictures: IndexedDB storage (memory fallback), file import with downscale, and an object-URL cache.
import { $ } from './ctx.js';
import { toast } from './toast.js';
import { renderFrames, renderProps } from './render.js';
import { MAX_SIDE, createImageStore, fitWithin, liveKeys, memoryBackend, newKey } from '../js/images.js';

const DB_NAME = 'galleryWallPlanner.images', OS = 'img';

function openDb() {
  return new Promise((resolve, reject) => {
    const idb = globalThis.indexedDB;
    if (!idb) { reject(new Error('IndexedDB unavailable')); return; }
    let r;
    try { r = idb.open(DB_NAME, 1); } catch (e) { reject(e); return; }
    r.onupgradeneeded = () => { r.result.createObjectStore(OS); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}

function idbBackend(db) {
  const run = (mode, fn) => new Promise((resolve, reject) => {
    let out;
    try {
      const t = db.transaction(OS, mode);
      out = fn(t.objectStore(OS));
      t.oncomplete = () => resolve(out.result);
      t.onerror = t.onabort = () => reject(t.error || new Error('IndexedDB transaction failed'));
    } catch (e) { reject(e); }
  });
  return {
    put: (key, blob) => run('readwrite', os => os.put(blob, key)),
    get: async key => (await run('readonly', os => os.get(key))) || null,
    remove: key => run('readwrite', os => os.delete(key)),
    keys: () => run('readonly', os => os.getAllKeys()),
  };
}

let warned = false;
function warnVolatile() {
  if (warned) return;
  warned = true;
  toast('This browser can\'t store pictures, so this one will be gone after a reload.');
}

// IndexedDB first; anything it refuses lives in memory for the session, with a one-time warning.
function hybridBackend() {
  const mem = memoryBackend();
  let idbP;
  const idb = () => idbP || (idbP = openDb().then(idbBackend, () => null));
  return {
    async put(key, blob) {
      const b = await idb();
      if (b) { try { await b.put(key, blob); return; } catch (e) { /* quota or similar: fall back */ } }
      await mem.put(key, blob); warnVolatile();
    },
    async get(key) {
      const m = await mem.get(key); if (m) return m;
      const b = await idb(); if (!b) return null;
      try { return await b.get(key); } catch (e) { return null; }
    },
    async remove(key) {
      await mem.remove(key);
      const b = await idb(); if (b) { try { await b.remove(key); } catch (e) { /* ignore */ } }
    },
    async keys() {
      const out = new Set(await mem.keys());
      const b = await idb(); if (b) { try { for (const k of await b.keys()) out.add(k); } catch (e) { /* ignore */ } }
      return [...out];
    },
  };
}

export const images = createImageStore(hybridBackend());

/* ---------- import ---------- */
async function decode(file) {
  if (globalThis.createImageBitmap) {
    const bmp = await createImageBitmap(file);
    return { src: bmp, w: bmp.width, h: bmp.height, done: () => { if (bmp.close) bmp.close(); } };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    return { src: img, w: img.naturalWidth, h: img.naturalHeight, done: () => URL.revokeObjectURL(url) };
  } catch (e) { URL.revokeObjectURL(url); throw e; }
}

// JPEG blob with the long side at most MAX_SIDE. Flattened onto white because JPEG has no transparency.
export async function downscale(file) {
  const d = await decode(file);
  try {
    if (!(d.w > 0 && d.h > 0)) throw new Error('empty image');
    const { w, h } = fitWithin(d.w, d.h, MAX_SIDE);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = 'high'; g.drawImage(d.src, 0, 0, w, h);
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', .85));
    if (!blob) throw new Error('could not encode');
    return blob;
  } finally { d.done(); }
}

// Must be called straight from a click so the browser allows the chooser. Resolves null if cancelled.
export function chooseImage() {
  return new Promise(resolve => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.addEventListener('change', () => resolve((i.files && i.files[0]) || null));
    i.addEventListener('cancel', () => resolve(null));
    i.click();
  });
}

const urls = new Map();       // key -> object URL, or null when there is no data for it
const pending = new Set();
const mine = new Set();       // keys stored this session, so boot cleanup can never take them

// Resolves to a new key, or throws if the file is not a usable image.
export async function storePicture(file) {
  if (file.type && !file.type.startsWith('image/')) throw new Error('not an image');
  const blob = await downscale(file);
  const key = newKey();
  await images.put(key, blob);
  mine.add(key); urls.set(key, URL.createObjectURL(blob));
  return key;
}

/* ---------- display ---------- */
// Object URL for a key if loaded, else null. A first call starts the load and re-renders when it lands.
export function pictureUrl(key) {
  if (urls.has(key)) return urls.get(key);
  if (!pending.has(key)) {
    pending.add(key);
    images.get(key)
      .then(blob => { urls.set(key, blob ? URL.createObjectURL(blob) : null); }, () => { urls.set(key, null); })
      .then(() => {
        pending.delete(key);
        if (!urls.get(key)) return;
        renderFrames();
        const p = $('#props'); if (!p.contains(document.activeElement)) renderProps();
      });
  }
  return null;
}

/* ---------- cleanup ---------- */
// Delete stored pictures that no frame in the working plan or any saved layout uses. `snaps` is null when
// saved layouts could not be read, in which case nothing is deleted.
export async function collectOrphans(frames, snaps) {
  if (!snaps) return [];
  try {
    const live = liveKeys(frames, snaps);
    for (const k of mine) live.add(k);
    const gone = await images.collect(live);
    for (const k of gone) { const u = urls.get(k); if (u) URL.revokeObjectURL(u); urls.delete(k); }
    return gone;
  } catch (e) { return []; }
}
