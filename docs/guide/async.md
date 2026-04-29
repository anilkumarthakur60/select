# Async Loading

`<VSelect>` was designed for remote-source pickers. The `@search` event
emits the (debounced) query, `:loading` flips the spinner, and `:options`
takes the result list — no extra wiring.

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface User { id: string; name: string; email: string }

const results = ref<User[]>([])
const loading = ref(false)
const selected = ref<string | null>(null)

async function onSearch(query: string) {
  if (!query) {
    results.value = []
    return
  }
  loading.value = true
  try {
    results.value = await fetch(`/api/users?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VSelect
    v-model="selected"
    :options="results"
    :loading="loading"
    option-value="id"
    option-label="name"
    placeholder="Search users…"
    :debounce="200"
    @search="onSearch"
  />
</template>
```

## Debounce

`:debounce="200"` waits 200 ms after the last keystroke before firing
`@search` and recomputing the local filter. The visible input value updates
immediately so typing still feels instant.

Set `0` or `undefined` to disable.

## Demo

The demo below uses a fake API that returns matching cities after a 400 ms
delay. Try typing "tok", "par", or "lon".

<script setup lang="ts">
import { ref } from 'vue'

interface City { id: string; name: string; country: string }

const allCities: City[] = [
  { id: 'tokyo', name: 'Tokyo', country: 'Japan' },
  { id: 'paris', name: 'Paris', country: 'France' },
  { id: 'london', name: 'London', country: 'United Kingdom' },
  { id: 'new-york', name: 'New York', country: 'United States' },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil' },
  { id: 'berlin', name: 'Berlin', country: 'Germany' },
  { id: 'sydney', name: 'Sydney', country: 'Australia' },
  { id: 'toronto', name: 'Toronto', country: 'Canada' },
  { id: 'mumbai', name: 'Mumbai', country: 'India' },
  { id: 'cairo', name: 'Cairo', country: 'Egypt' },
]

const results = ref<City[]>([])
const loading = ref(false)
const city = ref<string | null>(null)

let lastToken = 0
async function onSearch(query: string) {
  const myToken = ++lastToken
  if (!query) {
    results.value = []
    return
  }
  loading.value = true
  await new Promise((r) => setTimeout(r, 400))
  if (myToken !== lastToken) return // stale request — drop
  const q = query.toLowerCase()
  results.value = allCities.filter((c) => c.name.toLowerCase().includes(q))
  loading.value = false
}
</script>

<div class="demo" style="max-width: 480px;">
  <VSelect
    v-model="city"
    :options="results"
    :loading="loading"
    option-value="id"
    option-label="name"
    placeholder="Search cities…"
    :debounce="200"
    @search="onSearch"
  />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(city) }}</code></div>
</div>

## Cancelling stale responses

Always guard against late responses arriving after the user has typed
something else. The standard pattern is a monotonic token:

```ts
let lastToken = 0

async function onSearch(query: string) {
  const myToken = ++lastToken
  loading.value = true
  const data = await fetch(...).then(r => r.json())
  if (myToken !== lastToken) return  // <-- a newer search has fired, drop
  results.value = data
  loading.value = false
}
```

`AbortController` works too if your `fetch` wrapper supports it.

## Forcing a flush

When the user presses <kbd>Enter</kbd> on a search box you'd typically want
the request to fire **now**, not after the next debounce trailing edge.
Grab the instance and call `flushSearch()`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { VSelectInstance } from '@anilkumarthakur/vue3-select'

const sel = ref<VSelectInstance>()
function onSubmit() {
  sel.value?.flushSearch()
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <VSelect ref="sel" :options="results" :debounce="300" @search="onSearch" />
    <button type="submit">Search</button>
  </form>
</template>
```
