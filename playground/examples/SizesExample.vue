<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@'
import { plans } from './data'

defineProps<{ theme: 'light' | 'dark' | 'auto' }>()

const plan = ref('pro')
</script>

<template>
  <article class="card">
    <h2>Disabled options &amp; sizes</h2>
    <p>Enterprise is disabled; <code>size</code> scales the control.</p>
    <div class="stack">
      <VSelect v-model="plan" :options="plans" size="sm" :theme="theme" placeholder="Plan (sm)" />
      <VSelect v-model="plan" :options="plans" size="md" :theme="theme" placeholder="Plan (md)" />
      <VSelect v-model="plan" :options="plans" size="lg" :theme="theme" placeholder="Plan (lg)" />
    </div>
    <pre>{{ JSON.stringify({ plan }, null, 2) }}</pre>
  </article>
</template>
