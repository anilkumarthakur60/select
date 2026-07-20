import { createSignal } from 'solid-js'
import Select from '../Select'
import type { User } from '../../shared/data'
import type { Theme } from '../App'

export default function AsyncExample(props: { theme: Theme }) {
  const [results, setResults] = createSignal<User[]>([])
  const [loading, setLoading] = createSignal(false)
  const [selected, setSelected] = createSignal<number | null>(null)
  const [query, setQuery] = createSignal('')
  let timer: ReturnType<typeof setTimeout> | null = null

  function onSearch(q: string) {
    setQuery(q)
    if (timer) clearTimeout(timer)
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    timer = setTimeout(async () => {
      await new Promise((r) => setTimeout(r, 200))
      const surnames = ['Smith', 'Jones', 'Patel', 'Wong', 'Garcia']
      setResults(
        Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `${q.charAt(0).toUpperCase()}${q.slice(1)} ${surnames[i]}`,
          email: `${q.toLowerCase()}.${i + 1}@example.com`,
        })),
      )
      setLoading(false)
    }, 350)
  }

  return (
    <article class="card">
      <h2>Async — debounced search</h2>
      <p>Manual debounce in onSearch.</p>
      <Select
        modelValue={selected()}
        options={results()}
        loading={loading()}
        optionValue="id"
        optionLabel="name"
        theme={props.theme}
        placeholder="Search users…"
        emptyText="Start typing"
        onChange={(v) => setSelected(v as number | null)}
        onSearch={onSearch}
        renderOption={(option) => (
          <div style={{ display: 'flex', 'flex-direction': 'column' }}>
            <strong>{option.raw.name}</strong>
            <span style={{ opacity: 0.6, 'font-size': '0.8em' }}>{option.raw.email}</span>
          </div>
        )}
      />
      <pre>{JSON.stringify({ selected: selected(), query: query() }, null, 2)}</pre>
    </article>
  )
}
