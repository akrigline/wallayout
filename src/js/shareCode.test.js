import { describe, it, expect } from 'vitest'
import { encodeSpec, decodeSpec } from './shareCode.js'

const defaults = { gap: 2, hook: 2 }
const mk = (frames, extra = {}) => ({ unit: 'in', wall: { w: 120, h: 96 }, area: null, gap: 3, hook: 4, frames, ...extra })
const fr = (i, extra = {}) => ({ id: 50 + i, name: 'F' + i, w: 8, h: 10, x: i, y: i, hue: 100, kind: 'frame', ...extra })
const enc = obj => 'GWP1:' + btoa(unescape(encodeURIComponent(JSON.stringify(obj))))

describe('round trip', () => {
  it('preserves the plan and renumbers ids', () => {
    const p = mk([fr(1), fr(2, { kind: 'obstacle' })], { unit: 'cm', area: { x: 1, y: 2, w: 30, h: 40 } })
    const d = decodeSpec(encodeSpec(p), defaults)
    expect(d).toMatchObject({ unit: 'cm', wall: p.wall, area: p.area, gap: 3, hook: 4 })
    expect(d.frames.map(f => f.id)).toEqual([1, 2])
    expect(d.frames[1].kind).toBe('obstacle')
  })
  it('survives unicode names', () => {
    expect(decodeSpec(encodeSpec(mk([fr(1, { name: 'Café 🌅' })])), defaults).frames[0].name).toBe('Café 🌅')
  })
  it('is byte-compatible with the original format', () => {
    const code = encodeSpec(mk([fr(1)]))
    expect(code.startsWith('GWP1:')).toBe(true)
    expect(JSON.parse(decodeURIComponent(escape(atob(code.slice(5)))))).toMatchObject({ v: 1, unit: 'in' })
  })
  it('excludes calibration and projection', () => {
    const json = decodeURIComponent(escape(atob(encodeSpec({ ...mk([fr(1)]), cal: {}, proj: {} }).slice(5))))
    expect(json).not.toMatch(/"cal"|"proj"/)
  })
  it('ignores whitespace in pasted codes', () => {
    const code = encodeSpec(mk([fr(1)]))
    expect(decodeSpec(code.slice(0, 20) + '\n  ' + code.slice(20), defaults).frames).toHaveLength(1)
  })
})

describe('rejection', () => {
  it.each([
    ['no prefix', 'hello'],
    ['bad base64', 'GWP1:@@@'],
    ['non-JSON', 'GWP1:' + btoa('not json')],
    ['no wall', enc({ frames: [] })],
    ['zero wall', enc({ wall: { w: 0, h: 5 }, frames: [] })],
    ['frames not array', enc({ wall: { w: 5, h: 5 }, frames: {} })],
    ['zero-size frame', enc({ wall: { w: 5, h: 5 }, frames: [{ w: 0, h: 1, x: 0, y: 0 }] })],
    ['non-finite position', enc({ wall: { w: 5, h: 5 }, frames: [{ w: 1, h: 1, x: 'a', y: 0 }] })],
    ['null frame', enc({ wall: { w: 5, h: 5 }, frames: [null] })],
  ])('rejects %s', (_, code) => { expect(() => decodeSpec(code, defaults)).toThrow() })

  it('rejects oversized codes', () => {
    expect(() => decodeSpec('GWP1:' + 'A'.repeat(200001), defaults)).toThrow()
  })
})

describe('sanitizing', () => {
  it('caps at 500 frames', () => {
    const frames = Array.from({ length: 600 }, (_, i) => ({ w: 1, h: 1, x: 0, y: 0 }))
    expect(decodeSpec(enc({ wall: { w: 5, h: 5 }, frames }), defaults).frames).toHaveLength(500)
  })
  it('truncates names, defaults name/hue/kind', () => {
    const f = decodeSpec(enc({ wall: { w: 5, h: 5 }, frames: [{ name: 'x'.repeat(200), w: 1, h: 1, x: 0, y: 0, kind: 'weird' }, { w: 1, h: 1, x: 0, y: 0 }] }), defaults).frames
    expect(f[0].name).toHaveLength(80)
    expect(f[0].kind).toBe('frame')
    expect(f[1].name).toBe('Frame')
    expect(typeof f[1].hue).toBe('number')
  })
  it('uses defaults for missing gap/hook and drops bad areas', () => {
    const d = decodeSpec(enc({ wall: { w: 5, h: 5 }, frames: [], gap: -1, area: { x: 0, y: 0, w: 0, h: 1 } }), { gap: 7, hook: 9 })
    expect([d.gap, d.hook, d.area]).toEqual([7, 9, null])
  })
})
