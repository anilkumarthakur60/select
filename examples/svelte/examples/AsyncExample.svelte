<script lang="ts">
  import Select from '../Select.svelte'
  import type { User } from '../../shared/data'

  let { theme }: { theme: 'light' | 'dark' | 'auto' } = $props()
  let results = $state<User[]>([])
  let loading = $state(false)
  let selected = $state<number | null>(null)
  let query = $state('')
  let timer: ReturnType<typeof setTimeout> | null = null

  function onSearch(q: string) {
    query = q
    if (timer) clearTimeout(timer)
    if (!q) {
      results = []
      loading = false
      return
    }
    loading = true
    timer = setTimeout(async () => {
      await new Promise((r) => setTimeout(r, 200))
      const surnames = ['Smith', 'Jones', 'Patel', 'Wong', 'Garcia']
      results = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `${q.charAt(0).toUpperCase()}${q.slice(1)} ${surnames[i]}`,
        email: `${q.toLowerCase()}.${i + 1}@example.com`,
      }))
      loading = false
    }, 350)
  }
</script>

<article class="card">
  <h2>Async — debounced search</h2>
  <p>Manual debounce in onSearch — adapters stay neutral about timing.</p>
  <Select
    modelValue={selected}
    options={results}
    {loading}
    optionValue="id"
    optionLabel="name"
    {theme}
    placeholder="Search users…"
    emptyText="Start typing"
    onChange={(v) => (selected = v as number | null)}
    {onSearch}
  >
    {#snippet renderOption(option)}
      <div style="display: flex; flex-direction: column;">
        <strong>{(option.raw as User).name}</strong>
        <span style="opacity: 0.6; font-size: 0.8em;">{(option.raw as User).email}</span>
      </div>
    {/snippet}
  </Select>
  <pre>{JSON.stringify({ selected, query }, null, 2)}</pre>
</article>
