import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

const here = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: { '@': resolve(here, 'src') },
  },
  test: {
    include: ['test/**/*.spec.ts', 'test/**/*.spec.tsx'],
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
