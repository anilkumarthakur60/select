import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// Vue and React JSX share the same source tree, so the JSX transforms are
// scoped by file pattern: vue-jsx only sees src/vue/*.tsx, react only sees
// src/react/*.tsx. Without the scoping, vue-jsx tries to transform React
// components into Vue createVNode calls and the build dies.

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

  // The lib build must not copy `public/` into `dist/`.
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
    },
    sourcemap: true,
    cssCodeSplit: false,
    emptyOutDir: true,

    rollupOptions: {
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
        globals: {
          vue: 'Vue',
          '@floating-ui/vue': 'FloatingUIVue',
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
