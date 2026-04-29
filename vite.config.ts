import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'

// Library-build config — produces what consumers install via npm:
//   ESM (.mjs) for Vite / Webpack / Rollup / Bun / esbuild / modern Node
//   CJS (.cjs) for tools that still resolve `require(...)` (Jest, older Node)
//   .d.ts for full TypeScript intellisense
//
// We intentionally do not ship a UMD/IIFE bundle — every modern consumer
// resolves through a bundler, and the CDN drop-in path adds maintenance
// without paying for itself for an internally-consumed library.
//
// The dev server / playground lives in `vite.config.dev.ts` so this file
// stays focused on what actually ships to consumers.

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['playground/**/*', 'tests/**/*'],
      outDir: 'dist',
      entryRoot: 'src',
      tsconfigPath: './tsconfig.lib.json',
    }),
  ],

  resolve: {
    alias: { '@/': here('./src/') },
  },

  // The lib build must not copy `public/` into `dist/` — that's the dev
  // server's favicon, and it would otherwise ship inside the tarball.
  publicDir: false,

  build: {
    lib: {
      // Two entries: the main library and a Nuxt module. The Nuxt module is
      // built as its own chunk so consumers can register it via
      // `modules: ['vue3-select/nuxt']` without pulling Nuxt into the main
      // bundle.
      entry: {
        'vue3-select': here('./src/index.ts'),
        nuxt: here('./src/nuxt.ts'),
      },
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },

    // Sourcemaps help downstream consumers debug into the published code.
    sourcemap: true,
    cssCodeSplit: false,

    // Always start from a clean slate so renamed/removed files never linger
    // in dist between builds (relied on by `npm pack` and the publish flow).
    emptyOutDir: true,

    rollupOptions: {
      // Externalise the Vue peer, the floating-ui dep, and the Nuxt-only
      // build deps so consumers' package managers resolve them — never
      // inline a peer, and never bundle Nuxt internals into the library.
      external: ['vue', '@floating-ui/vue', '@nuxt/kit', '@nuxt/schema', 'nuxt'],
      output: {
        globals: { vue: 'Vue', '@floating-ui/vue': 'FloatingUIVue' },
        assetFileNames: (asset) => {
          const name = asset.names?.[0]
          return name === 'style.css' ? 'vue3-select.css' : (name ?? 'asset')
        },
        exports: 'named',
      },
    },
  },
})
