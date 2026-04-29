<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@'
import { fruits } from './data'

defineProps<{ theme: 'light' | 'dark' | 'auto' }>()

const fruit = ref<string | null>(null)
</script>

<template>
  <article class="card">
    <h2>Single — primitives</h2>
    <p>Pass an array of strings; v-model binds the chosen value.</p>
    <VSelect v-model="fruit" :options="fruits" :theme="theme" placeholder="Pick a fruit" />
    <pre>{{ JSON.stringify({ fruit }, null, 2) }}</pre>
  </article>
</template>
