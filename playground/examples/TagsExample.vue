<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@'

defineProps<{ theme: 'light' | 'dark' | 'auto' }>()

const tags = ref<string[]>(['vue', 'typescript'])
const tagOptions = ref<string[]>(['vue', 'react', 'svelte', 'typescript', 'rust', 'go'])

function onCreateTag(value: string) {
  if (!tagOptions.value.includes(value)) tagOptions.value.push(value)
  tags.value = [...tags.value, value]
}
</script>

<template>
  <article class="card">
    <h2>Tags — create on the fly</h2>
    <p>Type and press Enter to create new options.</p>
    <VSelect
      v-model="tags"
      mode="tags"
      :options="tagOptions"
      taggable
      :theme="theme"
      placeholder="Add tags"
      @create="onCreateTag"
    />
    <pre>{{ JSON.stringify({ tags }, null, 2) }}</pre>
  </article>
</template>
