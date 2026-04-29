# Tags Mode

Tags mode is multi-select with create-on-the-fly. Type something the option
list doesn't contain, press <kbd>Enter</kbd>, and a `create` event fires —
you decide whether to push it into the source list.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const known = ref<string[]>(['Vue', 'React'])
const tags = ref<string[]>([])

function onCreate(value: string) {
  if (!known.value.includes(value)) known.value.push(value)
  tags.value = [...tags.value, value]
}
</script>

<template>
  <VSelect
    v-model="tags"
    mode="tags"
    :options="known"
    taggable
    @create="onCreate"
  />
</template>
```

<script setup lang="ts">
import { ref } from 'vue'

const known = ref(['Vue', 'React', 'Svelte'])
const tags = ref([])

function onCreate(value) {
  if (!known.value.includes(value)) known.value.push(value)
  tags.value = [...tags.value, value]
}
</script>

<div class="demo" style="max-width: 480px;">
  <VSelect
    v-model="tags"
    mode="tags"
    :options="known"
    taggable
    placeholder="Type a framework, press Enter"
    @create="onCreate"
  />
  <div class="demo-meta">
    <div>Selected: <code>{{ JSON.stringify(tags) }}</code></div>
    <div>Known: <code>{{ JSON.stringify(known) }}</code></div>
  </div>
</div>

## How it works

- The "Create &lt;query&gt;" row appears when the search query has no match in `options`
- <kbd>Enter</kbd> on a highlighted option picks it; <kbd>Enter</kbd> with no highlight (and `taggable`) fires `@create`
- The host owns the source list — you typically push the new value into `options` so future searches find it
- The component **doesn't auto-select** the created value; bind `@create` and call `tags.value.push(value)` (or use the model directly) for that behaviour

## Customising the create row

Replace the default row with the `create` slot. You get the trimmed query
string and a `create` callback:

```vue
<VSelect v-model="tags" mode="tags" :options="known" taggable @create="onCreate">
  <template #create="{ query, create }">
    <button class="my-create-row" @mousedown.prevent="create">
      Add <strong>"{{ query }}"</strong> as a new tag
    </button>
  </template>
</VSelect>
```
