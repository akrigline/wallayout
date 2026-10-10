// Persisted plan state with autosave and snapshot undo/redo. No DOM access.

export const HISTORY_LIMIT = 150;

export const defaults = () => ({
  unit: 'in', wall: { w: 120, h: 96 }, area: null, gap: 2, grid: 0, hook: 2, hooks: true, snap: true,
  frames: [], sel: null, locked: false, nextId: 1,
  cal: { set: false, corners: [[.12, .12], [.88, .12], [.88, .88], [.12, .88]], custom: false, ref: { x: 0, y: 0, w: 48, h: 36 } },
  proj: { style: 'outline', labels: true, grid: false, edge: true, mono: false },
});

// Merge saved state over fresh defaults, including nested cal and proj.
export function mergeSaved(saved) {
  const d = defaults();
  return Object.assign(d, saved, {
    cal: Object.assign(defaults().cal, saved.cal || {}),
    proj: Object.assign(defaults().proj, saved.proj || {}),
  });
}

const defaultStorage = () => { try { return globalThis.localStorage; } catch (e) { return null; } };

export function createStore({ storage = defaultStorage(), key = 'galleryWallPlanner.v1' } = {}) {
  const state = defaults();
  let fresh = true;
  try {
    const raw = storage && storage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) { Object.assign(state, mergeSaved(saved)); fresh = false; }
    }
  } catch (e) { /* corrupt or unavailable storage: start from defaults */ }

  let hist = [], hi = -1;
  const listeners = new Set();
  const emit = ev => listeners.forEach(fn => fn(ev));
  const snap = () => JSON.stringify({ wall: state.wall, area: state.area, frames: state.frames, nextId: state.nextId });

  function save() { try { storage && storage.setItem(key, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  function resetHistory() { hist = [snap()]; hi = 0; }
  function checkpoint() {
    const s = snap();
    if (s === hist[hi]) { save(); return; }
    hist = hist.slice(0, hi + 1); hist.push(s);
    if (hist.length > HISTORY_LIMIT) hist.shift();
    hi = hist.length - 1; save(); emit('checkpoint');
  }
  function restore(i) {
    const d = JSON.parse(hist[i]);
    state.wall = d.wall; state.area = d.area || null; state.frames = d.frames; state.nextId = d.nextId; hi = i;
    if (!state.frames.some(f => f.id === state.sel)) state.sel = null;
    save(); emit('restore');
  }
  function snapshot() { return JSON.parse(snap()); }
  // Replace the layout with a saved snapshot as one undoable step. Does not check the lock; callers do.
  function applySnapshot(d) {
    const c = JSON.parse(JSON.stringify(d));
    state.wall = c.wall; state.area = c.area || null; state.frames = c.frames; state.nextId = c.nextId;
    if (!state.frames.some(f => f.id === state.sel)) state.sel = null;
    checkpoint();
  }
  const canUndo = () => !state.locked && hi > 0;
  const canRedo = () => !state.locked && hi < hist.length - 1;

  resetHistory();
  return {
    state, fresh, save, checkpoint, resetHistory, canUndo, canRedo, snapshot, applySnapshot,
    undo() { if (!canUndo()) return false; restore(hi - 1); return true; },
    redo() { if (!canRedo()) return false; restore(hi + 1); return true; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
