import { describe, it, expect } from 'vitest'
import { homography, inv3, mapPt } from './homography.js'

const rect = [[0, 0], [100, 0], [100, 50], [0, 50]]
const quad = [[10, 5], [210, 20], [190, 160], [-5, 120]]

describe('homography', () => {
  it('is identity-like for equal corners', () => {
    const h = homography(rect, rect)
    const p = mapPt(h, 37, 12)
    expect(p[0]).toBeCloseTo(37); expect(p[1]).toBeCloseTo(12)
  })
  it('maps corners to corners', () => {
    const h = homography(rect, quad)
    rect.forEach((s, i) => {
      const p = mapPt(h, s[0], s[1])
      expect(p[0]).toBeCloseTo(quad[i][0]); expect(p[1]).toBeCloseTo(quad[i][1])
    })
  })
  it('round-trips through the inverse', () => {
    const h = homography(rect, quad), hi = inv3(h)
    const p = mapPt(hi, ...mapPt(h, 42, 17))
    expect(p[0]).toBeCloseTo(42); expect(p[1]).toBeCloseTo(17)
  })
  it('returns null for collinear destination', () => {
    expect(homography(rect, [[0, 0], [1, 1], [2, 2], [3, 3]])).toBeNull()
  })
  it('returns null inverting a singular matrix', () => {
    expect(inv3([1, 2, 3, 2, 4, 6, 3, 6, 9])).toBeNull()
  })
})
