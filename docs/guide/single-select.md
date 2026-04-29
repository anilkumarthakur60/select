# Single Select

The default mode. Pick one value at a time.

## Primitives

The simplest case: an array of strings or numbers.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const fruit = ref<string | null>(null)
</script>

<template>
  <VSelect v-model="fruit" :options="['Apple', 'Banana', 'Cherry']" />
</template>
```

<script setup lang="ts">
import { ref } from 'vue'

const fruit = ref<string | null>(null)
const country = ref<string>('us')

const countries = [
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
]

const disabledOptions = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise', disabled: true },
]
const plan = ref<string>('free')
</script>

<div class="demo" style="max-width: 360px;">
  <VSelect v-model="fruit" :options="['Apple', 'Banana', 'Cherry']" placeholder="Pick a fruit" />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(fruit) }}</code></div>
</div>

## Object options with accessors

For objects, point at the value / label keys with `option-value` and
`option-label`. They accept either a property name or a function.

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Country { code: string; name: string; flag: string }
const countries: Country[] = [
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
]
const country = ref<string>('us')
</script>

<template>
  <VSelect
    v-model="country"
    :options="countries"
    option-value="code"
    option-label="name"
  />
</template>
```

<div class="demo" style="max-width: 360px;">
  <VSelect
    v-model="country"
    :options="countries"
    option-value="code"
    option-label="name"
  />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(country) }}</code></div>
</div>

## Disabled options

Mark per-option `disabled: true` (or use `optionDisabled` to read it from a
custom property). Disabled options render but skip both keyboard and pointer
selection.

```vue
<VSelect
  v-model="plan"
  :options="[
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise', disabled: true },
  ]"
/>
```

<div class="demo" style="max-width: 360px;">
  <VSelect
    v-model="plan"
    :options="disabledOptions"
  />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(plan) }}</code></div>
</div>

## Disabling the whole control

```vue
<VSelect v-model="x" :options="..." disabled />
```

## Sizes

Three baked-in sizes. Override the underlying tokens for finer control.

<div class="demo" style="display: grid; gap: 12px; max-width: 360px;">
  <VSelect size="sm" :options="['Small', 'Medium', 'Large']" placeholder="Small" />
  <VSelect size="md" :options="['Small', 'Medium', 'Large']" placeholder="Medium" />
  <VSelect size="lg" :options="['Small', 'Medium', 'Large']" placeholder="Large" />
</div>

```vue
<VSelect size="sm" :options="..." />
<VSelect size="md" :options="..." />  <!-- default -->
<VSelect size="lg" :options="..." />
```
