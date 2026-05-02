# Getting Started

`@anilkumarthakur/select` is a single typed, accessible select that ships
adapters for **Vue 3, React, Svelte 5, Solid, and Web Components** on top
of a framework-agnostic core. The state machine, ARIA semantics, keyboard
map, and CSS are shared — you only pull in the adapter for the framework
you use.

## Install

::: code-group

```bash [npm]
npm i @anilkumarthakur/select
```

```bash [pnpm]
pnpm add @anilkumarthakur/select
```

```bash [yarn]
yarn add @anilkumarthakur/select
```

```bash [bun]
bun add @anilkumarthakur/select
```

:::

The package ships ESM and CJS. Peer dependencies (`vue`, `react` /
`react-dom`, `svelte`, `solid-js`, `nuxt`) are all optional — install only
the ones you actually use. `@floating-ui/vue` is pulled in automatically
and is only loaded by the Vue adapter.

## Pick your adapter

Every adapter lives behind a subpath import so bundlers tree-shake the
others:

| Framework | Import | What you get |
| --- | --- | --- |
| Vue 3 | `@anilkumarthakur/select/vue` | `<VSelect>`, `<VTreeSelect>`, plugin, composables |
| React | `@anilkumarthakur/select/react` | `<Select>` component, `useSelect` hook |
| Svelte 5 | `@anilkumarthakur/select/svelte` | `createSelectAdapter` headless primitive |
| Solid | `@anilkumarthakur/select/solid` | `createSelect` headless primitive |
| Web Component | `@anilkumarthakur/select/web-component` | `<a-select>` custom element |
| _Anything_ | `@anilkumarthakur/select` | `createSelectMachine` + helpers (the core) |

## Use it

::: code-group

```vue [Vue]
<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@anilkumarthakur/select/vue'
import '@anilkumarthakur/select/style.css'

const fruit = ref<string | null>(null)
</script>

<template>
  <VSelect
    v-model="fruit"
    :options="['Apple', 'Banana', 'Cherry']"
    placeholder="Pick a fruit"
  />
</template>
```

```tsx [React]
import { useState } from 'react'
import { Select } from '@anilkumarthakur/select/react'
import '@anilkumarthakur/select/style.css'

export function FruitPicker() {
  const [fruit, setFruit] = useState<string | null>(null)
  return (
    <Select
      modelValue={fruit}
      options={['Apple', 'Banana', 'Cherry']}
      placeholder="Pick a fruit"
      onChange={(v) => setFruit(v as string | null)}
    />
  )
}
```

```svelte [Svelte 5]
<script lang="ts">
  import { createSelectAdapter, toSvelteProps } from '@anilkumarthakur/select/svelte'
  import '@anilkumarthakur/select/style.css'

  let fruit = $state<string | null>(null)
  const adapter = createSelectAdapter({
    options: ['Apple', 'Banana', 'Cherry'],
    modelValue: fruit,
    onChange: (v) => (fruit = v as string | null),
  })

  // Bridge machine notifies → Svelte reactivity (see /guide/frameworks/svelte).
</script>
```

```tsx [Solid]
import { createSelect, toSolidProps } from '@anilkumarthakur/select/solid'
import '@anilkumarthakur/select/style.css'

export function FruitPicker() {
  const select = createSelect({
    options: ['Apple', 'Banana', 'Cherry'],
    onChange: (v) => console.log(v),
  })
  // Render with select.machine.* + toSolidProps — see /guide/frameworks/solid.
  return <div {...toSolidProps(select.machine.getRootProps())} />
}
```

```html [Web Component]
<script type="module">
  import { defineSelectElement } from '@anilkumarthakur/select/web-component'
  import '@anilkumarthakur/select/style.css'

  defineSelectElement('a-select')
  const el = document.querySelector('a-select')
  el.options = ['Apple', 'Banana', 'Cherry']
  el.addEventListener('change', (e) => console.log(e.detail))
</script>

<a-select placeholder="Pick a fruit"></a-select>
```

:::

That's it. For per-framework deep-dives — controlled vs uncontrolled,
slots / render props, the headless reactivity bridge — see the
[Frameworks](./frameworks/vue) section.

## Live result (Vue adapter)

<script setup lang="ts">
import { ref } from 'vue'
const fruit = ref(null)
</script>

<div class="demo" style="max-width: 360px;">
  <VSelect v-model="fruit" :options="['Apple', 'Banana', 'Cherry']" placeholder="Pick a fruit" />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(fruit) }}</code></div>
</div>

## Stylesheet

All adapters share one stylesheet. Pick **one** of the imports below,
once, anywhere in your app entry:

```ts
// Compiled CSS — works in every bundler, every framework.
import '@anilkumarthakur/select/style.css'

// Or compose the SCSS source with your own design tokens:
import '@anilkumarthakur/select/scss'
```

See [Theming](./theming) for the full token surface.

## Next steps

- [Vue 3](./frameworks/vue) — `<VSelect>`, `<VTreeSelect>`, plugin, composables
- [React](./frameworks/react) — `<Select>` component + `useSelect` hook
- [Svelte 5](./frameworks/svelte) — headless adapter + reactivity bridge
- [Solid](./frameworks/solid) — `createSelect` primitive
- [Web Components](./frameworks/web-component) — `<a-select>` custom element
- [Headless Composables](./headless) — build a custom UI on the same core
- [Why this library?](./why) — the design rationale
