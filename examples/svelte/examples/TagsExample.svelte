<script lang="ts">
  import Select from '../Select.svelte'

  let { theme }: { theme: 'light' | 'dark' | 'auto' } = $props()
  let tagOptions = $state<string[]>(['vue', 'react', 'svelte', 'typescript', 'rust', 'go'])
  let tags = $state<string[]>(['svelte', 'typescript'])

  function onCreate(value: string) {
    if (!tagOptions.includes(value)) tagOptions = [...tagOptions, value]
    if (!tags.includes(value)) tags = [...tags, value]
  }
</script>

<article class="card">
  <h2>Tags  create on the fly</h2>
  <p>Type and press Enter to create new options.</p>
  <Select
    modelValue={tags}
    mode="tags"
    options={tagOptions}
    taggable
    {theme}
    placeholder="Add tags"
    onChange={(v) => (tags = v as string[])}
    {onCreate}
  />
  <pre>{JSON.stringify({ tags }, null, 2)}</pre>
</article>
