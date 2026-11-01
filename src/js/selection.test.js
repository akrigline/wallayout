import { describe, it, expect } from 'vitest'
import { boundsOf, alignMoves, distributeMoves, centerMoves } from './selection.js'

const fr = (id, x, y, w, h) => ({ id, name: 'F' + id, x, y, w, h, kind: 'frame' })
const byId = moves => Object.fromEntries(moves.map(m => [m.id, m]))

describe('boundsOf', () => {
  it('covers all frames', () => {
    expect(boundsOf([fr(1, 4, 5, 10, 10), fr(2, 20, 0, 5, 30)])).toEqual({ x0: 4, y0: 0, x1: 25, y1: 30 })
  })
})

describe('alignMoves', () => {
  const g = [fr(1, 4, 0, 10, 10), fr(2, 10, 20, 6, 10), fr(3, 7, 40, 8, 4)]
  it('aligns left edges to the group box', () => {
    expect(alignMoves(g, 'left').map(m => m.x)).toEqual([4, 4, 4])
  })
  it('aligns right edges', () => {
    const m = byId(alignMoves(g, 'right'))
    expect(m[1].x + 10).toBe(16); expect(m[2].x + 6).toBe(16); expect(m[3].x + 8).toBe(16)
  })
  it('centers horizontally', () => {
    const m = byId(alignMoves(g, 'hcenter'))
    expect(m[1].x + 5).toBe(10); expect(m[2].x + 3).toBe(10)
  })
  it('aligns top, bottom and vertical centers', () => {
    expect(alignMoves(g, 'top').map(m => m.y)).toEqual([0, 0, 0])
    const b = byId(alignMoves(g, 'bottom')); expect(b[1].y + 10).toBe(44); expect(b[3].y + 4).toBe(44)
    const v = byId(alignMoves(g, 'vcenter')); expect(v[3].y + 2).toBe(22)
  })
  it('leaves the other axis alone', () => {
    const m = byId(alignMoves(g, 'left')); expect(m[2].y).toBe(20)
  })
  it('rounds to 1/16 and needs two frames', () => {
    expect(alignMoves([fr(1, 0, 0, 10, 10)], 'left')).toEqual([])
    const m = byId(alignMoves([fr(1, 0, 0, 10, 10), fr(2, 0, 0, 3.01, 3)], 'hcenter'))
    expect(m[2].x * 16).toBe(Math.round(m[2].x * 16))
  })
  it('does not mutate', () => {
    const f = [fr(1, 4, 0, 10, 10), fr(2, 10, 0, 6, 10)]; alignMoves(f, 'left')
    expect(f[1].x).toBe(10)
  })
})

describe('distributeMoves', () => {
  it('evens the gaps horizontally and keeps the outer two fixed', () => {
    const m = byId(distributeMoves([fr(1, 0, 0, 10, 10), fr(2, 12, 0, 10, 10), fr(3, 40, 0, 10, 10)], 'h'))
    expect([m[1].x, m[2].x, m[3].x]).toEqual([0, 20, 40])
  })
  it('orders by center and works vertically', () => {
    const m = byId(distributeMoves([fr(3, 0, 40, 10, 10), fr(1, 0, 0, 10, 10), fr(2, 0, 5, 10, 10)], 'v'))
    expect([m[1].y, m[2].y, m[3].y]).toEqual([0, 20, 40])
  })
  it('needs three frames', () => {
    expect(distributeMoves([fr(1, 0, 0, 5, 5), fr(2, 9, 0, 5, 5)], 'h')).toEqual([])
  })
})

describe('centerMoves', () => {
  it('centers the group box in the area', () => {
    const m = centerMoves([fr(1, 0, 0, 10, 10), fr(2, 20, 0, 10, 10)], { x: 0, y: 0, w: 100, h: 60 })
    expect(m).toEqual([{ id: 1, x: 35, y: 25 }, { id: 2, x: 55, y: 25 }])
  })
  it('returns nothing for an empty group', () => {
    expect(centerMoves([], { x: 0, y: 0, w: 1, h: 1 })).toEqual([])
  })
})
