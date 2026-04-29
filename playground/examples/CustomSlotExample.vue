<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@'
import { countries, flagFor, type Country } from './data'

defineProps<{ theme: 'light' | 'dark' | 'auto' }>()

const country = ref<string | null>('fr')
</script>

<template>
  <article class="card">
    <h2>Custom slots — flags &amp; meta</h2>
    <p>Override option and selection rendering for richer UI.</p>
    <VSelect
      v-model="country"
      :options="countries"
      option-value="code"
      option-label="name"
      option-group="region"
      :theme="theme"
      placeholder="Pick a country"
    >
      <template #option="{ option }">
        <span class="flag">{{ flagFor((option.raw as Country).code) }}</span>
        <span class="vselect-option-label">{{ option.label }}</span>
        <span class="vselect-option-hint">{{ (option.raw as Country).region }}</span>
      </template>
      <template #value="{ selected }">
        <span class="vselect-single">
          <span class="flag">{{
            flagFor((selected[0]?.raw as Country | undefined)?.code ?? '')
          }}</span>
          {{ selected[0]?.label }}
        </span>
      </template>
    </VSelect>
    <pre>{{ JSON.stringify({ country }, null, 2) }}</pre>
  </article>
</template>
