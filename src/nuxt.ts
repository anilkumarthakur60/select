import { addComponent, addImportsSources, defineNuxtModule } from '@nuxt/kit'

export interface ModuleOptions {
  /**
   * Auto-register `<VSelect>`, `<VTreeSelect>`, and the supporting subcomponents
   * as Nuxt components. With this on, templates can use the tags directly
   * without an explicit `import`. Default: `true`.
   */
  components?: boolean
  /**
   * Optional prefix applied to the auto-registered component names — useful
   * for projects that already have a `<VSelect>` component. With `prefix: 'My'`
   * the components become `<MySelect>`, `<MyTreeSelect>`, etc.
   * Default: no prefix.
   */
  prefix?: string
  /**
   * Auto-import the headless composables (`useSelection`, `useTreeSelection`,
   * `useOptionFilter`, `useKeyboardNav`, `useStableId`, `useDebounced`).
   * Default: `false` — opt in if you build custom UI on top of the primitives.
   */
  composables?: boolean
  /**
   * Inject the prebuilt stylesheet into Nuxt's `css` array. Disable if you
   * import the SCSS source manually for token-level theming.
   * Default: `true`.
   */
  css?: boolean
}

// Resolved against the consumer's node_modules — must match the published
// package name in package.json so Nuxt's bundler can find the entry.
const PKG = '@anilkumarthakur/vue3-select'
const PKG_STYLE = `${PKG}/style.css`

const COMPONENT_NAMES = [
  'VSelect',
  'VSelectOption',
  'VSelectTag',
  'VTreeSelect',
  'VTreeSelectNode',
] as const

const COMPOSABLE_NAMES = [
  'useSelection',
  'useTreeSelection',
  'useOptionFilter',
  'useKeyboardNav',
  'useStableId',
  'useDebounced',
] as const

/**
 * Nuxt 3 / 4 module — opt-in via `nuxt.config.ts`:
 *
 *     export default defineNuxtConfig({
 *       modules: ['@anilkumarthakur/vue3-select/nuxt'],
 *     })
 *
 * Or with options under the `vue3Select` key:
 *
 *     export default defineNuxtConfig({
 *       modules: ['@anilkumarthakur/vue3-select/nuxt'],
 *       vue3Select: { prefix: 'My', composables: true },
 *     })
 */
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@anilkumarthakur/vue3-select',
    configKey: 'vue3Select',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0',
    },
  },
  defaults: {
    components: true,
    prefix: '',
    composables: false,
    css: true,
  },
  setup(options, nuxt) {
    if (options.css) {
      nuxt.options.css ||= []
      if (!nuxt.options.css.includes(PKG_STYLE)) {
        nuxt.options.css.push(PKG_STYLE)
      }
    }

    if (options.components) {
      const prefix = options.prefix ?? ''
      for (const name of COMPONENT_NAMES) {
        addComponent({
          name: prefix ? `${prefix}${name.slice(1)}` : name,
          export: name,
          filePath: PKG,
        })
      }
    }

    if (options.composables) {
      addImportsSources({
        from: PKG,
        imports: [...COMPOSABLE_NAMES],
      })
    }
  },
})
