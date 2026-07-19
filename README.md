# @anil-labs/select

A typed, accessible select/combobox for **Vue, React, Svelte, Solid, and Web
Components**. Single, multi, tags, async, grouped, tree — one framework-agnostic
core, framework-idiomatic adapters.

[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![types](https://img.shields.io/badge/types-included-3178c6)](#)

- ✅ One state machine drives every adapter — same behaviour, semantics and tests
- ✅ Single, multiple, and tags modes (with create-on-Enter)
- ✅ Tree variant `<VTreeSelect>` with tri-state parents, search, "select all"
- ✅ Searchable with custom filter functions, debouncing, async loading
- ✅ Grouped options
- ✅ Floating-UI menu positioning + Teleport support
- ✅ ARIA-1.2 combobox + listbox / treeitem semantics, full keyboard nav
- ✅ Themeable via CSS custom properties (light / dark / preset accents)
- ✅ Native `<form>` integration via `name` prop
- ✅ Tree-shakeable named exports + headless composables

---

## Packages

Install the adapter for your framework — it pulls the core in for you.

| Package                                         | For                                           | Notes                                     |
| ----------------------------------------------- | --------------------------------------------- | ----------------------------------------- |
| [`@anil-labs/select-core`](packages/core)       | any                                           | Headless machine + the shared stylesheet  |
| [`@anil-labs/select-vue`](packages/vue)         | Vue 3 / Nuxt                                  | `<VSelect>`, `<VTreeSelect>`, composables |
| [`@anil-labs/select-react`](packages/react)     | React 18/19                                   | `<Select>`, `useSelect`                   |
| [`@anil-labs/select-svelte`](packages/svelte)   | Svelte 5                                      | Headless store wrapper                    |
| [`@anil-labs/select-solid`](packages/solid)     | Solid                                         | Headless signal primitive                 |
| [`@anil-labs/select-element`](packages/element) | Angular, Lit, Alpine, Astro, Qwik, plain HTML | `<a-select>` custom element               |

```bash
npm i @anil-labs/select-vue      # or -react / -svelte / -solid / -element
```

Tree-select is Vue-only; the Svelte and Solid adapters are deliberately headless
(they ship a reactive wrapper rather than a precompiled component, so no
framework version is pinned into the tarball).

Styles live in the core package and are shared by every adapter:

```ts
import '@anil-labs/select-core/styles.css' // compiled
```

```scss
@use '@anil-labs/select-core/scss' as select; // source, to compose with your tokens
```

## Quick start

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

import '@anil-labs/select-core/styles.css'

createApp(App).mount('#app')
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@anil-labs/select-vue'

const fruit = ref<string | null>(null)
const fruits = ['Apple', 'Banana', 'Cherry']
</script>

<template>
  <VSelect v-model="fruit" :options="fruits" placeholder="Pick a fruit" />
</template>
```

## Examples

### Object options with custom accessors

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@anil-labs/select-vue'

interface Country {
  code: string
  name: string
  region: string
}
const countries: Country[] = [
  /* … */
]
const selected = ref<string[]>([])
</script>

<template>
  <VSelect
    v-model="selected"
    mode="multiple"
    :options="countries"
    option-value="code"
    option-label="name"
    option-group="region"
    :max-visible-tags="3"
  />
</template>
```

### Async loading

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@anil-labs/select-vue'

const results = ref([])
const loading = ref(false)

async function onSearch(q: string) {
  if (!q) return (results.value = [])
  loading.value = true
  results.value = await fetch(`/api/users?q=${q}`).then((r) => r.json())
  loading.value = false
}
</script>

<template>
  <VSelect
    :options="results"
    :loading="loading"
    option-value="id"
    option-label="name"
    placeholder="Search users…"
    @search="onSearch"
  />
</template>
```

### Tags / create-on-the-fly

```vue
<VSelect
  v-model="tags"
  mode="tags"
  :options="known"
  taggable
  @create="(value) => known.push(value)"
/>
```

### Custom rendering via slots

```vue
<VSelect v-model="country" :options="countries" option-value="code" option-label="name">
  <template #option="{ option }">
    <span class="flag">{{ flagFor(option.raw.code) }}</span>
    <span>{{ option.label }}</span>
  </template>
</VSelect>
```

### Tree select

`<VTreeSelect>` mirrors the API surface of `<VSelect>` but renders a
hierarchy with tri-state parents. Only **leaf** values flow through v-model —
parent state is always derived, so you never have to reconcile it manually.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VTreeSelect } from '@anil-labs/select-vue'

interface Cat {
  id: number
  name: string
  children: Cat[]
}
const categories: Cat[] = [
  {
    id: 1,
    name: 'Web',
    children: [
      { id: 2, name: 'CSS', children: [] },
      { id: 3, name: 'JS', children: [] },
    ],
  },
  { id: 9, name: 'DevOps', children: [{ id: 10, name: 'Docker', children: [] }] },
]
const picked = ref<number[]>([])
</script>

<template>
  <VTreeSelect
    v-model="picked"
    :options="categories"
    option-value="id"
    option-label="name"
    default-expand-all
  />
</template>
```

### Headless usage

Every primitive that powers `<VSelect>` and `<VTreeSelect>` is exported
individually so you can rebuild the UI surface without the bundled chrome:

```ts
// Vue composables ship with the Vue adapter…
import {
  // Selection state machines
  useSelection,
  useTreeSelection,
  // Option list pipeline
  useOptionFilter,
  useDebounced,
  // Combobox plumbing — same primitives the SFCs use
  useKeyboardNav,
  useFloatingMenu,
  useOutsideClick,
  useControlFocus,
  useStableId,
} from '@anil-labs/select-vue'

// …and the framework-free helpers come from the core package.
import { normalize, normalizeTree } from '@anil-labs/select-core'
```

## Nuxt 3 / 4

`@anil-labs/select-vue` ships a first-class Nuxt module. Add it to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@anil-labs/select-vue/nuxt'],
})
```

That's it — `<VSelect>` and `<VTreeSelect>` are auto-imported as global
components and the stylesheet is injected. SSR is supported out of the box;
the menu mounts to the DOM client-side via `<Teleport>` when configured.

Module options live under `vue3Select`:

```ts
export default defineNuxtConfig({
  modules: ['@anil-labs/select-vue/nuxt'],
  vue3Select: {
    /** Disable to keep tree-shaken named imports only. Default: true */
    components: true,
    /** Prefix the auto-registered tags — e.g. 'My' → <MySelect /> */
    prefix: '',
    /** Auto-import the headless composables too. Default: false */
    composables: false,
    /** Inject '@anil-labs/select-core/styles.css' into Nuxt's CSS array. Default: true */
    css: true,
  },
})
```

If you'd rather skip the module and wire it up by hand, drop a Nuxt plugin
file in `plugins/`:

```ts
// plugins/vue3-select.ts
import { VueSelectPlugin } from '@anil-labs/select-vue'
import '@anil-labs/select-core/styles.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueSelectPlugin)
})
```

## API

### Props

| Prop             | Type                               | Default                   | Description                          |
| ---------------- | ---------------------------------- | ------------------------- | ------------------------------------ |
| `modelValue`     | `unknown \| unknown[]`             | —                         | v-model — single value or array      |
| `options`        | `T[]`                              | `[]`                      | Source list of options               |
| `mode`           | `'single' \| 'multiple' \| 'tags'` | `'single'`                | Selection mode                       |
| `optionValue`    | `keyof T \| (o: T) => unknown`     | `'value'`                 | Value accessor                       |
| `optionLabel`    | `keyof T \| (o: T) => string`      | `'label'`                 | Label accessor                       |
| `optionGroup`    | `keyof T \| (o: T) => string`      | —                         | Group key accessor                   |
| `optionDisabled` | `keyof T \| (o: T) => boolean`     | `'disabled'`              | Disabled flag                        |
| `placeholder`    | `string`                           | `'Select…'`               | Placeholder text                     |
| `searchable`     | `boolean`                          | `true`                    | Show search input                    |
| `clearable`      | `boolean`                          | `true`                    | Show clear button                    |
| `disabled`       | `boolean`                          | `false`                   | Disable the control                  |
| `loading`        | `boolean`                          | `false`                   | Show loading spinner                 |
| `closeOnSelect`  | `boolean`                          | `mode === 'single'`       | Close menu after a pick              |
| `taggable`       | `boolean`                          | `false`                   | Allow creating new options           |
| `maxVisibleTags` | `number`                           | —                         | Collapse to "+N" beyond this count   |
| `maxSelections`  | `number`                           | —                         | Hard cap on multi-select             |
| `filter`         | `FilterFn<T>`                      | substring                 | Custom filter function               |
| `caseSensitive`  | `boolean`                          | `false`                   | Case-sensitive matching              |
| `emptyText`      | `string`                           | `'No options'`            | Menu text when there are no options  |
| `noResultsText`  | `string`                           | falls back to `emptyText` | Menu text when search yields nothing |
| `loadingText`    | `string`                           | `'Loading…'`              | Menu text while loading              |
| `size`           | `'sm' \| 'md' \| 'lg'`             | `'md'`                    | Control size                         |
| `theme`          | `'light' \| 'dark' \| 'auto'`      | `'light'`                 | Theme                                |
| `teleportTo`     | `string \| HTMLElement \| false`   | `false`                   | Teleport menu target                 |
| `name`           | `string`                           | —                         | Hidden input name for native forms   |
| `required`       | `boolean`                          | `false`                   | Native form required marker          |
| `id`             | `string`                           | auto                      | Override generated id                |

### Events

| Event                               | Payload               |
| ----------------------------------- | --------------------- |
| `update:modelValue`                 | `unknown`             |
| `update:search`                     | `string`              |
| `search`                            | `string`              |
| `select`                            | `NormalizedOption<T>` |
| `deselect`                          | `NormalizedOption<T>` |
| `create`                            | `string`              |
| `open` / `close` / `focus` / `blur` | —                     |

### Slots

| Slot           | Props                                           | Replaces                                      |
| -------------- | ----------------------------------------------- | --------------------------------------------- |
| `prefix`       | —                                               | The leading edge of the control               |
| `suffix`       | —                                               | The trailing edge of the control              |
| `value`        | `{ selected, isMulti }`                         | The full value display area                   |
| `tag`          | `{ option, remove, disabled }`                  | A single tag in multi mode                    |
| `option`       | `{ option, selected, active, disabled }`        | One row in the menu                           |
| `optiongroup`  | `{ group }`                                     | A group heading row                           |
| `empty`        | `{ query, mode: 'no-options' \| 'no-results' }` | Empty-state contents                          |
| `loader`       | `{ inMenu }`                                    | The loading indicator                         |
| `dropdownicon` | `{ open }`                                      | The chevron icon                              |
| `clearicon`    | `{ clear }`                                     | The clear button                              |
| `create`       | `{ query, create }`                             | The "Create '<query>'" row in `taggable` mode |

### Exposed instance methods

```ts
const sel = ref<VSelectInstance>()
sel.value?.open() // close, toggle, focus, blur, clear, flushSearch, isOpen
```

### `<VTreeSelect>` props (additions)

| Prop               | Type                       | Default      | Description                              |
| ------------------ | -------------------------- | ------------ | ---------------------------------------- |
| `optionChildren`   | `keyof T \| (o: T) => T[]` | `'children'` | Children-array accessor                  |
| `defaultExpandAll` | `boolean`                  | `false`      | Expand every parent on first render      |
| `showToolbar`      | `boolean`                  | `true`       | Show "select all" / "clear" actions      |
| `closeOnSelect`    | `boolean`                  | `false`      | Close after every toggle (rarely useful) |

`<VTreeSelect>` shares `placeholder`, `searchable`, `clearable`, `disabled`,
`maxSelections`, `maxVisibleTags`, `debounce`, `emptyText`, `noResultsText`,
`size`, `theme`, `ariaLabel`, `teleportTo`, and `id` with `<VSelect>`. It
emits `update:modelValue`, `update:search`, `select`, `deselect`, `expand`,
`collapse`, `search`, `open`, and `close`.

## Theming

All colors, spacing, and motion live as CSS custom properties scoped to `.vselect`,
so you can override at any level without recompiling SCSS:

```css
.my-form .vselect {
  --vselect-accent: #ec4899;
  --vselect-radius: 12px;
  --vselect-border-focus: #ec4899;
}
```

The default stylesheet is wrapped in `@layer vselect`, so consumer rules
written outside any layer always win without specificity hacks.

Built-in dark mode:

```vue
<VSelect theme="dark" />
<VSelect theme="auto" />
<!-- follows prefers-color-scheme -->
```

Accent presets ship as separate SCSS files:

```scss
@use '@anil-labs/select-core/scss/themes/emerald';
@use '@anil-labs/select-core/scss/themes/rose';
```

```vue
<VSelect class="vselect--emerald" />
```

## Accessibility

- Implements WAI-ARIA 1.2 combobox + listbox patterns
- `aria-activedescendant` updates as the user navigates
- Full keyboard support: ↑/↓, Home, End, Enter, Esc, Tab, Backspace
- Focus management is preserved across menu open/close and tag removal
- Honors `prefers-reduced-motion`

## Browser support

Modern evergreen browsers. ES2020 baseline. SSR friendly (no DOM access at module load).

## Development

```bash
npm install
npm run dev          # playground at http://localhost:5173
npm run dev -- --host 0.0.0.0 --port 5173
npm run test         # vitest
npm run build        # type-check + lib build → dist/
npm run build:demo   # static playground build
```

## License

[MIT](./LICENSE) © Er. Anil Kumar Thakur
