import { describe, it, expect } from 'vitest'
import { newKey, fitWithin, liveKeys, memoryBackend, createImageStore } from './images.js'

describe('newKey', () => {
  it('makes distinct non-empty strings', () => {
    const keys = new Set(Array.from({ length: 200 }, newKey))
    expect(keys.size).toBe(200)
    for (const k of keys) expect(k).toMatch(/^[a-z0-9]{10,}$/)
  })
})

describe('fitWithin', () => {
  it('scales the long side down to the max', () => {
    expect(fitWithin(4000, 3000, 1000)).toEqual({ w: 1000, h: 750 })
    expect(fitWithin(3000, 4000, 1000)).toEqual({ w: 750, h: 1000 })
  })
  it('never enlarges', () => {
    expect(fitWithin(300, 200, 1000)).toEqual({ w: 300, h: 200 })
    expect(fitWithin(1000, 1000, 1000)).toEqual({ w: 1000, h: 1000 })
  })
  it('defaults to 1000 and keeps at least one pixel', () => {
    expect(fitWithin(5000, 5000)).toEqual({ w: 1000, h: 1000 })
    expect(fitWithin(10000, 1, 1000)).toEqual({ w: 1000, h: 1 })
  })
})

describe('liveKeys', () => {
  it('collects keys from the working frames and every saved layout', () => {
    const live = liveKeys([{ id: 1, img: 'a' }, { id: 2 }], [{ frames: [{ img: 'b' }, { img: 'a' }] }, { frames: [{ img: 'c' }] }])
    expect([...live].sort()).toEqual(['a', 'b', 'c'])
  })
  it('ignores missing, empty and non-string keys and malformed snapshots', () => {
    const live = liveKeys([{ img: '' }, { img: 5 }, null], [null, {}, { frames: null }])
    expect(live.size).toBe(0)
  })
  it('works without layouts', () => {
    expect([...liveKeys([{ img: 'x' }])]).toEqual(['x'])
  })
})

describe('image store', () => {
  it('puts, gets and removes', async () => {
    const s = createImageStore(memoryBackend())
    await s.put('a', 'blob-a')
    expect(await s.get('a')).toBe('blob-a')
    expect(await s.get('nope')).toBeNull()
    await s.remove('a')
    expect(await s.get('a')).toBeNull()
    await expect(s.remove('a')).resolves.toBeUndefined()
  })
  it('collect deletes only keys that are not live and reports them', async () => {
    const s = createImageStore()
    for (const k of ['a', 'b', 'c']) await s.put(k, k)
    const gone = await s.collect(new Set(['b']))
    expect(gone.sort()).toEqual(['a', 'c'])
    expect(await s.keys()).toEqual(['b'])
  })
  it('collect on an empty store is a no-op', async () => {
    expect(await createImageStore().collect(new Set(['a']))).toEqual([])
  })
})
