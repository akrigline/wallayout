import { describe, it, expect } from 'vitest'
import { fracIn, num, fmt, parseLen, parseBulk } from './units.js'

describe('formatting', () => {
  it('uses fractions to 1/8 in inches', () => {
    expect(num(16.5, 'in')).toBe('16 1/2')
    expect(fmt(16.5, 'in')).toBe('16 1/2″')
    expect(fracIn(0.25)).toBe('1/4')
    expect(fracIn(0.125)).toBe('1/8')
  })
  it('carries rounding into the whole number', () => { expect(fracIn(2.99)).toBe('3') })
  it('handles negatives', () => { expect(fracIn(-1.5)).toBe('-1 1/2') })
  it('uses one decimal in cm', () => {
    expect(num(16, 'cm')).toBe('40.6')
    expect(fmt(16, 'cm')).toBe('40.6 cm')
  })
})

describe('parseLen', () => {
  it('parses mixed and bare fractions', () => {
    expect(parseLen('1 1/2', 'in')).toBe(1.5)
    expect(parseLen('3/4', 'in')).toBe(0.75)
  })
  it('ignores unit decoration', () => {
    for (const s of ['16"', '16 in', '16 inches', '16″']) expect(parseLen(s, 'in')).toBe(16)
  })
  it('converts cm to inches', () => { expect(parseLen('40.6 cm', 'cm')).toBeCloseTo(40.6 / 2.54) })
  it('rejects garbage', () => {
    expect(parseLen('abc', 'in')).toBeNaN()
    expect(parseLen('', 'in')).toBeNaN()
  })
})

describe('parseBulk', () => {
  it('parses a named line', () => {
    expect(parseBulk('Harbor 24x36', 'in')).toEqual([{ name: 'Harbor', w: 24, h: 36 }])
  })
  it('parses spaced and fractional sizes', () => {
    const out = parseBulk('Portrait 16 x 20\n11 1/2 x 14', 'in')
    expect(out).toEqual([{ name: 'Portrait', w: 16, h: 20 }, { name: '', w: 11.5, h: 14 }])
  })
  it('skips unparseable lines', () => {
    expect(parseBulk('nothing here\n0x5\n8x10', 'in')).toEqual([{ name: '', w: 8, h: 10 }])
  })
})
