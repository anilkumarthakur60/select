<script lang="ts">
  import Select from '../Select.svelte'
  import { fruits } from '../../shared/data'

  let { theme }: { theme: 'light' | 'dark' | 'auto' } = $props()
  let fruit = $state<string | null>(null)
</script>

<article class="card">
  <h2>Single  primitives</h2>
  <p>Pass an array of strings; modelValue is two-way through onChange.</p>
  <Select
    modelValue={fruit}
    options={fruits}
    {theme}
    placeholder="Pick a fruit"
    onChange={(v) => (fruit = v as string | null)}
  />
  <pre>{JSON.stringify({ fruit }, null, 2)}</pre>
</article>
