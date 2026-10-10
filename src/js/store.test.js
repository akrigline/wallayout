import { describe, it, expect, vi } from 'vitest'
import { createStore, defaults, mergeSaved, HISTORY_LIMIT } from './store.js'

const memStorage = (init = {}) => { const m = { ...init }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v }, m } }
const KEY = 'galleryWallPlanner.v1'
const frame = id => ({ id, name: 'F' + id, w: 5, h: 5, x: id, y: 0, hue: 0, kind: 'frame' })

describe('persistence', () => {
  it('restores saved state and is not fresh', () => {
    const st = memStorage({ [KEY]: JSON.stringify({ wall: { w: 50, h: 40 }, frames: [frame(1)], gap: 5 }) })
    const s = createStore({ storage: st })
    expect(s.fresh).toBe(false)
    expect(s.state.wall).toEqual({ w: 50, h: 40 })
    expect(s.state.gap).toBe(5)
  })
  it('merges saved over defaults including nested', () => {
    const m = mergeSaved({ cal: { set: true }, proj: { style: 'wash' } })
    expect(m.cal.set).toBe(true); expect(m.cal.custom).toBe(false); expect(m.cal.corners).toHaveLength(4)
    expect(m.proj).toEqual({ ...defaults().proj, style: 'wash' })
  })
  it.each([['corrupt JSON', '{not json'], ['null', 'null'], ['array', '[]'], ['empty', '']])('starts fresh on %s', (_, raw) => {
    const s = createStore({ storage: memStorage({ [KEY]: raw }) })
    expect(s.fresh).toBe(true)
    expect(s.state).toEqual(defaults())
  })
  it('survives storage that throws', () => {
    const bad = { getItem() { throw new Error('denied') }, setItem() { throw new Error('quota') } }
    const s = createStore({ storage: bad })
    expect(s.fresh).toBe(true)
    expect(() => { s.state.frames.push(frame(1)); s.checkpoint() }).not.toThrow()
  })
  it('survives missing storage', () => {
    expect(() => createStore({ storage: null }).save()).not.toThrow()
  })
  it('saves on checkpoint', () => {
    const st = memStorage(); const s = createStore({ storage: st })
    s.state.frames.push(frame(1)); s.checkpoint()
    expect(JSON.parse(st.m[KEY]).frames).toHaveLength(1)
  })
})

describe('history', () => {
  const edit = (s, x) => { s.state.frames[0].x = x; s.checkpoint() }
  const mk = () => { const s = createStore({ storage: memStorage() }); s.state.frames = [frame(1)]; s.resetHistory(); return s }

  it('undoes and redoes', () => {
    const s = mk(); edit(s, 10)
    expect(s.undo()).toBe(true); expect(s.state.frames[0].x).toBe(1)
    expect(s.redo()).toBe(true); expect(s.state.frames[0].x).toBe(10)
  })
  it('ignores no-op checkpoints', () => {
    const s = mk(); s.checkpoint(); s.checkpoint()
    expect(s.canUndo()).toBe(false)
  })
  it('truncates redo on a new edit', () => {
    const s = mk(); edit(s, 2); edit(s, 3); s.undo(); s.undo(); edit(s, 9)
    expect(s.canRedo()).toBe(false)
  })
  it('caps history at 150', () => {
    const s = mk(); for (let i = 0; i < 200; i++) edit(s, 100 + i)
    let steps = 0; while (s.undo()) steps++
    expect(steps).toBe(HISTORY_LIMIT - 1)
  })
  it('does not roll back untracked fields', () => {
    const s = mk(); edit(s, 5)
    s.state.cal.set = true; s.state.unit = 'cm'; s.state.gap = 9
    s.undo()
    expect([s.state.cal.set, s.state.unit, s.state.gap]).toEqual([true, 'cm', 9])
  })
  it('clears selection when the frame disappears', () => {
    const s = mk(); s.state.frames.push(frame(2)); s.state.sel = 2; s.checkpoint(); s.undo()
    expect(s.state.sel).toBeNull()
  })
  it('notifies subscribers', () => {
    const s = mk(), fn = vi.fn(); s.subscribe(fn)
    edit(s, 4); s.undo()
    expect(fn.mock.calls.map(c => c[0])).toEqual(['checkpoint', 'restore'])
  })
})

describe('lock', () => {
  it('blocks undo/redo while locked and resumes after', () => {
    const s = createStore({ storage: memStorage() }); s.state.frames = [frame(1)]; s.resetHistory()
    s.state.frames[0].x = 7; s.checkpoint()
    s.state.locked = true
    expect(s.canUndo()).toBe(false); expect(s.undo()).toBe(false); expect(s.state.frames[0].x).toBe(7)
    s.state.locked = false
    expect(s.undo()).toBe(true); expect(s.state.frames[0].x).toBe(1)
  })
  it('persists the lock', () => {
    const st = memStorage(); const a = createStore({ storage: st }); a.state.locked = true; a.save()
    expect(createStore({ storage: st }).state.locked).toBe(true)
  })
})

describe('snapshot API', () => {
  const mk = () => { const s = createStore({ storage: memStorage() }); s.state.frames = [frame(1), frame(2)]; s.state.nextId = 3; s.resetHistory(); return s }
  const other = () => ({ wall: { w: 60, h: 40 }, area: { x: 1, y: 1, w: 30, h: 20 }, frames: [frame(9)], nextId: 10 })

  it('snapshot is a deep copy of the layout only', () => {
    const s = mk(), d = s.snapshot()
    expect(Object.keys(d).sort()).toEqual(['area', 'frames', 'nextId', 'wall'])
    d.frames[0].x = 99; d.wall.w = 1
    expect(s.state.frames[0].x).toBe(1); expect(s.state.wall.w).toBe(120)
  })
  it('apply replaces the layout and is undoable and redoable', () => {
    const s = mk(), before = s.snapshot()
    s.applySnapshot(other())
    expect(s.state.wall).toEqual({ w: 60, h: 40 }); expect(s.state.frames.map(f => f.id)).toEqual([9]); expect(s.state.nextId).toBe(10)
    expect(s.undo()).toBe(true); expect(s.snapshot()).toEqual(before)
    expect(s.redo()).toBe(true); expect(s.state.frames.map(f => f.id)).toEqual([9])
  })
  it('applying the identical layout adds no history', () => {
    const s = mk(); s.applySnapshot(s.snapshot())
    expect(s.canUndo()).toBe(false)
  })
  it('clears a stale selection but keeps a valid one', () => {
    const s = mk(); s.state.sel = 1; s.applySnapshot(other())
    expect(s.state.sel).toBeNull()
    const t = mk(); t.state.sel = 2; t.applySnapshot({ ...t.snapshot(), nextId: 5 })
    expect(t.state.sel).toBe(2)
  })
  it('does not alias the applied snapshot', () => {
    const s = mk(), d = other(); s.applySnapshot(d); d.frames[0].x = 77
    expect(s.state.frames[0].x).toBe(9)
  })
  it('leaves device settings alone and persists', () => {
    const st = memStorage(), s = createStore({ storage: st }); s.state.unit = 'cm'; s.state.cal.set = true
    s.applySnapshot(other())
    expect([s.state.unit, s.state.cal.set]).toEqual(['cm', true])
    expect(JSON.parse(st.m[KEY]).wall).toEqual({ w: 60, h: 40 })
  })
})
