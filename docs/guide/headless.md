# Headless Composables

`<VSelect>` is a thin assembly of small composables. Each one is exported
publicly so you can build a totally custom UI on the same primitives.

## Available primitives

| Composable | Job |
|---|---|
| `useSelection` | The single / multi / tags state machine over an option list |
| `useMenuState` | Open / close + active-row state for a combobox-style menu |
| `useTreeSelection` | Same idea as `useSelection`, but for hierarchical data with tri-state parents |
| `useOptionFilter` | Filter the option list against a query (custom filter optional) |
| `useTaggable` | "Create '&lt;query&gt;'" affordance with suppression rules |
| `useDebounced` | Debounce a `Ref` source with `flush` / `cancel` / `force` escape hatches |
| `useKeyboardNav` | Arrow / Home / End / Enter / Esc / Backspace key handling |
| `useTriggerInteractions` | Mouse + input handlers shared by both triggers |
| `useFloatingMenu` | The `@floating-ui/vue` setup — middleware, teleport gating |
| `useOutsideClick` | Pointerdown outside a set of refs while active |
| `useControlFocus` | Track "focus is inside this subtree" with rAF-deferred blur |
| `useFormBinding` | Hidden-input descriptors for native `<form>` participation |
| `useStableId` | Per-instance id for ARIA wiring |

## Pure helpers

| Helper | Job |
|---|---|
| `normalize(options, config)` | Coerce primitives / objects into `NormalizedOption[]` |
| `normalizeTree(roots, config)` | Same for trees, with depth + parent ids |
| `defaultFilter(query, option, caseSensitive?)` | The substring matcher used by default |
| `escapeRegex(input)` | Escape a string for use as a regex literal |
| `valuesEqual(a, b)` | Reference-or-primitive equality |
| `toggleValue(current, value)` | Add-or-remove from a value array (immutable) |
| `readAccessor(option, accessor, fallback)` | Resolve a `keyof T \| (o) => …` accessor |
| `isPrimitive(value)` | Type guard for `string \| number \| boolean` |
| `walkTree`, `flattenTree`, `filterTree`, `getLeafValues`, `getAncestorIds` | Tree traversal helpers |

## Building a custom select

A minimal command-palette-style picker that reuses the state machine and
keyboard handling but renders its own UI:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useSelection,
  useMenuState,
  useOptionFilter,
  useKeyboardNav,
  useDebounced,
  normalize,
} from '@anilkumarthakur/vue3-select'

const props = defineProps<{ options: string[] }>()
const modelValue = defineModel<unknown>()

const query = ref('')
const { debounced: debouncedQuery } = useDebounced(query, 100)

const normalised = computed(() => normalize(props.options, {}))

const { filtered } = useOptionFilter({
  options: normalised,
  query: debouncedQuery,
})

const { isOpen, activeIndex, open, close } = useMenuState({
  itemsCount: computed(() => filtered.value.length),
})

const { isSelected, select } = useSelection({
  modelValue,
  options: normalised,
  mode: ref('single'),
  emitUpdate:   (v) => (modelValue.value = v),
  emitSelect:   () => {},
  emitDeselect: () => {},
})

function selectActive() {
  const opt = filtered.value[activeIndex.value]
  if (opt) select(opt)
  close()
}

const { onKeydown } = useKeyboardNav({
  isOpen,
  activeIndex,
  options: filtered,
  open,
  close,
  selectActive,
  deselectLast: () => {},
  hasQuery: () => query.value.length > 0,
  taggable: ref(false),
  createFromQuery: () => {},
})
</script>
```

You now have a fully-functional state machine — render the input, list,
and selected display with whatever markup your design system uses.

## Why this matters

Most "headless UI" libraries are an entire second component to learn. Here
the headless surface is the same code that powers the bundled SFC, so
upgrading from "I'll just use `<VSelect>`" to "I need full control over
markup" is a continuous slope, not a rewrite.
