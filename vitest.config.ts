import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import react from '@vitejs/plugin-react'

// Vitest must transform each adapter's JSX with the right runtime.
// vue-jsx default-includes every .tsx, so we scope it explicitly to
// Vue source + Vue spec files; React handles its own files; the rest
// (Svelte/Solid/WC tests are plain .ts) need no transform plugin.
export default defineConfig({
  plugins: [
    vue({ include: [/\.vue$/] }),
    vueJsx({ include: /src\/vue\/.*\.tsx?$/ }),
    react({ include: [/src\/react\/.*\.tsx$/, /tests\/.*react.*\.spec\.tsx$/] }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.{ts,tsx}'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/index.ts', 'src/**/icons/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
