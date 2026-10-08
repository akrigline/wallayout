import { describe, it, expect } from 'vitest'
import { sheetRows, sheetText, conflictNotice } from './hangSheet.js'

const plan = frames => ({ wall: { w: 100, h: 96 }, hook: 2, frames })
const fr = (id, x, y, w, h, kind = 'frame') => ({ id, name: 'F' + id, x, y, w, h, kind })

describe('sheetRows', () => {
  it('measures from ceiling and floor', () => {
    const [r] = sheetRows(plan([fr(1, 5, 8, 10, 20)]))
    expect(r).toMatchObject({ n: 1, left: 5, right: 85, top: 8, floor: 68, hx: 10, hfloor: 86 })
  })
  it('excludes obstacles without consuming numbers', () => {
    const rows = sheetRows(plan([fr(1, 0, 0, 5, 5, 'obstacle'), fr(2, 0, 0, 5, 5), fr(3, 9, 9, 5, 5)]))
    expect(rows.map(r => [r.n, r.f.id])).toEqual([[1, 2], [2, 3]])
  })
})

describe('sheetText', () => {
  it('uses the chosen unit', () => {
    const t = sheetText(plan([fr(1, 5, 8, 10, 20)]), 'cm')
    expect(t).toContain('cm')
    expect(t).not.toContain('″')
    expect(t).toContain('1. F1 (25.4 cm × 50.8 cm)')
  })
  it('uses inches with fractions', () => {
    expect(sheetText(plan([fr(1, 5.5, 8, 10, 20)]), 'in')).toContain('left edge 5 1/2″')
  })
})

describe('conflictNotice', () => {
  it('handles none, one, many', () => {
    expect(conflictNotice(0)).toBe('')
    expect(conflictNotice(1)).toMatch(/^1 frame has a conflict/)
    expect(conflictNotice(2)).toMatch(/^2 frames have a conflict/)
  })
})
