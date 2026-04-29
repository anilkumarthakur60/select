import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// Dev server / playground build. Drives `npm run dev` and `npm run build:demo`.
// The library build lives in `vite.config.ts` — kept separate so neither file
// mixes "what we ship" with "how we test what we ship".

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  // Allow deploying the demo under a subpath (e.g. GitHub Pages project page)
  // by setting `BASE_URL=/vue3-select/` at build time.
  base: process.env.BASE_URL ?? '/',

  plugins: [vue(), vueJsx(), vueDevTools()],

  resolve: {
    // Array form is required here because we have two overlapping aliases:
    // bare `@` (the package entry) and `@/foo` (deep paths into src). Vite's
    // object-form alias matches purely by prefix and would let `@` swallow
    // `@/components/...` before the longer alias gets a chance, producing
    // `src/index.ts/components/...` and a "file does not exist" error.
    alias: [
      { find: /^@\/(.*)$/, replacement: here('./src/$1') },
      { find: /^@$/, replacement: here('./src/index.ts') },
    ],
  },

  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: false,
  },
})
