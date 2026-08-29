<script lang="ts">
  import Select from '../Select.svelte'
  import { countries, flagFor, type Country } from '../../shared/data'

  let { theme }: { theme: 'light' | 'dark' | 'auto' } = $props()
  let country = $state<string | null>('fr')
</script>

<article class="card">
  <h2>Custom render  flags &amp; meta</h2>
  <p>Override option and selection rendering for richer UI.</p>
  <Select
    modelValue={country}
    options={countries}
    optionValue="code"
    optionLabel="name"
    optionGroup="region"
    {theme}
    placeholder="Pick a country"
    onChange={(v) => (country = v as string | null)}
  >
    {#snippet renderOption(option)}
      <span class="flag">{flagFor((option.raw as Country).code)}</span>
      <span>{option.label}</span>
      <span style="margin-left: auto; font-size: 0.85em; opacity: 0.6;">
        {(option.raw as Country).region}
      </span>
    {/snippet}
    {#snippet renderValue(option)}
      <span class="vselect-single">
        <span class="flag">{flagFor((option.raw as Country).code)}</span>
        {option.label}
      </span>
    {/snippet}
  </Select>
  <pre>{JSON.stringify({ country }, null, 2)}</pre>
</article>
