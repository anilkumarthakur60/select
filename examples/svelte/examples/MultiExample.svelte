<script lang="ts">
  import Select from '../Select.svelte'
  import { countries } from '../../shared/data'

  let { theme }: { theme: 'light' | 'dark' | 'auto' } = $props()
  let selected = $state<string[]>(['us', 'jp'])
</script>

<article class="card">
  <h2>Multi  grouped objects</h2>
  <p>Object options with custom value/label/group accessors.</p>
  <Select
    modelValue={selected}
    mode="multiple"
    options={countries}
    optionValue="code"
    optionLabel="name"
    optionGroup="region"
    {theme}
    placeholder="Pick countries"
    onChange={(v) => (selected = v as string[])}
  />
  <pre>{JSON.stringify({ selected }, null, 2)}</pre>
</article>
