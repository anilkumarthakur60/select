import { useState } from 'react'
import { Select } from '@/react'
import { countries } from '../../shared/data'

export default function MultiExample({ theme }: { theme: 'light' | 'dark' | 'auto' }) {
  const [selected, setSelected] = useState<string[]>(['us', 'jp'])

  return (
    <article className="card">
      <h2>Multi — grouped objects</h2>
      <p>Object options with custom value/label/group accessors.</p>
      <Select
        modelValue={selected}
        mode="multiple"
        options={countries}
        optionValue="code"
        optionLabel="name"
        optionGroup="region"
        theme={theme}
        placeholder="Pick countries"
        onChange={(v) => setSelected(v as string[])}
      />
      <pre>{JSON.stringify({ selected }, null, 2)}</pre>
    </article>
  )
}
