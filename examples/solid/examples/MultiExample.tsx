import { createSignal } from 'solid-js'
import Select from '../Select'
import { countries } from '../../shared/data'
import type { Theme } from '../App'

export default function MultiExample(props: { theme: Theme }) {
  const [selected, setSelected] = createSignal<string[]>(['us', 'jp'])

  return (
    <article class="card">
      <h2>Multi  grouped objects</h2>
      <p>Object options with custom value/label/group accessors.</p>
      <Select
        modelValue={selected()}
        mode="multiple"
        options={countries}
        optionValue="code"
        optionLabel="name"
        optionGroup="region"
        theme={props.theme}
        placeholder="Pick countries"
        onChange={(v) => setSelected(v as string[])}
      />
      <pre>{JSON.stringify({ selected: selected() }, null, 2)}</pre>
    </article>
  )
}
