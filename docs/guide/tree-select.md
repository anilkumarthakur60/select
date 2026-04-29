# Tree Select

`<VTreeSelect>` mirrors `<VSelect>`'s API surface but renders a hierarchy.

- v-model holds **leaf** values only — parent state is always derived
- Tri-state checkboxes for parents (`checked` / `indeterminate` / `unchecked`)
- Toggling a parent toggles every selectable leaf under it
- Search auto-expands matching subtrees so hits are visible without an extra click

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VTreeSelect } from '@anilkumarthakur/vue3-select'

interface Cat { id: number; name: string; children: Cat[] }

const categories: Cat[] = [
  {
    id: 1, name: 'Web',
    children: [
      { id: 2, name: 'Frontend', children: [
        { id: 3, name: 'CSS', children: [] },
        { id: 4, name: 'JavaScript', children: [] },
        { id: 5, name: 'TypeScript', children: [] },
      ]},
      { id: 6, name: 'Backend', children: [
        { id: 7, name: 'Node.js', children: [] },
        { id: 8, name: 'Go', children: [] },
      ]},
    ],
  },
  {
    id: 9, name: 'DevOps', children: [
      { id: 10, name: 'Docker', children: [] },
      { id: 11, name: 'Kubernetes', children: [] },
    ],
  },
]
const picked = ref<number[]>([])
</script>

<template>
  <VTreeSelect
    v-model="picked"
    :options="categories"
    option-value="id"
    option-label="name"
    default-expand-all
  />
</template>
```

<script setup lang="ts">
import { ref } from 'vue'

interface Cat { id: number; name: string; children: Cat[] }

const categories: Cat[] = [
  {
    id: 1, name: 'Web',
    children: [
      { id: 2, name: 'Frontend', children: [
        { id: 3, name: 'CSS', children: [] },
        { id: 4, name: 'JavaScript', children: [] },
        { id: 5, name: 'TypeScript', children: [] },
      ]},
      { id: 6, name: 'Backend', children: [
        { id: 7, name: 'Node.js', children: [] },
        { id: 8, name: 'Go', children: [] },
      ]},
    ],
  },
  {
    id: 9, name: 'DevOps', children: [
      { id: 10, name: 'Docker', children: [] },
      { id: 11, name: 'Kubernetes', children: [] },
    ],
  },
]
const picked = ref<number[]>([])
</script>

<div class="demo" style="max-width: 480px;">
  <VTreeSelect
    v-model="picked"
    :options="categories"
    option-value="id"
    option-label="name"
    default-expand-all
    placeholder="Pick categories"
  />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(picked) }}</code></div>
</div>

## Accessors

| Prop | Default | Reads |
|---|---|---|
| `option-value` | `value` ?? `id` | The value emitted into v-model when this leaf is checked |
| `option-label` | `label` ?? `name` | The visible label |
| `option-children` | `children` | The children array — return `[]` for leaves |
| `option-disabled` | `disabled` | Skip the node from selection / count |

All four accept either a string (property name) or a function `(node) => …`.

## Tri-state semantics

- A **leaf** is `checked` if its value is in v-model, otherwise `unchecked`
- A **parent** is `checked` if **every selectable leaf** below it is in v-model
- `indeterminate` if some-but-not-all are
- Toggling a checked parent removes all its leaves; toggling an unchecked or indeterminate parent adds every selectable leaf

Disabled leaves are skipped from the count, so they never block a parent
from reaching `checked`.

## Toolbar

By default a small toolbar sits above the tree with three actions:

- **Expand all** / **Collapse all** — toggles based on the current state, hidden if the tree has no parent nodes
- **Select all** — pick every selectable leaf (skips disabled leaves and respects `max-selections`)
- **Clear** — only visible when there's a selection

Hide the whole bar with `:show-toolbar="false"` if you want a minimalist
surface, or replace its contents with the `toolbar` slot:

```vue
<VTreeSelect v-model="picked" :options="categories">
  <template #toolbar="{ selectAll, clear, expandAll, collapseAll, allExpanded, selectedCount }">
    <div class="my-toolbar">
      <span>{{ selectedCount }} picked</span>
      <button @mousedown.prevent="allExpanded ? collapseAll() : expandAll()">
        {{ allExpanded ? 'Collapse all' : 'Expand all' }}
      </button>
      <button @mousedown.prevent="selectAll">Select all</button>
      <button @mousedown.prevent="clear">Clear</button>
    </div>
  </template>
</VTreeSelect>
```

Both actions are also exposed on the component instance:

```ts
const tree = ref<VTreeSelectInstance>()
tree.value?.expandAll()
tree.value?.collapseAll()
```

## Search

Same input as `<VSelect>`. The search filters leaves *and* keeps their
ancestor branches in the rendered tree so matches stay reachable. Matching
subtrees auto-expand — clearing the query collapses back to the
`default-expand-all` state.

## When to reach for it

- Categories, taxonomies, file/folder pickers, org charts
- Any picker where parent / child relationships matter for the UX

For non-hierarchical multi-pick, use `<VSelect mode="multiple">` — it's
lighter and the trigger renders inline tags rather than a chip list.
