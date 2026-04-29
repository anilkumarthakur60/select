# Composables

Every state machine and DOM-plumbing primitive that powers the SFCs is
exported. See the [Headless guide](../guide/headless) for a worked example.

## `useSelection`

The single / multi / tags state machine over a normalised option list.
Owns *only* selection; pair with [`useMenuState`](#usemenustate) for the
open / close / active-index state.

```ts
import { useSelection } from '@anilkumarthakur/vue3-select'

const {
  isMulti,
  selectedValues,
  selectedOptions,
  isSelected,
  select,
  deselect,
  clear,
} = useSelection({
  modelValue: ref<unknown>(null),
  options: computed(() => normalize(...)),
  mode: ref<'single' | 'multiple' | 'tags'>('single'),
  maxSelections: ref<number | undefined>(undefined),
  emitUpdate:   (v) => { /* … */ },
  emitSelect:   (option) => { /* … */ },
  emitDeselect: (option) => { /* … */ },
})
```

## `useMenuState`

Open / close + active-row state for a combobox-style menu. Resets the
highlight whenever `itemsCount` shrinks so it never dangles past the end of
a filtered list.

```ts
import { useMenuState } from '@anilkumarthakur/vue3-select'

const { isOpen, activeIndex, open, close, toggle } = useMenuState({
  itemsCount: computed(() => filtered.value.length),
})
```

## `useTreeSelection`

Hierarchical analogue of `useSelection`. Only **leaves** are stored in
v-model — parent state is always derived.

```ts
import { useTreeSelection } from '@anilkumarthakur/vue3-select'

const { selectedValues, isLeafSelected, getCheckState, toggle, selectAll, clear } =
  useTreeSelection({
    modelValue: ref<unknown[]>([]),
    tree: computed(() => normalizeTree(...)),
    maxSelections: ref<number | undefined>(undefined),
    emitUpdate:   (v) => { /* … */ },
    emitSelect:   (node) => { /* … */ },
    emitDeselect: (node) => { /* … */ },
  })
```

`getCheckState(node)` returns `'checked'` / `'unchecked'` / `'indeterminate'`.
Toggling a parent node toggles every selectable leaf below it.

## `useOptionFilter`

```ts
import { useOptionFilter } from '@anilkumarthakur/vue3-select'

const { filtered, hasMatches } = useOptionFilter({
  options,         // Ref<NormalizedOption<T>[]>
  query,           // Ref<string>
  filter,          // optional FilterFn<T>
  caseSensitive,   // optional Ref<boolean>
})
```

## `useTaggable`

The "Create '&lt;query&gt;'" affordance used in tags mode. Suppresses itself when
the query is empty or already matches an existing label.

```ts
import { useTaggable } from '@anilkumarthakur/vue3-select'

const { showCreate, createFromQuery } = useTaggable({
  enabled:  computed(() => mode.value === 'tags' && props.taggable),
  query,
  filtered,
  onCreate: (value) => emit('create', value),
})
```

## `useDebounced`

```ts
import { useDebounced } from '@anilkumarthakur/vue3-select'

const { debounced, flush, cancel, force } = useDebounced(source, 200)
// or with a reactive delay:
const { debounced } = useDebounced(source, ref(200))
```

`flush()` commits the pending value now, `cancel()` drops it, `force(v)`
overrides synchronously and cancels anything in-flight. The pending timer
auto-clears on scope dispose, so this is safe in `setup()` without
explicit cleanup.

## `useKeyboardNav`

```ts
import { useKeyboardNav } from '@anilkumarthakur/vue3-select'

const { onKeydown } = useKeyboardNav({
  isOpen,
  activeIndex,
  options: filtered,
  open,
  close,
  selectActive,
  deselectLast,
  hasQuery: () => query.value.length > 0,
  taggable: ref(false),
  createFromQuery,
})
```

Bind `onKeydown` to a `<input>` / `<button>` `@keydown` and you get
↑ / ↓ / Home / End / Enter / Esc / Tab / Backspace handling.

## `useTriggerInteractions`

Mouse + input handlers shared by `<VSelect>` and `<VTreeSelect>` triggers —
keeps clicking the trigger, focusing the search input, and toggling the
menu in lockstep across components.

```ts
import { useTriggerInteractions } from '@anilkumarthakur/vue3-select'

const { onControlMousedown, onSearchInput } = useTriggerInteractions({
  disabled,
  searchable,
  isOpen,
  searchEl,
  query,
  open,
  toggle,
  // optional: selectors that should skip toggle (default: ['.vselect-tag-remove'])
  ignoreSelectors: ['.my-skip-zone'],
})
```

## `useFloatingMenu`

```ts
import { useFloatingMenu } from '@anilkumarthakur/vue3-select'

const { styles, target, floating, update } = useFloatingMenu(controlEl, menuEl, {
  teleportTo: ref<string | HTMLElement | false>('body'),
})
```

Wraps `@floating-ui/vue` with the same middleware stack `<VSelect>` uses
(offset / flip / shift / width-match). When `teleportTo === false`, `styles`
is `undefined` and `target` is `null` so the menu sits in document flow.

## `useOutsideClick`

```ts
import { useOutsideClick } from '@anilkumarthakur/vue3-select'

useOutsideClick({
  active: isOpen,                    // Ref<boolean>
  contains: [rootEl, menuEl],        // Ref<HTMLElement | null>[]
  onOutside: () => (isOpen.value = false),
})
```

The `pointerdown` listener attaches only while `active` is `true` and
auto-detaches on scope dispose.

## `useControlFocus`

```ts
import { useControlFocus } from '@anilkumarthakur/vue3-select'

const { focused, onFocusIn, onFocusOut } = useControlFocus({
  root: rootEl,
  onFocus: (e) => emit('focus', e),
  onBlur:  (e) => emit('blur', e),
})
```

`focused` is `true` while focus is anywhere inside `root`. The composable
defers blur decisions to the next animation frame so focus moving between
internal children (input → tag remove → input) doesn't flicker `focused`.

## `useFormBinding`

Centralises the native-form integration shared by `<VSelect>` and
`<VTreeSelect>`. Returns a list of hidden-input descriptors the component
renders below its trigger.

```ts
import { useFormBinding } from '@anilkumarthakur/vue3-select'

const { hiddenInputs } = useFormBinding({
  name:    toRef(props, 'name'),
  required: toRef(props, 'required'),
  values:   selectedValues,
  isMulti,
})

// hiddenInputs.value === [{ name: 'skills[]', value: 'ts', required: false }, …]
```

Multi-mode names are suffixed with `[]` so PHP / Rails-style array parsers
pick up every value. When the selection is empty *and* `name` is set, one
empty input is still emitted so the field appears in `FormData`.

## `useStableId`

```ts
import { useStableId } from '@anilkumarthakur/vue3-select'

const id = useStableId('my-prefix') // 'my-prefix-42' (per-instance uid)
```

Used for ARIA wiring. Falls back to a monotonic counter outside a component
context (handy in tests).

## Pure helpers

These are not composables — just plain functions exported from the package
root. They're the same code the components use internally, so reaching for
them stays in lockstep with the component behaviour.

```ts
import {
  // Option / value
  normalize,
  defaultFilter,
  escapeRegex,
  toggleValue,
  valuesEqual,
  readAccessor,
  isPrimitive,
  // Tree
  normalizeTree,
  walkTree,
  flattenTree,
  filterTree,
  getLeafValues,
  getAncestorIds,
} from '@anilkumarthakur/vue3-select'
```

| Helper | Job |
|---|---|
| `normalize(options, config)` | Coerce primitives / objects into `NormalizedOption[]` |
| `normalizeTree(roots, config)` | Same for trees, with depth + parent ids attached |
| `defaultFilter(query, option, caseSensitive?)` | Default substring matcher used by `useOptionFilter` |
| `escapeRegex(input)` | Escape a string for use as a regex literal |
| `valuesEqual(a, b)` | Reference-or-primitive equality |
| `toggleValue(current, value)` | Add-or-remove from a value array (immutable) |
| `readAccessor(option, accessor, fallback)` | Resolve a `keyof T \| (o) => …` accessor |
| `isPrimitive(value)` | Type guard for `string \| number \| boolean` |
| `walkTree(nodes, visit)` | Depth-first traversal — return `false` from `visit` to skip a subtree |
| `flattenTree(nodes)` | Depth-first array of every node |
| `filterTree(nodes, query, caseSensitive?)` | Keep nodes whose label or descendants match — preserves ancestors |
| `getLeafValues(node \| nodes)` | Collect every selectable leaf value reachable from the input |
| `getAncestorIds(node, byId)` | Ids on the path from the node to the root, inclusive |
