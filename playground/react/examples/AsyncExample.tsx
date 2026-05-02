import { useRef, useState } from 'react'
import { Select } from '@/react'
import type { User } from '../../shared/data'

export default function AsyncExample({ theme }: { theme: 'light' | 'dark' | 'auto' }) {
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onSearch(q: string) {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
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
    <article className="card">
      <h2>Async — debounced search</h2>
      <p>
        Manual debounce in <code>onSearch</code> — the React adapter is headless about timing, so
        consumers compose their own debouncing strategy.
      </p>
      <Select
        modelValue={selected}
        options={results}
        loading={loading}
        optionValue="id"
        optionLabel="name"
        theme={theme}
        placeholder="Search users…"
        emptyText="Start typing"
        onChange={(v) => setSelected(v as number | null)}
        onSearch={onSearch}
        renderOption={(option) => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong>{(option.raw as User).name}</strong>
            <span style={{ opacity: 0.6, fontSize: '0.8em' }}>{(option.raw as User).email}</span>
          </div>
        )}
      />
      <pre>{JSON.stringify({ selected, query }, null, 2)}</pre>
    </article>
  )
}
