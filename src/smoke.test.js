import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'

describe('app boot', () => {
  beforeAll(async () => {
    const html = readFileSync('index.html', 'utf8')
    document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[^>]*><\/script>/, '')
    // Fresh boot calls arrange(), which throws until fix-and-extract-layout-engine lands; boot from saved state.
    const frames = [1, 2, 3, 4, 5, 6, 7].map(id => ({ id, name: 'F' + id, w: 8, h: 10, x: id * 10, y: 10, hue: id * 40, kind: 'frame' }))
    localStorage.setItem('galleryWallPlanner.v1', JSON.stringify({ frames, nextId: 8 }))
    await import('./main.js')
  })
  it('renders the starter frames', () => {
    expect(document.querySelectorAll('.fr').length).toBe(7)
    expect(document.querySelectorAll('#list .li').length).toBe(7)
  })
})
