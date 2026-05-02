import { useState } from 'react'
import { Select } from '@/react'
import { fruits } from '../../shared/data'

export default function BasicExample({ theme }: { theme: 'light' | 'dark' | 'auto' }) {
  const [fruit, setFruit] = useState<string | null>(null)

  return (
    <article className="card">
      <h2>Single — primitives</h2>
      <p>Pass an array of strings; controlled via React state.</p>
      <Select
        modelValue={fruit}
        options={fruits}
        theme={theme}
        placeholder="Pick a fruit"
        onChange={(v) => setFruit(v as string | null)}
      />
      <pre>{JSON.stringify({ fruit }, null, 2)}</pre>
    </article>
  )
}
