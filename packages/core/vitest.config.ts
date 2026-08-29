import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: { '@': resolve(here, 'src') },
  },
  test: {
    include: ['test/**/*.spec.ts', 'test/**/*.spec.tsx'],
    // jsdom, not node: the machine is framework-agnostic but DOM-aware  it
    // builds DOM prop objects and handles KeyboardEvent, which node lacks.
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['test/**', '**/*.d.ts', 'dist/**', 'src/index.ts'],
    },
  },
})
