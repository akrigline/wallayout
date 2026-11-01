import { describe, it, expect } from 'vitest'
import { createLayouts, thumbnailSvg, LAYOUTS_KEY } from './layouts.js'

const memStorage = (init = {}) => { const m = { ...init }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v }, m } }
const frame = (id, o = {}) => ({ id, name: 'F' + id, w: 8, h: 10, x: id * 10, y: 5, hue: 120, kind: 'frame', ...o })
const snap = (o = {}) => ({ wall: { w: 120, h: 96 }, area: null, frames: [frame(1), frame(2)], nextId: 3, ...o })
let t = 1000
const mk = (storage = memStorage()) => ({ storage, L: createLayouts({ storage, now: () => ++t }) })
const count = (svg, c) => (svg.match(new RegExp(`class="${c}"`, 'g')) || []).length

describe('CRUD', () => {
  it('saves and lists newest first', () => {
    const { L } = mk()
    L.save('A', snap()); L.save('B', snap()); L.save('C', snap())
    expect(L.list().map(e => e.name)).toEqual(['C', 'B', 'A'])
  })
  it('trims names and allows duplicates', () => {
    const { L } = mk()
    const a = L.save('  Salon  ', snap()), b = L.save('Salon', snap())
    expect(a.name).toBe('Salon'); expect(a.id).not.toBe(b.id)
    expect(L.list()).toHaveLength(2)
  })
  it('defaults blank names to Layout N after the highest existing', () => {
    const { L } = mk()
    L.save('', snap()); L.save('   ', snap()); L.save('Layout 7', snap())
    expect(L.save('', snap()).name).toBe('Layout 8')
    expect(L.list().map(e => e.name)).toEqual(['Layout 8', 'Layout 7', 'Layout 2', 'Layout 1'])
  })
  it('gets by id and returns null when missing', () => {
    const { L } = mk(); const e = L.save('A', snap())
    expect(L.get(e.id).snap).toEqual(snap()); expect(L.get('nope')).toBeNull()
  })
  it('update replaces the snapshot, keeps the name and moves to the top', () => {
    const { L } = mk(); const a = L.save('A', snap()); L.save('B', snap())
    const e = L.update(a.id, snap({ nextId: 50 }))
    expect(e.name).toBe('A'); expect(e.savedAt).toBeGreaterThan(a.savedAt)
    expect(L.list().map(x => x.name)).toEqual(['A', 'B'])
    expect(L.get(a.id).snap.nextId).toBe(50)
  })
  it('rename trims, keeps position, and defaults when blank', () => {
    const { L } = mk(); const a = L.save('A', snap()); L.save('B', snap())
    expect(L.rename(a.id, '  Hall ').name).toBe('Hall')
    expect(L.list().map(x => x.name)).toEqual(['B', 'Hall'])
    expect(L.rename(a.id, '').name).toBe('Layout 1')
  })
  it('remove deletes and reports missing ids', () => {
    const { L } = mk(); const a = L.save('A', snap())
    expect(L.remove(a.id)).toBe(true); expect(L.list()).toEqual([])
    expect(L.remove(a.id)).toBe(false); expect(L.update('x', snap())).toBe(false); expect(L.rename('x', 'n')).toBe(false)
  })
  it('persists across instances', () => {
    const { storage, L } = mk(); L.save('A', snap())
    expect(createLayouts({ storage }).list().map(e => e.name)).toEqual(['A'])
    expect(JSON.parse(storage.m[LAYOUTS_KEY])).toHaveLength(1)
  })
})

describe('aliasing', () => {
  it('saved entries do not follow later edits to the source', () => {
    const { L } = mk(); const s = snap(); const e = L.save('A', s)
    s.frames[0].x = 99; s.wall.w = 1
    expect(L.get(e.id).snap.frames[0].x).toBe(10); expect(L.get(e.id).snap.wall.w).toBe(120)
  })
  it('returned entries are copies', () => {
    const { L } = mk(); const e = L.save('A', snap())
    e.snap.frames.length = 0; L.list()[0].snap.frames.length = 0
    expect(L.get(e.id).snap.frames).toHaveLength(2)
  })
})

describe('bad storage', () => {
  it.each([['corrupt', '{nope'], ['object', '{}'], ['null', 'null'], ['empty', '']])('treats %s data as empty', (_, raw) => {
    const { L } = mk(memStorage({ [LAYOUTS_KEY]: raw }))
    expect(L.list()).toEqual([])
    expect(L.save('A', snap()).name).toBe('A')
  })
  it('drops malformed entries but keeps valid ones', () => {
    const good = { id: 'g', name: 'G', savedAt: 1, snap: snap() }
    const { L } = mk(memStorage({ [LAYOUTS_KEY]: JSON.stringify([good, { id: 1 }, null, { id: 'x', snap: {} }]) }))
    expect(L.list().map(e => e.id)).toEqual(['g'])
  })
  it('reports write failures and does not add a phantom entry', () => {
    const st = memStorage(); const L = createLayouts({ storage: st })
    const a = L.save('A', snap())
    st.setItem = () => { throw new Error('quota') }
    expect(L.save('B', snap())).toBe(false)
    expect(L.update(a.id, snap({ nextId: 9 }))).toBe(false)
    expect(L.rename(a.id, 'Z')).toBe(false)
    expect(L.remove(a.id)).toBe(false)
    expect(L.list().map(e => e.name)).toEqual(['A'])
  })
  it('survives missing or throwing storage', () => {
    expect(createLayouts({ storage: null }).list()).toEqual([])
    expect(createLayouts({ storage: null }).save('A', snap())).toBe(false)
    const bad = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') } }
    expect(createLayouts({ storage: bad }).list()).toEqual([])
  })
})

describe('thumbnailSvg', () => {
  it('draws the wall and one shape per frame', () => {
    const svg = thumbnailSvg(snap({ frames: [1, 2, 3, 4, 5].map(i => frame(i)) }))
    expect(count(svg, 'tw')).toBe(1); expect(count(svg, 'tf')).toBe(5); expect(count(svg, 'ta')).toBe(0)
  })
  it('styles obstacles distinctly', () => {
    const svg = thumbnailSvg(snap({ frames: [frame(1), frame(2, { kind: 'obstacle' })] }))
    expect(count(svg, 'tf')).toBe(1); expect(count(svg, 'to')).toBe(1)
  })
  it('includes the gallery area only when set', () => {
    expect(count(thumbnailSvg(snap({ area: { x: 10, y: 10, w: 50, h: 40 } })), 'ta')).toBe(1)
  })
  it('shows just the outline for an empty wall', () => {
    const svg = thumbnailSvg(snap({ frames: [] }))
    expect(count(svg, 'tw')).toBe(1); expect(count(svg, 'tf')).toBe(0)
  })
  it('uses a fixed viewBox and keeps shapes inside it', () => {
    for (const wall of [{ w: 400, h: 20 }, { w: 20, h: 400 }]) {
      const svg = thumbnailSvg(snap({ wall }))
      expect(svg).toContain('viewBox="0 0 120 90"')
      const r = /class="tw" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg).slice(1).map(Number)
      expect(r[0]).toBeGreaterThanOrEqual(0); expect(r[1]).toBeGreaterThanOrEqual(0)
      expect(r[0] + r[2]).toBeLessThanOrEqual(120); expect(r[1] + r[3]).toBeLessThanOrEqual(90)
    }
  })
  it('never includes frame names', () => {
    expect(thumbnailSvg(snap({ frames: [frame(1, { name: '<script>x</script>' })] }))).not.toContain('script')
  })
})
