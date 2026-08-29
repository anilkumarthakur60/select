import { createSignal } from 'solid-js'
import Select from '../Select'
import type { Theme } from '../App'

export default function TagsExample(props: { theme: Theme }) {
  const [tagOptions, setTagOptions] = createSignal<string[]>([
    'vue',
    'react',
    'svelte',
    'solid',
    'typescript',
    'rust',
  ])
  const [tags, setTags] = createSignal<string[]>(['solid', 'typescript'])

  function onCreate(value: string) {
    setTagOptions((prev) => (prev.includes(value) ? prev : [...prev, value]))
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]))
  }

  return (
    <article class="card">
      <h2>Tags  create on the fly</h2>
      <p>Type and press Enter to create new options.</p>
      <Select
        modelValue={tags()}
        mode="tags"
        options={tagOptions()}
        taggable
        theme={props.theme}
        placeholder="Add tags"
        onChange={(v) => setTags(v as string[])}
        onCreate={onCreate}
      />
      <pre>{JSON.stringify({ tags: tags() }, null, 2)}</pre>
    </article>
  )
}
