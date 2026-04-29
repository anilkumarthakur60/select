<script setup lang="ts">
import { ref } from 'vue'
import { VSelect } from '@'
import type { User } from './data'

defineProps<{ theme: 'light' | 'dark' | 'auto' }>()

const userQuery = ref('')
const userLoading = ref(false)
const userResults = ref<User[]>([])
const selectedUser = ref<number | null>(null)

// `:debounce="350"` does the trailing-edge wait — the handler only fires
// once the user stops typing, no manual setTimeout dance required.
async function onUserSearch(q: string) {
  userQuery.value = q
  if (!q) {
    userResults.value = []
    userLoading.value = false
    return
  }
  userLoading.value = true
  // Simulate a network call.
  await new Promise((r) => setTimeout(r, 200))
  const surnames = ['Smith', 'Jones', 'Patel', 'Wong', 'Garcia']
  userResults.value = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `${q.charAt(0).toUpperCase()}${q.slice(1)} ${surnames[i]}`,
    email: `${q.toLowerCase()}.${i + 1}@example.com`,
  }))
  userLoading.value = false
}
</script>

<template>
  <article class="card">
    <h2>Async — debounced search</h2>
    <p>
      <code>:debounce="350"</code> waits for the user to stop typing before firing
      <code>@search</code>, so you only make one request per pause.
    </p>
    <VSelect
      v-model="selectedUser"
      :options="userResults"
      :loading="userLoading"
      :debounce="350"
      option-value="id"
      option-label="name"
      :theme="theme"
      placeholder="Search users…"
      empty-text="Start typing"
      @search="onUserSearch"
    >
      <template #option="{ option }">
        <div class="user-row">
          <strong>{{ (option.raw as User).name }}</strong>
          <span class="muted">{{ (option.raw as User).email }}</span>
        </div>
      </template>
    </VSelect>
    <pre>{{ JSON.stringify({ selectedUser, query: userQuery }, null, 2) }}</pre>
  </article>
</template>
