import { createSignal } from 'solid-js'
import Select from '../Select'
import { plans } from '../../shared/data'
import type { Theme } from '../App'

export default function SizesExample(props: { theme: Theme }) {
  const [plan, setPlan] = createSignal<string | null>('pro')

  return (
    <article class="card">
      <h2>Disabled options &amp; sizes</h2>
      <p>
        Enterprise is disabled; <code>size</code> scales the control.
      </p>
      <div class="stack">
        <Select
          modelValue={plan()}
          options={plans}
          size="sm"
          optionValue="value"
          optionLabel="label"
          optionDisabled="disabled"
          theme={props.theme}
          placeholder="Plan (sm)"
          onChange={(v) => setPlan(v as string | null)}
        />
        <Select
          modelValue={plan()}
          options={plans}
          size="md"
          optionValue="value"
          optionLabel="label"
          optionDisabled="disabled"
          theme={props.theme}
          placeholder="Plan (md)"
          onChange={(v) => setPlan(v as string | null)}
        />
        <Select
          modelValue={plan()}
          options={plans}
          size="lg"
          optionValue="value"
          optionLabel="label"
          optionDisabled="disabled"
          theme={props.theme}
          placeholder="Plan (lg)"
          onChange={(v) => setPlan(v as string | null)}
        />
      </div>
      <pre>{JSON.stringify({ plan: plan() }, null, 2)}</pre>
    </article>
  )
}
