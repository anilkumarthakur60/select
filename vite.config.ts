import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// Library-build config — produces what consumers install via npm:
//   ESM (.mjs) for Vite / Webpack / Rollup / Bun / esbuild / modern Node
//   CJS (.cjs) for tools that still resolve `require(...)` (Jest, older Node)
//   .d.ts for full TypeScript intellisense
//
// Multi-framework adapters:
//   /         — root, framework-free core (createSelectMachine + helpers)
//   /vue      — Vue 3 + Nuxt module
//   /react    — React 18+ adapter
//   /svelte   — Svelte 5 adapter
//   /solid    — Solid adapter
//   /web-component — framework-free custom element (covers Angular, Lit, Alpine, vanilla)
//
// Vue and React JSX live side-by-side in the source tree, so the JSX
// transforms are scoped by file pattern: vue-jsx only sees src/vue/*.tsx,
// react only sees src/react/*.tsx. Without the scoping, vue-jsx tries to
// transform React components into Vue createVNode calls and the build dies.

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [
    vue({ include: [/\.vue$/] }),
    vueJsx({ include: /src\/vue\/.*\.tsx?$/ }),
    react({ include: /src\/react\/.*\.tsx$/ }),
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
      entry: {
        index: here('./src/index.ts'),
        vue: here('./src/vue/index.ts'),
        'vue/nuxt': here('./src/vue/nuxt.ts'),
        react: here('./src/react/index.ts'),
        svelte: here('./src/svelte/index.ts'),
        solid: here('./src/solid/index.ts'),
        'web-component': here('./src/web-component/index.ts'),
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
      // Externalise framework peers so consumers' package managers resolve
      // them and bundlers tree-shake the unused adapters.
      external: [
        'vue',
        '@floating-ui/vue',
        '@nuxt/kit',
        '@nuxt/schema',
        'nuxt',
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'svelte',
        'svelte/internal',
        'svelte/internal/client',
        'svelte/internal/disclose-version',
        'solid-js',
        'solid-js/web',
      ],
      output: {
        globals: { vue: 'Vue', '@floating-ui/vue': 'FloatingUIVue', react: 'React', 'react-dom': 'ReactDOM' },
        assetFileNames: (asset) => {
          const name = asset.names?.[0]
          return name === 'style.css' ? 'select.css' : (name ?? 'asset')
        },
        exports: 'named',
      },
    },
  },
})
