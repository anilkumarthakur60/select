# `<VTreeSelect>`

Hierarchical multi-select with tri-state parents.

```ts
import { VTreeSelect } from '@anilkumarthakur/vue3-select'
```

v-model holds **leaf values only** — parent state is always derived. See
the [Tree Select guide](../guide/tree-select) for examples.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `unknown[]` | `[]` | v-model — array of selected leaf values |
| `options` | `T[]` | `[]` | Tree roots |
| `optionValue` | `keyof T \| (o: T) => unknown` | `value` ?? `id` | Leaf value accessor |
| `optionLabel` | `keyof T \| (o: T) => string` | `label` ?? `name` | Label accessor |
| `optionChildren` | `keyof T \| (o: T) => T[] \| undefined` | `'children'` | Children accessor |
| `optionDisabled` | `keyof T \| (o: T) => boolean` | `'disabled'` | Disabled flag |
| `placeholder` | `string` | `'Select…'` | Placeholder text |
| `searchable` | `boolean` | `true` | Show the search input |
| `clearable` | `boolean` | `true` | Show the clear button |
| `disabled` | `boolean` | `false` | Disable the whole control |
| `loading` | `boolean` | `false` | Show the loading spinner |
| `maxSelections` | `number` | — | Hard cap on selected leaves |
| `maxVisibleTags` | `number` | — | Collapse to `+N` past this count |
| `defaultExpandAll` | `boolean` | `false` | Expand every parent on first render |
| `showToolbar` | `boolean` | `true` | Show "Select all" / "Clear" actions |
| `closeOnSelect` | `boolean` | `false` | Close after every toggle (rarely useful) |
| `autofocus` | `boolean` | `false` | Focus the search input on mount |
| `debounce` | `number` | — | ms between keystrokes and search emits |
| `emptyText` | `string` | `'No options'` | Menu text when there are no nodes |
| `noResultsText` | `string` | falls back to `emptyText` | Text when search yields nothing |
| `loadingText` | `string` | `'Loading…'` | Menu text while loading |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Control size |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Visual theme |
| `ariaLabel` | `string` | `placeholder` | ARIA label override |
| `teleportTo` | `string \| HTMLElement \| false` | `false` | Mount the menu via `<Teleport>` |
| `name` | `string` | — | Hidden input name (one input per selected leaf) |
| `required` | `boolean` | `false` | Mark the hidden input as required |
| `id` | `string` | auto | Override the auto-generated id |

## Events

| Event | Payload | Fires when |
|---|---|---|
| `update:modelValue` | `unknown[]` | Leaf selection changes |
| `update:search` | `string` | Debounced query changes |
| `search` | `string` | Same as above |
| `select` | `NormalizedTreeNode<T>` | A leaf is checked (fires once per leaf, even when toggling a parent) |
| `deselect` | `NormalizedTreeNode<T>` | A leaf is unchecked |
| `expand` | `NormalizedTreeNode<T>` | Parent expanded |
| `collapse` | `NormalizedTreeNode<T>` | Parent collapsed |
| `open` | — | Menu opens |
| `close` | — | Menu closes |
| `focus` | `FocusEvent` | Focus enters the control |
| `blur` | `FocusEvent` | Focus leaves the control entirely |

```ts
import type { VTreeSelectEmits } from '@anilkumarthakur/vue3-select'
```

## Slots

| Slot | Props |
|---|---|
| `prefix` | — |
| `suffix` | — |
| `value` | `{ selected: NormalizedTreeNode<T>[] }` |
| `tag` | `{ node, remove, disabled }` |
| `toolbar` | `{ selectAll, clear, expandAll, collapseAll, allExpanded, selectedCount }` |
| `empty` | `{ query, mode: 'no-options' \| 'no-results' }` |
| `dropdownicon` | `{ open }` |
| `clearicon` | `{ clear }` |

## Exposed instance methods

```ts
import type { VTreeSelectInstance } from '@anilkumarthakur/vue3-select'

const tree = ref<VTreeSelectInstance>()
tree.value?.open()
tree.value?.close()
tree.value?.toggle()
tree.value?.focus()
tree.value?.blur()
tree.value?.clear()
tree.value?.selectAll()
tree.value?.expand(nodeId)
tree.value?.collapse(nodeId)
tree.value?.expandAll()
tree.value?.collapseAll()
tree.value?.flushSearch()
tree.value?.isOpen
```

## Subcomponent

| Component | Use for |
|---|---|
| `VTreeSelectNode` | A single tree row — exported in case you build a custom toolbar / virtualisation around the same node renderer |

```ts
import { VTreeSelectNode } from '@anilkumarthakur/vue3-select'
```
