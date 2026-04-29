# Nuxt 3 / 4

`@anilkumarthakur/vue3-select` ships a first-class Nuxt module. Add it to
`nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@anilkumarthakur/vue3-select/nuxt'],
})
```

That's the whole setup. `<VSelect>` and `<VTreeSelect>` are auto-imported
as global components and the stylesheet is injected. SSR is supported out
of the box — the menu renders client-side via `<Teleport>` when configured.

## Module options

```ts
export default defineNuxtConfig({
  modules: ['@anilkumarthakur/vue3-select/nuxt'],
  vue3Select: {
    /** Disable to keep tree-shaken named imports only. Default: true */
    components: true,
    /** Prefix the auto-registered tags — e.g. 'My' → <MySelect /> */
    prefix: '',
    /** Auto-import the headless composables too. Default: false */
    composables: false,
    /** Inject '@anilkumarthakur/vue3-select/style.css' into Nuxt's CSS array. Default: true */
    css: true,
  },
})
```

With `composables: true` the following are auto-imported across your app
without an explicit `import`: `useSelection`, `useTreeSelection`,
`useOptionFilter`, `useKeyboardNav`, `useStableId`, `useDebounced`. The
remaining composables (e.g. `useFloatingMenu`, `useFormBinding`) are still
available — just `import` them from `@anilkumarthakur/vue3-select` directly.

## Without the module

Prefer to wire it up by hand? Drop a Nuxt plugin file in `plugins/`:

```ts
// plugins/vue3-select.ts
import { VueSelectPlugin } from '@anilkumarthakur/vue3-select'
import '@anilkumarthakur/vue3-select/style.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueSelectPlugin)
})
```

Or skip the plugin entirely and import per-component as you would in any
Vue 3 app:

```vue
<script setup lang="ts">
import { VSelect } from '@anilkumarthakur/vue3-select'
</script>
```

The CSS still has to be imported once — easiest in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ['@anilkumarthakur/vue3-select/style.css'],
})
```

## SSR notes

- The menu is wrapped in `v-if="isOpen"` so no DOM access happens on the server
- `useFloating` from `@floating-ui/vue` only positions when both refs are mounted, which is post-hydration on the client
- The `id` accessor falls back to a per-instance counter on the server and the same counter on the client, so `aria-controls` / `aria-activedescendant` stay stable across hydration

If you see hydration warnings, the most common cause is dynamic content
inside the `option` slot (e.g. `Date.now()`). Stick to props you can also
serialise.
