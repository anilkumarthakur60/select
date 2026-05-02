import { createSignal } from 'solid-js'
import Select from '../Select'
import { fruits } from '../../shared/data'
import type { Theme } from '../App'

export default function BasicExample(props: { theme: Theme }) {
  const [fruit, setFruit] = createSignal<string | null>(null)

  return (
    <article class="card">
      <h2>Single — primitives</h2>
      <p>Pass an array of strings; controlled via Solid signal.</p>
      <Select
        modelValue={fruit()}
        options={fruits}
        theme={props.theme}
        placeholder="Pick a fruit"
        onChange={(v) => setFruit(v as string | null)}
      />
      <pre>{JSON.stringify({ fruit: fruit() }, null, 2)}</pre>
    </article>
  )
}
