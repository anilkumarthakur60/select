# @anil-labs/select-vue

Vue 3 components for [`@anil-labs/select`](https://github.com/anilkumarthakur60/select):
single, multiple, tags, async, grouped and tree select, driven by the shared
[`@anil-labs/select-core`](https://github.com/anilkumarthakur60/select/tree/main/packages/core)
state machine.

## Install

```sh
npm install @anil-labs/select-vue @anil-labs/select-core
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@anil-labs/select-vue'
import '@anil-labs/select-core/styles.css'

const value = ref<string | null>(null)
const options = ['apple', 'banana', 'cherry']
</script>

<template>
  <VSelect v-model="value" :options="options" placeholder="Pick a fruit" />
</template>
```

The stylesheet lives in `@anil-labs/select-core` so every adapter shares one
copy — importing it from this package will not work.

### Modes

```vue
<VSelect v-model="many" :options="options" mode="multiple" />
<VSelect v-model="tags" :options="options" mode="tags" />
<VTreeSelect v-model="node" :options="tree" />
```

### Object options

```vue
<VSelect v-model="userId" :options="users" option-label="name" option-value="id" />
```

## Nuxt

An opt-in module registers every component and composable globally:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@anil-labs/select-vue/nuxt'],
})
```

## Exports

Components `VSelect`, `VTreeSelect`, `VSelectOption`, `VSelectTag`,
`VTreeSelectNode`; the `VueSelectPlugin` for global registration; the
composables the components are built from; and a re-export of the core machine
and its types.

## Documentation

Full API reference and guides: <https://github.com/anilkumarthakur60/select>

## License

MIT © [Er. Anil Kumar Thakur](https://github.com/anilkumarthakur60)
