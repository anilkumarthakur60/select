<script lang="ts">
  import Select from '../Select.svelte'
  import { plans } from '../../shared/data'

  let { theme }: { theme: 'light' | 'dark' | 'auto' } = $props()
  let plan = $state<string | null>('pro')
</script>

<article class="card">
  <h2>Disabled options &amp; sizes</h2>
  <p>Enterprise is disabled; <code>size</code> scales the control.</p>
  <div class="stack">
    <Select
      modelValue={plan}
      options={plans}
      size="sm"
      optionValue="value"
      optionLabel="label"
      optionDisabled="disabled"
      {theme}
      placeholder="Plan (sm)"
      onChange={(v) => (plan = v as string | null)}
    />
    <Select
      modelValue={plan}
      options={plans}
      size="md"
      optionValue="value"
      optionLabel="label"
      optionDisabled="disabled"
      {theme}
      placeholder="Plan (md)"
      onChange={(v) => (plan = v as string | null)}
    />
    <Select
      modelValue={plan}
      options={plans}
      size="lg"
      optionValue="value"
      optionLabel="label"
      optionDisabled="disabled"
      {theme}
      placeholder="Plan (lg)"
      onChange={(v) => (plan = v as string | null)}
    />
  </div>
  <pre>{JSON.stringify({ plan }, null, 2)}</pre>
</article>
