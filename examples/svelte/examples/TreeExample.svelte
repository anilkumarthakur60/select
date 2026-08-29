<script lang="ts">
  import TreeSelect from '../TreeSelect.svelte'
  import { categories, flatCategories } from '../../shared/data'

  let { theme }: { theme: 'light' | 'dark' | 'auto' } = $props()
  let selectedTree = $state<number[]>([4, 8])
  let selectedFlat = $state<number[]>([])
</script>

<article class="card">
  <h2>Tree  checkbox select</h2>
  <p>
    Multi-level categories. Tick a parent to select all leaves under it; tick leaves individually
    for partial coverage. Search filters across every level.
  </p>
  <TreeSelect
    options={categories}
    modelValue={selectedTree}
    onChange={(v) => (selectedTree = v as number[])}
    optionChildren="children"
    {theme}
    maxVisibleTags={3}
    placeholder="Pick categories"
  />
  <pre>{JSON.stringify({ selectedTree }, null, 2)}</pre>
</article>

<article class="card" style="margin-top: 20px;">
  <h2>Tree  flat (children: [])</h2>
  <p>Same component handles a flat list  renders as a plain checkbox list.</p>
  <TreeSelect
    options={flatCategories}
    modelValue={selectedFlat}
    onChange={(v) => (selectedFlat = v as number[])}
    optionChildren="children"
    {theme}
    placeholder="Pick frameworks"
  />
  <pre>{JSON.stringify({ selectedFlat }, null, 2)}</pre>
</article>
