# Vue 3

The Vue adapter is the most batteries-included of the bunch — it ships
both `<VSelect>` and `<VTreeSelect>` SFCs, a global plugin, and the full
set of composables that power them.

## Install

```bash
npm i @anil-labs/select-core
```

`vue ^3.3` is a peer dep. `@floating-ui/vue` is pulled in automatically.

## Import

```ts
import { VSelect, VTreeSelect, VueSelectPlugin } from '@anil-labs/select-vue'
import '@anil-labs/select-core/styles.css'
```

## Per-component usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@anil-labs/select-vue'

const fruit = ref<string | null>(null)
</script>

<template>
  <VSelect v-model="fruit" :options="['Apple', 'Banana', 'Cherry']" placeholder="Pick a fruit" />
</template>
```

## Global registration

```ts
// main.ts
import { createApp } from 'vue'
import { VueSelectPlugin } from '@anil-labs/select-vue'
import '@anil-labs/select-core/styles.css'
import App from './App.vue'

createApp(App).use(VueSelectPlugin).mount('#app')
```

`<VSelect>` and `<VTreeSelect>` are then available on every template
without an explicit `import`.

### Plugin options

```ts
app.use(VueSelectPlugin, {
  /** Override the global tag for `<VSelect>` (default: 'VSelect'). */
  name: 'AppSelect',
  /** Override the global tag for `<VTreeSelect>` (default: 'VTreeSelect'). */
  treeName: 'AppTreeSelect',
  /** Skip registering `<VTreeSelect>` to drop it from the runtime cost. */
  registerTree: false,
  /** Also register `VSelectOption` and `VSelectTag` globally. */
  registerInternals: true,
})
```

## Headless composables

Every state machine inside the SFCs is exported individually:

```ts
import {
  useSelection,
  useMenuState,
  useOptionFilter,
  useKeyboardNav,
  useDebounced,
  useTaggable,
  useTriggerInteractions,
  useFloatingMenu,
  useOutsideClick,
  useControlFocus,
  useFormBinding,
  useTreeSelection,
} from '@anil-labs/select-vue'
```

See [Headless Composables](../headless) for end-to-end examples.

## Nuxt

A first-party Nuxt module is shipped as a subpath:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@anil-labs/select-vue/nuxt'],
})
```

See [Nuxt 3 / 4](../nuxt) for module options.

## What's next

- [Single Select](../single-select), [Multi Select](../multi-select), [Tags Mode](../tags)
- [Async Loading](../async), [Grouped Options](../grouped)
- [Tree Select](../tree-select)
- [Slots](../slots), [Theming](../theming)
- [`<VSelect>` API reference](/api/v-select)
