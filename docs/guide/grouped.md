# Grouped Options

Render options under headings by pointing `option-group` at the field that
holds the group key.

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Country { code: string; name: string; region: string }

const countries: Country[] = [
  { code: 'us', name: 'United States', region: 'Americas' },
  { code: 'br', name: 'Brazil', region: 'Americas' },
  { code: 'fr', name: 'France', region: 'Europe' },
  { code: 'de', name: 'Germany', region: 'Europe' },
  { code: 'jp', name: 'Japan', region: 'Asia' },
  { code: 'in', name: 'India', region: 'Asia' },
]
const selected = ref<string | null>(null)
</script>

<template>
  <VSelect
    v-model="selected"
    :options="countries"
    option-value="code"
    option-label="name"
    option-group="region"
  />
</template>
```

<script setup lang="ts">
import { ref } from 'vue'

const countries = [
  { code: 'us', name: 'United States', region: 'Americas' },
  { code: 'br', name: 'Brazil', region: 'Americas' },
  { code: 'ca', name: 'Canada', region: 'Americas' },
  { code: 'fr', name: 'France', region: 'Europe' },
  { code: 'de', name: 'Germany', region: 'Europe' },
  { code: 'es', name: 'Spain', region: 'Europe' },
  { code: 'jp', name: 'Japan', region: 'Asia' },
  { code: 'in', name: 'India', region: 'Asia' },
  { code: 'sg', name: 'Singapore', region: 'Asia' },
]
const country = ref<string | null>(null)
</script>

<div class="demo" style="max-width: 360px;">
  <VSelect
    v-model="country"
    :options="countries"
    option-value="code"
    option-label="name"
    option-group="region"
    placeholder="Pick a country"
  />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(country) }}</code></div>
</div>

## How grouping works

- `option-group` is read **per option**, not as a top-level structure
- Adjacent options with the same group key collapse into one heading
- Options without a group render under no heading — mix freely
- Search filters individual options; group headings disappear if their last child does

## Customising the heading

Replace the default heading with the `optiongroup` slot:

```vue
<VSelect ... option-group="region">
  <template #optiongroup="{ group }">
    <span class="my-group-heading">📍 {{ group }}</span>
  </template>
</VSelect>
```
