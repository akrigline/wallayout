import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

async function boot(saved) {
  vi.resetModules()
  localStorage.clear()
  if (saved) localStorage.setItem('galleryWallPlanner.v1', JSON.stringify(saved))
  const html = readFileSync('index.html', 'utf8')
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[^>]*><\/script>/, '')
  await import('./main.js')
}

describe('app boot', () => {
  it('renders saved frames', async () => {
    const frames = [1, 2, 3].map(id => ({ id, name: 'F' + id, w: 8, h: 10, x: id * 10, y: 10, hue: id * 40, kind: 'frame' }))
    await boot({ frames, nextId: 4 })
    expect(document.querySelectorAll('.fr').length).toBe(3)
    expect(document.querySelectorAll('#list .li').length).toBe(3)
  })
  it('renders the starter plan on a fresh visit', async () => {
    await boot(null)
    expect(document.querySelectorAll('.fr').length).toBe(7)
  })
})
