import { describe, it, expect } from 'vitest'
import { hooksOf, cleanHooks, scaleHooks, addedHook, twoHooks } from './hooks.js'

const fr = (extra = {}) => ({ id: 1, name: 'F', x: 0, y: 0, w: 20, h: 10, kind: 'frame', ...extra })

describe('hooksOf', () => {
  it('defaults to one hook at the center and the default offset', () => {
    expect(hooksOf(fr(), 2)).toEqual([{ x: 10, y: 2 }])
  })
  it('returns the frame\'s own hooks when set', () => {
    const hooks = [{ x: 3, y: 1 }, { x: 17, y: 1 }]
    expect(hooksOf(fr({ hooks }), 2)).toBe(hooks)
  })
  it('treats an empty list as the default', () => {
    expect(hooksOf(fr({ hooks: [] }), 4)).toEqual([{ x: 10, y: 4 }])
  })
})

describe('cleanHooks', () => {
  it('returns undefined without hooks', () => {
    expect(cleanHooks(fr())).toBeUndefined()
    expect(cleanHooks(fr({ hooks: 'x' }))).toBeUndefined()
  })
  it('drops invalid entries and clamps the rest into the frame', () => {
    const f = fr({ hooks: [{ x: 'a', y: 1 }, null, { x: -3, y: 50 }, { x: 5, y: 5 }, { x: NaN, y: 1 }] })
    expect(cleanHooks(f)).toEqual([{ x: 0, y: 10 }, { x: 5, y: 5 }])
  })
  it('returns undefined when nothing is valid', () => {
    expect(cleanHooks(fr({ hooks: [{ x: 'a' }] }))).toBeUndefined()
  })
  it('keeps at most 8', () => {
    const hooks = Array.from({ length: 12 }, (_, i) => ({ x: i, y: 1 }))
    expect(cleanHooks(fr({ hooks }))).toHaveLength(8)
  })
  it('does not mutate its input', () => {
    const f = fr({ hooks: [{ x: 99, y: 99 }] }); cleanHooks(f)
    expect(f.hooks[0]).toEqual({ x: 99, y: 99 })
  })
})

describe('scaleHooks', () => {
  it('scales x with the width', () => {
    const f = fr({ w: 20, hooks: [{ x: 8, y: 2 }] }); scaleHooks(f, 'w', 10, 20)
    expect(f.hooks[0].x).toBe(16)
  })
  it('limits y to the new height', () => {
    const f = fr({ hooks: [{ x: 5, y: 8 }] }); scaleHooks(f, 'h', 10, 4)
    expect(f.hooks[0].y).toBe(4)
  })
  it('is a no-op without custom hooks', () => {
    const f = fr(); scaleHooks(f, 'w', 10, 20)
    expect(f.hooks).toBeUndefined()
  })
})

describe('addedHook / twoHooks', () => {
  it('adds a quarter-width to the right of the last, same height', () => {
    expect(addedHook(fr(), 2)).toEqual({ x: 15, y: 2 })
  })
  it('goes left when that would leave the frame', () => {
    expect(addedHook(fr({ hooks: [{ x: 18, y: 3 }] }), 2)).toEqual({ x: 13, y: 3 })
  })
  it('makes two hooks at 25% and 75% at the first hook\'s height', () => {
    expect(twoHooks(fr(), 2)).toEqual([{ x: 5, y: 2 }, { x: 15, y: 2 }])
    expect(twoHooks(fr({ hooks: [{ x: 1, y: 4 }] }), 2)).toEqual([{ x: 5, y: 4 }, { x: 15, y: 4 }])
  })
})
