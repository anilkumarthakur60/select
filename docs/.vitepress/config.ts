import { defineConfig } from 'vitepress'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  title: '@anil-labs/select-core',
  description:
    'A typed, accessible, headless-friendly select for Vue, React, Svelte, Solid, and Web Components  one core, idiomatic adapters.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  // GitHub Pages project-page support: deploys live under /select/.
  // Override at build time with VITEPRESS_BASE='/' for a custom domain.
  base: process.env.VITEPRESS_BASE ?? '/select/',

  head: [
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: '@anil-labs/select-core' }],
    [
      'meta',
      {
        name: 'og:description',
        content:
          'A typed, accessible select for Vue, React, Svelte, Solid, and Web Components  framework-agnostic core, framework-idiomatic adapters.',
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
          {
            text: 'Changelog',
            link: 'https://github.com/anilkumarthakur60/select/blob/main/CHANGELOG.md',
          },
          { text: 'npm', link: 'https://www.npmjs.com/package/@anil-labs/select-core' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why this library?', link: '/guide/why' },
          ],
        },
        {
          text: 'Frameworks',
          items: [
            { text: 'Vue 3', link: '/guide/frameworks/vue' },
            { text: 'React', link: '/guide/frameworks/react' },
            { text: 'Svelte 5', link: '/guide/frameworks/svelte' },
            { text: 'Solid', link: '/guide/frameworks/solid' },
            { text: 'Web Components', link: '/guide/frameworks/web-component' },
          ],
        },
        {
          text: 'Components (Vue)',
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

    socialLinks: [{ icon: 'github', link: 'https://github.com/anilkumarthakur60/select' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/anilkumarthakur60/select/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Er. Anil Kumar Thakur',
    },
  },

  // Docs consume the real workspace packages, so every example on every page
  // is exactly the code a consumer writes  and the docs build fails if a
  // package's published entry points break.
  vite: {
    plugins: [vueJsx()],
  },
})
