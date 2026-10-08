import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'

let errors
// Each boot re-imports the app, which registers document-level listeners; drop the previous boot's.
const docListeners = []
const realAdd = document.addEventListener.bind(document)
document.addEventListener = (type, fn, opts) => { docListeners.push([type, fn, opts]); realAdd(type, fn, opts) }
async function boot(saved) {
  for (const [type, fn, opts] of docListeners.splice(0)) document.removeEventListener(type, fn, opts)
  vi.resetModules()
  localStorage.clear()
  if (saved) localStorage.setItem('galleryWallPlanner.v1', JSON.stringify(saved))
  const html = readFileSync('index.html', 'utf8')
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[^>]*><\/script>/, '')
  errors = []
  window.addEventListener('error', e => errors.push(e.error || e.message))
  await import('./main.js')
}
const click = sel => { const el = document.querySelector(sel); if (!el) throw new Error('missing ' + sel); el.click() }
const frames = () => document.querySelectorAll('.fr').length
const saved = () => JSON.parse(localStorage.getItem('galleryWallPlanner.v1'))
const toastText = () => document.querySelector('#toast').textContent

describe('app boot', () => {
  it('renders saved frames', async () => {
    const fs = [1, 2, 3].map(id => ({ id, name: 'F' + id, w: 8, h: 10, x: id * 10, y: 10, hue: id * 40, kind: 'frame' }))
    await boot({ frames: fs, nextId: 4 })
    expect(frames()).toBe(3)
    expect(document.querySelectorAll('#list .li').length).toBe(3)
  })
  it('renders the starter plan on a fresh visit', async () => {
    await boot(null)
    expect(frames()).toBe(7)
    expect(saved().frames).toHaveLength(7)
  })
})

describe('wall planning UI', () => {
  it('adds frames from chips and undoes/redoes', async () => {
    await boot(null)
    click('[data-act="chip"]')
    expect(frames()).toBe(8)
    click('#bUndo'); expect(frames()).toBe(7)
    click('#bRedo'); expect(frames()).toBe(8)
    expect(errors).toEqual([])
  })
  it('adds a pasted list', async () => {
    await boot(null)
    document.querySelector('#bulk').value = 'Harbor 24x36\nSketch 8 x 10'
    click('[data-act="addBulk"]')
    
    expect(frames()).toBe(9)
    expect(toastText()).toBe('Added 2 frames.')
  })
  it('runs Auto-arrange, Shuffle and Center group without error', async () => {
    await boot(null)
    click('[data-act="arrange"]'); click('[data-act="shuffle"]'); click('[data-act="centerGroup"]')
    expect(frames()).toBe(7)
    expect(errors).toEqual([])
  })
  it('switches units', async () => {
    await boot(null)
    click('[data-unit="cm"]')
    expect(saved().unit).toBe('cm')
    expect(document.querySelector('#wW').value).toBe('304.8')
  })
  it('flags overlaps in the list', async () => {
    const fs = [1, 2].map(id => ({ id, name: 'F' + id, w: 8, h: 10, x: 10, y: 10, hue: 0, kind: 'frame' }))
    await boot({ frames: fs, nextId: 3 })
    expect(document.querySelectorAll('#list .warn')).toHaveLength(2)
    expect(document.querySelector('#cnt').textContent).toContain('2 with conflicts')
  })
  it('rejects bad input', async () => {
    await boot(null)
    const w = document.querySelector('#wW'); w.value = 'abc'; w.dispatchEvent(new Event('change'))
    expect(toastText()).toMatch(/didn't look like a number/)
  })
})

describe('keyboard', () => {
  const key = (k, init = {}) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }))
  it('selects, nudges, rotates, deletes and undoes', async () => {
    const fs = [{ id: 1, name: 'A', w: 8, h: 10, x: 10, y: 10, hue: 0, kind: 'frame' }]
    await boot({ frames: fs, nextId: 2 })
    click('#list .li')
    key('ArrowRight')
    expect(document.querySelector('.fr').style.left).toBe('205px')
    key('r')
    expect(document.querySelector('#props [data-k="w"]').value).toBe('10')
    key('Delete')
    expect(frames()).toBe(0)
    key('z', { ctrlKey: true })
    expect(frames()).toBe(1)
    expect(errors).toEqual([])
  })
})

describe('sheet, share and lock', () => {
  it('opens the hang sheet and locks the layout, which then blocks edits', async () => {
    await boot(null)
    click('header [data-act="sheet"]')
    expect(document.querySelector('#sheet').hidden).toBe(false)
    expect(document.querySelectorAll('#sheetBody tbody tr')).toHaveLength(7)
    click('#bCommit')
    expect(saved().locked).toBe(true)
    click('[data-act="chip"]')
    expect(frames()).toBe(7)
    expect(toastText()).toMatch(/locked/i)
    expect(document.querySelector('#bUndo').disabled).toBe(true)
    click('[data-act="unlock"]')
    expect(saved().locked).toBe(false)
  })
  it('round-trips a share code', async () => {
    await boot(null)
    click('header [data-act="share"]')
    const code = document.querySelector('#codeOut').value
    expect(code.startsWith('GWP1:')).toBe(true)
    click('[data-act="clearAll"]'); click('[data-act="clearAll"]')
    expect(frames()).toBe(0)
    document.querySelector('#codeIn').value = code
    click('[data-act="importCode"]')
    expect(frames()).toBe(7)
    expect(errors).toEqual([])
  })
})

describe('projection', () => {
  it('enters projection mode, calibrates, and exits', async () => {
    await boot(null)
    click('[data-act="project"]')
    expect(document.querySelector('#stage').classList.contains('projecting')).toBe(true)
    expect(document.querySelector('#wall').classList.contains('project')).toBe(true)
    expect(document.querySelector('#calPanel').hidden).toBe(false)
    click('[data-act="calDone"]')
    expect(saved().cal.set).toBe(true)
    expect(document.querySelector('#calPanel').hidden).toBe(true)
    click('[data-v="solid"]')
    expect(saved().proj.style).toBe('solid')
    click('[data-act="hideUI"]')
    expect(document.querySelector('#ptool').hidden).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }))
    expect(document.querySelector('#ptool').hidden).toBe(false)
    click('[data-act="exit"]')
    expect(document.querySelector('#stage').classList.contains('projecting')).toBe(false)
    expect(errors).toEqual([])
  })
})
