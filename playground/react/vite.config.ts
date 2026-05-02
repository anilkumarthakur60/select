import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',

  cacheDir: here('../../node_modules/.vite-react'),

  plugins: [react()],

  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: here('../../src/$1') },
      { find: /^@$/, replacement: here('../../src/index.ts') },
    ],
  },

  server: { port: 5174, host: '127.0.0.1', strictPort: true },
})
