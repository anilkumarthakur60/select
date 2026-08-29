import { createSignal } from 'solid-js'
import Select from '../Select'
import { countries, flagFor } from '../../shared/data'
import type { Theme } from '../App'

export default function CustomRenderExample(props: { theme: Theme }) {
  const [country, setCountry] = createSignal<string | null>('fr')

  return (
    <article class="card">
      <h2>Custom render  flags &amp; meta</h2>
      <p>Override option and selection rendering for richer UI.</p>
      <Select
        modelValue={country()}
        options={countries}
        optionValue="code"
        optionLabel="name"
        optionGroup="region"
        theme={props.theme}
        placeholder="Pick a country"
        onChange={(v) => setCountry(v as string | null)}
        renderOption={(option) => (
          <>
            <span class="flag">{flagFor(option.raw.code)}</span>
            <span>{option.label}</span>
            <span style={{ 'margin-left': 'auto', 'font-size': '0.85em', opacity: 0.6 }}>
              {option.raw.region}
            </span>
          </>
        )}
        renderValue={(option) => (
          <span class="vselect-single">
            <span class="flag">{flagFor(option.raw.code)}</span>
            {option.label}
          </span>
        )}
      />
      <pre>{JSON.stringify({ country: country() }, null, 2)}</pre>
    </article>
  )
}
