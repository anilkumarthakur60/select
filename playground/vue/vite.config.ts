import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',

  plugins: [vue(), vueJsx(), vueDevTools()],

  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: here('../../src/$1') },
      { find: /^@$/, replacement: here('../../src/index.ts') },
    ],
  },

  server: { port: 5173, host: '127.0.0.1', strictPort: false },
})
