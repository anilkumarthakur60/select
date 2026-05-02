import { useState } from 'react'
import { Select } from '@/react'
import { plans } from '../../shared/data'

export default function SizesExample({ theme }: { theme: 'light' | 'dark' | 'auto' }) {
  const [plan, setPlan] = useState<string | null>('pro')

  return (
    <article className="card">
      <h2>Disabled options &amp; sizes</h2>
      <p>
        Enterprise is disabled; <code>size</code> scales the control.
      </p>
      <div className="stack">
        <Select
          modelValue={plan}
          options={plans}
          size="sm"
          optionValue="value"
          optionLabel="label"
          optionDisabled="disabled"
          theme={theme}
          placeholder="Plan (sm)"
          onChange={(v) => setPlan(v as string | null)}
        />
        <Select
          modelValue={plan}
          options={plans}
          size="md"
          optionValue="value"
          optionLabel="label"
          optionDisabled="disabled"
          theme={theme}
          placeholder="Plan (md)"
          onChange={(v) => setPlan(v as string | null)}
        />
        <Select
          modelValue={plan}
          options={plans}
          size="lg"
          optionValue="value"
          optionLabel="label"
          optionDisabled="disabled"
          theme={theme}
          placeholder="Plan (lg)"
          onChange={(v) => setPlan(v as string | null)}
        />
      </div>
      <pre>{JSON.stringify({ plan }, null, 2)}</pre>
    </article>
  )
}
