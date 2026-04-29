import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
import vueJsx from '@vitejs/plugin-vue-jsx'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  title: 'vue3-select',
  description: 'A typed, accessible, headless-friendly select for Vue 3.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  // GitHub Pages project-page support: deploys live under /vue3-select/.
  // Override at build time with VITEPRESS_BASE='/' for a custom domain.
  base: process.env.VITEPRESS_BASE ?? '/vue3-select/',

  head: [
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'vue3-select' }],
    [
      'meta',
      {
        name: 'og:description',
        content: 'A typed, accessible, headless-friendly select for Vue 3.',
      },
    ],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API', link: '/api/v-select', activeMatch: '/api/' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/anilkumarthakur60/vue3-select/blob/main/CHANGELOG.md' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@anilkumarthakur/vue3-select' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why vue3-select?', link: '/guide/why' },
          ],
        },
        {
          text: 'Components',
          items: [
            { text: 'Single Select', link: '/guide/single-select' },
            { text: 'Multi Select', link: '/guide/multi-select' },
            { text: 'Tags Mode', link: '/guide/tags' },
            { text: 'Async Loading', link: '/guide/async' },
            { text: 'Grouped Options', link: '/guide/grouped' },
            { text: 'Tree Select', link: '/guide/tree-select' },
          ],
        },
        {
          text: 'Customisation',
          items: [
            { text: 'Theming', link: '/guide/theming' },
            { text: 'Slots', link: '/guide/slots' },
            { text: 'Headless Composables', link: '/guide/headless' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'Nuxt 3 / 4', link: '/guide/nuxt' },
            { text: 'Native Forms', link: '/guide/forms' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'Components',
          items: [
            { text: '<VSelect>', link: '/api/v-select' },
            { text: '<VTreeSelect>', link: '/api/v-tree-select' },
          ],
        },
        {
          text: 'Composables',
          items: [{ text: 'All composables', link: '/api/composables' }],
        },
        {
          text: 'Types',
          items: [{ text: 'Type reference', link: '/api/types' }],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/anilkumarthakur60/vue3-select' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/anilkumarthakur60/vue3-select/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Er. Anil Kumar Thakur',
    },
  },

  // The docs live in the same repo as the library — alias the package name
  // so example code on every page reads exactly like consumer code.
  vite: {
    plugins: [vueJsx()],
    resolve: {
      alias: [
        {
          find: /^@anilkumarthakur\/vue3-select\/style\.css$/,
          replacement: here('../../src/styles/index.scss'),
        },
        {
          find: /^@anilkumarthakur\/vue3-select\/scss\/(.*)$/,
          replacement: here('../../src/styles/$1'),
        },
        {
          find: /^@anilkumarthakur\/vue3-select\/nuxt$/,
          replacement: here('../../src/nuxt.ts'),
        },
        {
          find: /^@anilkumarthakur\/vue3-select$/,
          replacement: here('../../src/index.ts'),
        },
        { find: /^@\/(.*)$/, replacement: here('../../src/$1') },
      ],
    },
  },
})
