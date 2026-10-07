import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    // Remove once the first module extraction lands tests (see openspec/changes).
    passWithNoTests: true,
  },
})
