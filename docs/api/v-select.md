# `<VSelect>`

The flagship component — single, multi, tags, async, grouped, all in one.

```ts
import { VSelect } from '@anilkumarthakur/vue3-select'
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `unknown \| unknown[]` | — | v-model — single value in `single` mode, array in `multiple` / `tags` |
| `options` | `T[]` | `[]` | Source list |
| `mode` | `'single' \| 'multiple' \| 'tags'` | `'single'` | Selection shape |
| `optionValue` | `keyof T \| (o: T) => unknown` | `'value'` | Value accessor |
| `optionLabel` | `keyof T \| (o: T) => string` | `'label'` | Label accessor |
| `optionGroup` | `keyof T \| (o: T) => string \| undefined` | — | Group key accessor |
| `optionDisabled` | `keyof T \| (o: T) => boolean` | `'disabled'` | Disabled flag |
| `placeholder` | `string` | `'Select…'` | Placeholder text |
| `searchable` | `boolean` | `true` | Show the search input |
| `clearable` | `boolean` | `true` | Show the clear button |
| `disabled` | `boolean` | `false` | Disable the whole control |
| `loading` | `boolean` | `false` | Show the loading spinner |
| `closeOnSelect` | `boolean` | `mode === 'single'` | Close menu after a pick |
| `autofocus` | `boolean` | `false` | Focus the search input on mount |
| `taggable` | `boolean` | `false` | Allow creating new options (tags mode) |
| `maxVisibleTags` | `number` | — | Collapse extras into a `+N` chip past this count |
| `maxSelections` | `number` | — | Hard cap on multi / tags selections |
| `filter` | `FilterFn<T>` | substring | Custom filter function |
| `caseSensitive` | `boolean` | `false` | Case-sensitive matching |
| `debounce` | `number` | — | ms between keystrokes and `@search` / filter recomputation |
| `emptyText` | `string` | `'No options'` | Menu text when there are no options |
| `noResultsText` | `string` | falls back to `emptyText` | Menu text when search yields nothing |
| `loadingText` | `string` | `'Loading…'` | Menu text while loading |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Control size |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Visual theme |
| `ariaLabel` | `string` | `placeholder` | ARIA label override |
| `teleportTo` | `string \| HTMLElement \| false` | `false` | Mount the menu via `<Teleport>` to this target |
| `name` | `string` | — | Hidden input name for native form submission |
| `required` | `boolean` | `false` | Mark the hidden input as required |
| `id` | `string` | auto | Override the auto-generated id |

## Events

| Event | Payload | Fires when |
|---|---|---|
| `update:modelValue` | `unknown` | The selection changes |
| `update:search` | `string` | The (debounced) query changes |
| `search` | `string` | Same as above — fire for `@search` listeners |
| `select` | `NormalizedOption<T>` | An option is added to the selection |
| `deselect` | `NormalizedOption<T>` | An option is removed |
| `create` | `string` | Tags mode — user pressed Enter on a non-matching query |
| `open` | — | Menu opens |
| `close` | — | Menu closes |
| `focus` | `FocusEvent` | Focus enters the control |
| `blur` | `FocusEvent` | Focus leaves the control entirely |

```ts
import type { VSelectEmits } from '@anilkumarthakur/vue3-select'
```

## Slots

See the [Slots guide](../guide/slots) for usage. Quick reference:

| Slot | Props |
|---|---|
| `prefix` | — |
| `suffix` | — |
| `value` | `{ selected, isMulti }` |
| `tag` | `{ option, remove, disabled }` |
| `option` | `{ option, selected, active, disabled }` |
| `optiongroup` | `{ group }` |
| `empty` | `{ query, mode: 'no-options' \| 'no-results' }` |
| `loader` | `{ inMenu }` |
| `dropdownicon` | `{ open }` |
| `clearicon` | `{ clear }` |
| `create` | `{ query, create }` |

## Exposed instance methods

```ts
import type { VSelectInstance } from '@anilkumarthakur/vue3-select'

const sel = ref<VSelectInstance>()
sel.value?.open()         // open the menu
sel.value?.close()        // close it
sel.value?.toggle()       // flip
sel.value?.focus()        // focus the search input (or trigger if not searchable)
sel.value?.blur()         // blur whichever element has focus
sel.value?.clear()        // wipe the selection
sel.value?.flushSearch()  // commit the pending debounced search now
sel.value?.isOpen         // boolean — readable mirror of the open state
```

## Subcomponents

`VSelect` is assembled from two subcomponents that are also exported, in case
you want to reuse them outside the parent control:

| Component | Use for |
|---|---|
| `VSelectOption` | A single menu row — handles `pick` / `highlight` events and renders the active / selected styling |
| `VSelectTag` | One tag chip with a remove button, used in multi / tags mode |

```ts
import { VSelectOption, VSelectTag } from '@anilkumarthakur/vue3-select'
```

## Bundled icons

Three small inline SVGs ship with the package for the default trigger /
option chrome. Re-export them if you want to mirror the visual style in
custom slot content.

```ts
import { ChevronDownIcon, CheckIcon, CloseIcon } from '@anilkumarthakur/vue3-select'
```
