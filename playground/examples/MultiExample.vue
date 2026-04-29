<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@'
import { countries } from './data'

defineProps<{ theme: 'light' | 'dark' | 'auto' }>()

const selectedCountries = ref<string[]>(['us', 'jp'])
</script>

<template>
  <article class="card">
    <h2>Multi — grouped objects</h2>
    <p>Object options with custom value/label/group accessors.</p>
    <VSelect
      v-model="selectedCountries"
      mode="multiple"
      :options="countries"
      option-value="code"
      option-label="name"
      option-group="region"
      :max-visible-tags="3"
      :theme="theme"
      placeholder="Pick countries"
    />
    <pre>{{ JSON.stringify({ selectedCountries }, null, 2) }}</pre>
  </article>
</template>
