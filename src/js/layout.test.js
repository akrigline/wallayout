import { describe, it, expect } from 'vitest'
import { areaOf, normArea, computeBad, gapsOf, hit, snapMove, findSpot, arrange, centerGroup } from './layout.js'

const fr = (id, x, y, w, h, extra = {}) => ({ id, name: 'F' + id, x, y, w, h, kind: 'frame', ...extra })
const plan = (frames, extra = {}) => ({ wall: { w: 120, h: 96 }, area: null, gap: 2, grid: 0, snap: true, frames, ...extra })

describe('computeBad', () => {
  it('flags frames past the wall, not ones on the edge', () => {
    const bad = computeBad(plan([fr(1, 110, 0, 20, 10), fr(2, 100, 50, 20, 10)]))
    expect(bad.get(1)).toBe('Extends past the wall')
    expect(bad.has(2)).toBe(false)
  })
  it('flags frames outside the area but exempts obstacles', () => {
    const p = plan([fr(1, 0, 0, 10, 10), fr(2, 0, 20, 10, 10, { kind: 'obstacle' })], { area: { x: 30, y: 30, w: 50, h: 50 } })
    const bad = computeBad(p)
    expect(bad.get(1)).toBe('Outside the gallery area')
    expect(bad.has(2)).toBe(false)
  })
  it('flags overlaps on both frames; touching is fine', () => {
    const bad = computeBad(plan([fr(1, 0, 0, 10, 10), fr(2, 5, 5, 10, 10), fr(3, 15, 5, 10, 10)]))
    expect(bad.get(1)).toBe('Overlaps F2')
    expect(bad.get(2)).toBe('Overlaps F1')
    expect(bad.has(3)).toBe(false)
  })
})

describe('gapsOf / hit / normArea', () => {
  it('measures neighbor gaps', () => {
    const a = fr(1, 10, 10, 10, 10), b = fr(2, 25, 12, 10, 10), c = fr(3, 12, 30, 10, 10)
    expect(gapsOf([a, b, c], a)).toEqual({ L: null, R: 5, T: null, B: 10 })
  })
  it('hits the topmost frame', () => {
    const a = fr(1, 0, 0, 10, 10), b = fr(2, 5, 5, 10, 10)
    expect(hit([a, b], 7, 7)).toBe(b)
    expect(hit([a, b], 50, 50)).toBeNull()
  })
  it('clamps an area onto the wall without mutating', () => {
    const a = { x: 100, y: -5, w: 50, h: 1 }
    expect(normArea(a, { w: 120, h: 96 })).toEqual({ x: 70, y: 0, w: 50, h: 2 })
    expect(a.x).toBe(100)
    expect(normArea(null, { w: 1, h: 1 })).toBeNull()
  })
})

describe('snapMove', () => {
  const other = fr(2, 40, 10, 10, 10)
  it('snaps to a neighbor plus gap and reports a guide', () => {
    const f = fr(1, 0, 0, 10, 10)
    const r = snapMove(plan([f, other]), f, 52.5, 30, false, 1)
    expect(r.x).toBe(52)
    expect(r.guides).toContainEqual({ axis: 'x', pos: 52 })
  })
  it('leaves out-of-range positions alone', () => {
    const f = fr(1, 0, 0, 10, 10)
    const r = snapMove(plan([f, other], { wall: { w: 500, h: 500 } }), f, 77.3, 91.1, false, 0.5)
    expect([r.x, r.y, r.guides.length]).toEqual([77.3, 91.1, 0])
  })
  it('grid-rounds only unsnapped axes', () => {
    const f = fr(1, 0, 0, 10, 10)
    const r = snapMove(plan([f, other], { grid: 1 }), f, 52.2, 33.4, false, 1)
    expect(r.x).toBe(52); expect(r.y).toBe(33)
  })
  it('grid-rounds with snapping off', () => {
    const f = fr(1, 0, 0, 10, 10)
    const r = snapMove(plan([f], { snap: false, grid: 0.5 }), f, 3.3, 4.8, false, 1)
    expect([r.x, r.y]).toEqual([3.5, 5])
  })
  it('does nothing when free', () => {
    const f = fr(1, 0, 0, 10, 10)
    const r = snapMove(plan([f, other], { grid: 1 }), f, 52.2, 33.4, true, 1)
    expect([r.x, r.y, r.guides.length]).toEqual([52.2, 33.4, 0])
  })
})

describe('findSpot', () => {
  it('finds the first clear spot', () => {
    expect(findSpot(plan([]), 10, 10)).toEqual([2, 2])
    const [x, y] = findSpot(plan([fr(1, 2, 2, 10, 10)]), 10, 10)
    expect(y).toBe(2); expect(x).toBeGreaterThanOrEqual(13)
  })
  it('falls back to the clamped center', () => {
    expect(findSpot(plan([], { wall: { w: 10, h: 10 } }), 20, 20)).toEqual([0, 0])
  })
})

describe('arrange', () => {
  const frames = () => [fr(1, 0, 0, 24, 36), fr(2, 0, 0, 16, 20), fr(3, 0, 0, 11, 14), fr(4, 0, 0, 8, 10), fr(5, 0, 0, 12, 12)]
  const apply = (fs, moves) => fs.map(f => ({ ...f, ...(moves.find(m => m.id === f.id) || {}) }))
  it('packs without overlap and centers the cluster', () => {
    const p = plan(frames()), r = arrange(p)
    expect(r.overflow).toBe(false)
    const placed = apply(p.frames, r.moves)
    expect(computeBad({ ...p, frames: placed }).size).toBe(0)
    const x0 = Math.min(...placed.map(f => f.x)), x1 = Math.max(...placed.map(f => f.x + f.w))
    expect((x0 + x1) / 2).toBeCloseTo(60, 0)
  })
  it('does not move obstacles or mutate input', () => {
    const p = plan([...frames(), fr(9, 5, 5, 10, 10, { kind: 'obstacle' })])
    const r = arrange(p)
    expect(r.moves.some(m => m.id === 9)).toBe(false)
    expect(p.frames[0].x).toBe(0)
  })
  it('is deterministic for a fixed rng', () => {
    const seq = () => { let i = 0; const v = [0.3, 0.9, 0.1, 0.6]; return () => v[i++ % v.length] }
    const a = arrange(plan(frames()), { shuffle: true, rng: seq() }), b = arrange(plan(frames()), { shuffle: true, rng: seq() })
    expect(a).toEqual(b)
  })
  it('reports overflow when frames are too big', () => {
    const r = arrange(plan([fr(1, 0, 0, 50, 60), fr(2, 0, 0, 50, 60)], { wall: { w: 60, h: 80 } }))
    expect(r.overflow).toBe(true)
    expect(r.moves).toHaveLength(2)
  })
  it('returns no moves with no frames', () => { expect(arrange(plan([])).moves).toEqual([]) })
})

describe('centerGroup', () => {
  it('centers the bounding box and keeps relative positions', () => {
    const p = plan([fr(1, 0, 0, 10, 10), fr(2, 20, 0, 10, 10)])
    const m = centerGroup(p)
    expect(m[1].x - m[0].x).toBe(20)
    const x0 = m[0].x, x1 = m[1].x + 10
    expect((x0 + x1) / 2).toBeCloseTo(60)
    expect(m[0].y + 5).toBeCloseTo(48)
  })
  it('uses the area', () => {
    expect(areaOf(plan([], { area: { x: 1, y: 2, w: 3, h: 4 } }))).toEqual({ x: 1, y: 2, w: 3, h: 4 })
  })
})
