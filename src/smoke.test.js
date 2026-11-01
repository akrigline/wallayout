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

describe('saved layouts', () => {
  const cards = () => [...document.querySelectorAll('#layoutList .lcard')]
  const act = (card, a) => card.querySelector(`[data-act="${a}"]`).click()
  const names = () => cards().map(c => c.querySelector('.lname').textContent)
  const stubDialogs = ({ confirm = true, prompt = null } = {}) => {
    window.confirm = () => confirm; window.prompt = () => prompt
  }

  it('saves, loads, undoes a load, updates, renames and deletes', async () => {
    await boot(null)
    stubDialogs()
    click('header [data-act="layouts"]')
    expect(document.querySelector('#layouts').hidden).toBe(false)
    expect(cards()).toHaveLength(0)
    expect(document.querySelector('#layoutList').textContent).toMatch(/No saved layouts/)

    document.querySelector('#layoutName').value = '  Salon wall '
    click('[data-act="saveLayout"]')
    expect(names()).toEqual(['Salon wall'])
    expect(cards()[0].querySelector('svg.thumb')).not.toBeNull()
    expect(cards()[0].textContent).toMatch(/7 frames/)
    expect(JSON.parse(localStorage.getItem('galleryWallPlanner.layouts.v1'))).toHaveLength(1)

    click('[data-act="closeLayouts"]')
    expect(document.querySelector('#layouts').hidden).toBe(true)
    click('[data-act="clearAll"]'); click('[data-act="clearAll"]')
    expect(frames()).toBe(0)

    click('header [data-act="layouts"]')
    act(cards()[0], 'loadLayout')
    expect(frames()).toBe(7)
    expect(toastText()).toMatch(/Loaded "Salon wall"/)
    click('#bUndo'); expect(frames()).toBe(0)
    click('#bRedo'); expect(frames()).toBe(7)

    // update from a changed layout
    click('[data-act="chip"]'); expect(frames()).toBe(8)
    click('header [data-act="layouts"]')
    act(cards()[0], 'updateLayout')
    expect(cards()[0].textContent).toMatch(/8 frames/)
    stubDialogs({ confirm: false })
    click('[data-act="clearAll"]'); click('[data-act="clearAll"]')
    act(cards()[0], 'updateLayout')
    expect(cards()[0].textContent).toMatch(/8 frames/)

    // rename, then rename to blank gets a default
    stubDialogs({ prompt: 'Hall' }); act(cards()[0], 'renameLayout')
    expect(names()).toEqual(['Hall'])
    stubDialogs({ prompt: '' }); act(cards()[0], 'renameLayout')
    expect(names()).toEqual(['Layout 1'])

    // delete: declined then confirmed
    stubDialogs({ confirm: false }); act(cards()[0], 'deleteLayout')
    expect(cards()).toHaveLength(1)
    stubDialogs(); act(cards()[0], 'deleteLayout')
    expect(cards()).toHaveLength(0)
    expect(errors).toEqual([])
  })

  it('refuses load and update while locked but still allows save', async () => {
    await boot(null)
    stubDialogs()
    click('header [data-act="layouts"]')
    click('[data-act="saveLayout"]')
    click('[data-act="closeLayouts"]')
    click('[data-act="clearAll"]'); click('[data-act="clearAll"]')
    click('header [data-act="sheet"]'); click('#bCommit')
    expect(saved().locked).toBe(true)

    click('header [data-act="layouts"]')
    expect(document.querySelector('#layoutsLock').hidden).toBe(false)
    const card = cards()[0]
    expect(card.querySelector('[data-act="loadLayout"]').disabled).toBe(true)
    expect(card.querySelector('[data-act="updateLayout"]').disabled).toBe(true)
    act(card, 'loadLayout')
    expect(frames()).toBe(0)

    click('[data-act="saveLayout"]')
    expect(names()).toEqual(['Layout 2', 'Layout 1'])
    expect(errors).toEqual([])
  })

  it('toasts when storage rejects a save and shows no phantom entry', async () => {
    await boot(null)
    click('header [data-act="layouts"]')
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('quota') })
    try { click('[data-act="saveLayout"]') } finally { spy.mockRestore() }
    expect(toastText()).toMatch(/Couldn't save/)
    expect(cards()).toHaveLength(0)
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

describe('visual margins', () => {
  const field = () => document.querySelector('#sMargin')
  const setMargin = v => { field().value = v; field().dispatchEvent(new Event('change')) }
  it('draws a halo per frame, honours the setting, and rejects bad input', async () => {
    await boot(null)
    expect(field().value).toBe('3')
    expect(document.querySelectorAll('.mg')).toHaveLength(7)
    setMargin('5')
    expect(saved().margin).toBe(5)
    setMargin('abc')
    expect(toastText()).toMatch(/didn't look like a number/)
    expect(field().value).toBe('5')
    setMargin('0')
    expect(document.querySelectorAll('.mg')).toHaveLength(0)
    expect(errors).toEqual([])
  })
  it('toggles margins in projection mode', async () => {
    await boot(null)
    click('header [data-act="project"]')
    click('#ptool [data-t="margin"]')
    expect(saved().proj.margin).toBe(false)
    expect(document.querySelector('#wall').classList.contains('nomargin')).toBe(true)
    click('#ptool [data-t="margin"]')
    expect(document.querySelector('#wall').classList.contains('nomargin')).toBe(false)
  })
})

describe('hide and show', () => {
  const eyes = () => document.querySelectorAll('#list .eye')
  it('hides a piece everywhere, shows all, and undoes', async () => {
    await boot(null)
    eyes()[0].click()
    expect(document.querySelectorAll('.fr')[0].style.display).toBe('none')
    expect(document.querySelectorAll('.mg')).toHaveLength(6)
    expect(document.querySelector('#cnt').textContent).toContain('1 hidden')
    expect(saved().frames[0].hidden).toBe(true)
    click('header [data-act="sheet"]')
    expect(document.querySelectorAll('#sheetBody tbody tr')).toHaveLength(6)
    expect(document.querySelector('#sheetBody').textContent).toMatch(/1 hidden piece is not listed/)
    click('[data-act="closeSheet"]')
    click('#side [data-act="showAll"]')
    expect(document.querySelector('.fr').style.display).toBe('')
    expect(saved().frames[0].hidden).toBeUndefined()
    click('#bUndo')
    expect(document.querySelectorAll('.fr')[0].style.display).toBe('none')
    expect(errors).toEqual([])
  })
  it('works while locked and is driven from the projection panel', async () => {
    await boot(null)
    click('header [data-act="sheet"]'); click('#bCommit')
    eyes()[1].click()
    expect(saved().frames[1].hidden).toBe(true)
    click('header [data-act="project"]')
    click('#pPieces')
    const boxes = document.querySelectorAll('#piecesPanel [data-vis]')
    expect(boxes).toHaveLength(7)
    expect(boxes[1].checked).toBe(false)
    boxes[1].checked = true; boxes[1].dispatchEvent(new Event('change', { bubbles: true }))
    expect(saved().frames[1].hidden).toBeUndefined()
  })
  it('keeps hidden state through a share code', async () => {
    await boot(null)
    eyes()[2].click()
    click('header [data-act="share"]')
    const code = document.querySelector('#codeOut').value
    click('[data-act="clearAll"]'); click('[data-act="clearAll"]')
    document.querySelector('#codeIn').value = code
    click('[data-act="importCode"]')
    expect(saved().frames[2].hidden).toBe(true)
  })
})

describe('multi-select', () => {
  const key = (k, init = {}) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }))
  const rows = () => [...document.querySelectorAll('#list .li')]
  const shiftClick = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
  it('selects with shift, aligns, distributes, centers and deletes as undoable steps', async () => {
    const fs = [[1, 5, 10], [2, 30, 40], [3, 70, 20]].map(([id, x, y]) => ({ id, name: 'F' + id, w: 8, h: 10, x, y, hue: 0, kind: 'frame' }))
    await boot({ frames: fs, nextId: 4 })
    rows()[0].click(); shiftClick(rows()[1]); shiftClick(rows()[2])
    expect(document.querySelector('#props h2').textContent).toBe('3 selected')
    expect(document.querySelector('#hud').textContent).toMatch(/^3 selected/)
    click('#props [data-act="align"][data-v="left"]')
    expect(saved().frames.map(f => f.x)).toEqual([5, 5, 5])
    click('#props [data-act="align"][data-v="top"]')
    expect(saved().frames.map(f => f.y)).toEqual([10, 10, 10])
    click('#bUndo'); click('#bUndo')
    expect(saved().frames.map(f => f.x)).toEqual([5, 30, 70])
    click('#props [data-act="dist"][data-v="disth"]')
    expect(saved().frames.map(f => f.x)).toEqual([5, 37.5, 70])
    click('#props [data-act="centerSel"]')
    const xs = saved().frames.map(f => f.x)
    expect((xs[0] + xs[2] + 8) / 2).toBe(60)
    click('#props [data-act="delSel"]')
    expect(frames()).toBe(0)
    click('#bUndo'); expect(frames()).toBe(3)
    expect(errors).toEqual([])
  })
  it('disables distribute for two pieces', async () => {
    await boot(null)
    rows()[0].click(); shiftClick(rows()[1])
    expect(document.querySelector('#props [data-act="dist"]').disabled).toBe(true)
  })
  it('uses Ctrl+A, group nudge, group delete and Escape', async () => {
    await boot(null)
    key('a', { ctrlKey: true })
    expect(document.querySelector('#props h2').textContent).toBe('7 selected')
    const lefts = () => [...document.querySelectorAll('.fr')].map(el => parseFloat(el.style.left))
    const before = lefts()
    key('ArrowRight')
    expect(lefts()).toEqual(before.map(x => x + 5))
    key('r')
    expect(saved().frames.map(f => f.w)).toEqual([24, 16, 11, 8, 12, 5, 18])
    key('Escape')
    expect(document.querySelector('#props').hidden).toBe(true)
    key('a', { ctrlKey: true }); key('Delete')
    expect(frames()).toBe(0)
  })
  it('select all skips obstacles and hidden pieces; the locked layout refuses group edits', async () => {
    const fs = [
      { id: 1, name: 'A', w: 8, h: 10, x: 5, y: 5, hue: 0, kind: 'frame' }, { id: 2, name: 'O', w: 8, h: 10, x: 30, y: 5, hue: 0, kind: 'obstacle' },
      { id: 3, name: 'H', w: 8, h: 10, x: 50, y: 5, hue: 0, kind: 'frame', hidden: true }, { id: 4, name: 'B', w: 8, h: 10, x: 70, y: 5, hue: 0, kind: 'frame' },
    ]
    await boot({ frames: fs, nextId: 5 })
    click('#side [data-act="selAll"]')
    expect(document.querySelector('#props h2').textContent).toBe('2 selected')
    click('header [data-act="sheet"]'); click('#bCommit')
    key('Delete')
    expect(frames()).toBe(4)
    expect(toastText()).toMatch(/locked/i)
  })
})

describe('multiple hooks', () => {
  const hkInputs = () => document.querySelectorAll('#props [data-hk]')
  const setHook = (i, k, v) => { const el = document.querySelector(`#props [data-hk="${k}"][data-i="${i}"]`); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })) }
  const fs = () => [{ id: 1, name: 'A', w: 20, h: 10, x: 0, y: 10, hue: 0, kind: 'frame' }]
  it('starts with one default hook and edits two, then resets', async () => {
    await boot({ frames: fs(), nextId: 2 })
    click('#list .li')
    expect(document.querySelectorAll('.fr .hk')).toHaveLength(1)
    expect(hkInputs()).toHaveLength(2)
    click('#props [data-act="hktwo"]')
    expect(saved().frames[0].hooks).toEqual([{ x: 5, y: 2 }, { x: 15, y: 2 }])
    expect(document.querySelectorAll('.fr .hk')).toHaveLength(2)
    setHook(1, 'x', '40')
    expect(saved().frames[0].hooks[1].x).toBe(20)
    setHook(0, 'y', 'abc')
    expect(toastText()).toMatch(/didn't look like a number/)
    click('#props [data-act="hkadd"]')
    expect(saved().frames[0].hooks).toHaveLength(3)
    click('#props [data-act="hkdel"][data-i="0"]')
    expect(saved().frames[0].hooks).toHaveLength(2)
    click('#bUndo'); expect(saved().frames[0].hooks).toHaveLength(3)
    click('#props [data-act="hkreset"]')
    expect(saved().frames[0].hooks).toBeUndefined()
    expect(errors).toEqual([])
  })
  it('lists each hook on the hang sheet and survives share, rotate and duplicate', async () => {
    await boot({ frames: fs(), nextId: 2 })
    click('#list .li'); click('#props [data-act="hktwo"]')
    click('header [data-act="sheet"]')
    expect(document.querySelector('#sheetBody tbody tr').textContent).toContain('5″')
    expect(document.querySelectorAll('#sheetBody tbody tr:first-child td:nth-child(7) b')).toHaveLength(2)
    click('[data-act="closeSheet"]')
    click('#props [data-act="dup"]')
    expect(saved().frames[1].hooks).toEqual([{ x: 5, y: 2 }, { x: 15, y: 2 }])
    expect(saved().frames[1].hooks).not.toBe(saved().frames[0].hooks)
    click('header [data-act="share"]')
    const code = document.querySelector('#codeOut').value
    click('[data-act="clearAll"]'); click('[data-act="clearAll"]')
    document.querySelector('#codeIn').value = code; click('[data-act="importCode"]')
    expect(saved().frames[0].hooks).toEqual([{ x: 5, y: 2 }, { x: 15, y: 2 }])
    click('#list .li'); click('#props [data-act="rotate"]')
    expect(saved().frames[0].hooks).toBeUndefined()
  })
  it('scales hooks when the width changes and offers none for obstacles', async () => {
    await boot({ frames: fs(), nextId: 2 })
    click('#list .li'); click('#props [data-act="hktwo"]')
    const w = document.querySelector('#props [data-k="w"]'); w.value = '40'; w.dispatchEvent(new Event('change', { bubbles: true }))
    expect(saved().frames[0].hooks.map(h => h.x)).toEqual([10, 30])
    const o = document.querySelector('#props [data-k="kind"]'); o.checked = true; o.dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.querySelectorAll('.fr .hk')).toHaveLength(0)
    expect(hkInputs()).toHaveLength(0)
  })
})
