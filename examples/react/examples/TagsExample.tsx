import { useState } from 'react'
import { Select } from '@anil-labs/select-react'

export default function TagsExample({ theme }: { theme: 'light' | 'dark' | 'auto' }) {
  const [tagOptions, setTagOptions] = useState<string[]>([
    'vue',
    'react',
    'svelte',
    'typescript',
    'rust',
    'go',
  ])
  const [tags, setTags] = useState<string[]>(['react', 'typescript'])

  function onCreate(value: string) {
    setTagOptions((prev) => (prev.includes(value) ? prev : [...prev, value]))
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]))
  }

  return (
    <article className="card">
      <h2>Tags  create on the fly</h2>
      <p>Type and press Enter to create new options.</p>
      <Select
        modelValue={tags}
        mode="tags"
        options={tagOptions}
        taggable
        theme={theme}
        placeholder="Add tags"
        onChange={(v) => setTags(v as string[])}
        onCreate={onCreate}
      />
      <pre>{JSON.stringify({ tags }, null, 2)}</pre>
    </article>
  )
}
