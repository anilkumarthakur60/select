import { useState } from 'react'
import { Select } from '@/react'
import { countries, flagFor, type Country } from '../../shared/data'

export default function CustomRenderExample({ theme }: { theme: 'light' | 'dark' | 'auto' }) {
  const [country, setCountry] = useState<string | null>('fr')

  return (
    <article className="card">
      <h2>Custom render — flags &amp; meta</h2>
      <p>Override option and selection rendering for richer UI.</p>
      <Select
        modelValue={country}
        options={countries}
        optionValue="code"
        optionLabel="name"
        optionGroup="region"
        theme={theme}
        placeholder="Pick a country"
        onChange={(v) => setCountry(v as string | null)}
        renderOption={(option) => (
          <>
            <span className="flag">{flagFor((option.raw as Country).code)}</span>
            <span>{option.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.85em', opacity: 0.6 }}>
              {(option.raw as Country).region}
            </span>
          </>
        )}
        renderValue={(option) => (
          <span className="vselect-single">
            <span className="flag">{flagFor((option.raw as Country).code)}</span>
            {option.label}
          </span>
        )}
      />
      <pre>{JSON.stringify({ country }, null, 2)}</pre>
    </article>
  )
}
