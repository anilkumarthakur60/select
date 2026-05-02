import { createSignal } from 'solid-js'
import TreeSelect from '../TreeSelect'
import { categories, flatCategories } from '../../shared/data'
import type { Theme } from '../App'

export default function TreeExample(props: { theme: Theme }) {
  const [selectedTree, setSelectedTree] = createSignal<number[]>([4, 8])
  const [selectedFlat, setSelectedFlat] = createSignal<number[]>([])

  return (
    <>
      <article class="card">
        <h2>Tree — checkbox select</h2>
        <p>
          Multi-level categories. Tick a parent to select all leaves under it; tick leaves
          individually for partial coverage. Search filters across every level.
        </p>
        <TreeSelect
          options={categories}
          modelValue={selectedTree()}
          onChange={(v) => setSelectedTree(v as number[])}
          optionChildren="children"
          theme={props.theme}
          maxVisibleTags={3}
          placeholder="Pick categories"
        />
        <pre>{JSON.stringify({ selectedTree: selectedTree() }, null, 2)}</pre>
      </article>

      <article class="card" style={{ 'margin-top': '20px' }}>
        <h2>Tree — flat (children: [])</h2>
        <p>Same component handles a flat list — renders as a plain checkbox list.</p>
        <TreeSelect
          options={flatCategories}
          modelValue={selectedFlat()}
          onChange={(v) => setSelectedFlat(v as number[])}
          optionChildren="children"
          theme={props.theme}
          placeholder="Pick frameworks"
        />
        <pre>{JSON.stringify({ selectedFlat: selectedFlat() }, null, 2)}</pre>
      </article>
    </>
  )
}
