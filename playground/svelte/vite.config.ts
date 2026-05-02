import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',

  plugins: [svelte()],

  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: here('../../src/$1') },
      { find: /^@$/, replacement: here('../../src/index.ts') },
    ],
  },

  server: { port: 5175, host: '127.0.0.1', strictPort: false },
})
