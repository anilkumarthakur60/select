# Getting Started

`@anil-labs/select-core` is a single typed, accessible select that ships
adapters for **Vue 3, React, Svelte 5, Solid, and Web Components** on top
of a framework-agnostic core. The state machine, ARIA semantics, keyboard
map, and CSS are shared — you only pull in the adapter for the framework
you use.

## Install

::: code-group

```bash [npm]
npm i @anil-labs/select-core
```

```bash [pnpm]
pnpm add @anil-labs/select-core
```

```bash [yarn]
yarn add @anil-labs/select-core
```

```bash [bun]
bun add @anil-labs/select-core
```

:::

Every package ships ESM and CJS. Each adapter declares only the peer it
actually imports — `vue`, `react`, `svelte`, `solid-js` — so you install just
the framework you use. Beyond `@anil-labs/select-core`, no adapter has any
runtime dependency.

## Pick your adapter

Every adapter lives behind a subpath import so bundlers tree-shake the
others:

| Framework     | Import                      | What you get                                      |
| ------------- | --------------------------- | ------------------------------------------------- |
| Vue 3         | `@anil-labs/select-vue`     | `<VSelect>`, `<VTreeSelect>`, plugin, composables |
| React         | `@anil-labs/select-react`   | `<Select>` component, `useSelect` hook            |
| Svelte 5      | `@anil-labs/select-svelte`  | `createSelectAdapter` headless primitive          |
| Solid         | `@anil-labs/select-solid`   | `createSelect` headless primitive                 |
| Web Component | `@anil-labs/select-element` | `<a-select>` custom element                       |
| _Anything_    | `@anil-labs/select-core`    | `createSelectMachine` + helpers (the core)        |

## Use it

::: code-group

```vue [Vue]
<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@anil-labs/select-vue'
import '@anil-labs/select-core/styles.css'

const fruit = ref<string | null>(null)
</script>

<template>
  <VSelect v-model="fruit" :options="['Apple', 'Banana', 'Cherry']" placeholder="Pick a fruit" />
</template>
```

```tsx [React]
import { useState } from 'react'
import { Select } from '@anil-labs/select-react'
import '@anil-labs/select-core/styles.css'

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
  import { createSelectAdapter, toSvelteProps } from '@anil-labs/select-svelte'
  import '@anil-labs/select-core/styles.css'

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
import { createSelect, toSolidProps } from '@anil-labs/select-solid'
import '@anil-labs/select-core/styles.css'

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
  import { defineSelectElement } from '@anil-labs/select-element'
  import '@anil-labs/select-core/styles.css'

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
import '@anil-labs/select-core/styles.css'

// Or compose the SCSS source with your own design tokens:
import '@anil-labs/select-core/scss'
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
