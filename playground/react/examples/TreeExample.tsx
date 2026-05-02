import { useState } from 'react'
import TreeSelect from '../TreeSelect'
import { categories, flatCategories } from '../../shared/data'

export default function TreeExample(props: { theme: 'light' | 'dark' | 'auto' }) {
  const [selectedTree, setSelectedTree] = useState<number[]>([4, 8])
  const [selectedFlat, setSelectedFlat] = useState<number[]>([])

  return (
    <>
      <article className="card">
        <h2>Tree — checkbox select</h2>
        <p>
          Multi-level categories. Tick a parent to select all leaves under it; tick leaves
          individually for partial coverage. Search filters across every level and reveals matches.
        </p>
        <TreeSelect
          options={categories}
          modelValue={selectedTree}
          onChange={(v) => setSelectedTree(v as number[])}
          optionChildren="children"
          theme={props.theme}
          maxVisibleTags={3}
          placeholder="Pick categories"
        />
        <pre>{JSON.stringify({ selectedTree }, null, 2)}</pre>
      </article>

      <article className="card" style={{ marginTop: 20 }}>
        <h2>Tree — flat (children: [])</h2>
        <p>
          Same component handles the flat list — when no node has children, it renders as a plain
          checkbox list.
        </p>
        <TreeSelect
          options={flatCategories}
          modelValue={selectedFlat}
          onChange={(v) => setSelectedFlat(v as number[])}
          optionChildren="children"
          theme={props.theme}
          placeholder="Pick frameworks"
        />
        <pre>{JSON.stringify({ selectedFlat }, null, 2)}</pre>
      </article>
    </>
  )
}
