# Types

All public types are exported from the package root.

```ts
import type {
  // Core option shape
  NormalizedOption,
  OptionLike,
  OptionAccessor,
  // Mode + visual
  SelectMode,
  SelectSize,
  SelectTheme,
  // Filter
  FilterFn,
  FilterContext,
  // <VSelect> contracts
  VSelectProps,
  VSelectEmits,
  VSelectInstance,
  VSelectSlots,
  // <VSelect> slot prop shapes
  OptionSlotProps,
  TagSlotProps,
  ValueSlotProps,
  OptionGroupSlotProps,
  EmptySlotProps,
  CreateSlotProps,
  ClearIconSlotProps,
  DropdownIconSlotProps,
  LoaderSlotProps,
  // Tree variants
  NormalizedTreeNode,
  TreeOptionLike,
  TreeChildrenAccessor,
  TreeNodeCheckState,
  // <VTreeSelect> contracts
  VTreeSelectProps,
  VTreeSelectEmits,
  VTreeSelectInstance,
  VTreeSelectSlots,
  // <VTreeSelect> slot prop shapes
  TreeTagSlotProps,
  TreeValueSlotProps,
  TreeToolbarSlotProps,
  TreeEmptySlotProps,
} from '@anilkumarthakur/vue3-select'
```

The composables expose their own option / return types — see the
[Composables reference](./composables) for those. They're all importable
from the same package root.

## `NormalizedOption<T>`

```ts
interface NormalizedOption<T = unknown> {
  /** Stable, unique key — used by Vue's v-for and ARIA wiring. */
  id: string
  /** Value emitted via v-model. */
  value: unknown
  /** Display label. */
  label: string
  /** Optional group key. */
  group?: string
  /** Disabled options render but cannot be picked. */
  disabled?: boolean
  /** Original input as supplied by the caller. */
  raw: T
}
```

## `OptionLike`

```ts
type OptionLike = string | number | object
```

The widest type the component accepts as an option. Pinned to `object`
(rather than `Record<string, unknown>`) so consumer interfaces without an
index signature still satisfy the constraint, without falling back to `any`.

## `OptionAccessor<T, R>`

```ts
type OptionAccessor<T, R> = keyof T | ((option: T) => R)
```

Either a property name or an extractor function.

## `SelectMode` / `SelectSize` / `SelectTheme`

```ts
type SelectMode  = 'single' | 'multiple' | 'tags'
type SelectSize  = 'sm' | 'md' | 'lg'
type SelectTheme = 'light' | 'dark' | 'auto'
```

## `FilterFn<T>`

```ts
type FilterFn<T = unknown> = (ctx: FilterContext<T>) => boolean

interface FilterContext<T> {
  query: string
  option: NormalizedOption<T>
}
```

Custom filter — return `true` to keep the option in the menu.

## `VSelectProps<T>`

The full prop surface for `<VSelect>`. Use it to type wrappers:

```ts
import type { VSelectProps } from '@anilkumarthakur/vue3-select'

interface MyPickerProps<T> extends VSelectProps<T> {
  helperText?: string
}
```

See the [`<VSelect>` reference](./v-select#props) for the complete table.

## `VSelectEmits<T>`

```ts
interface VSelectEmits<T = unknown> {
  (e: 'update:modelValue', value: unknown): void
  (e: 'update:search', value: string): void
  (e: 'open'): void
  (e: 'close'): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur',  event: FocusEvent): void
  (e: 'select',   option: NormalizedOption<T>): void
  (e: 'deselect', option: NormalizedOption<T>): void
  (e: 'create', value: string): void
  (e: 'search', query: string): void
}
```

## `VSelectInstance`

Whatever `<VSelect>` exposes via `defineExpose`:

```ts
interface VSelectInstance {
  open: () => void
  close: () => void
  toggle: () => void
  focus: () => void
  blur: () => void
  clear: () => void
  /** Commit the pending debounced search now (no-op when `debounce` is unset). */
  flushSearch: () => void
  readonly isOpen: boolean
}
```

## `VSelectSlots<T>`

Aggregate map of every slot `<VSelect>` exposes — useful for typing wrappers
that forward children through. Each entry is keyed by slot name and resolves
to a render function with the matching props. See [Slot prop shapes](#slot-prop-shapes-vselect)
below for the individual interfaces.

## Slot prop shapes (`<VSelect>`)

```ts
interface OptionSlotProps<T = unknown> {
  option: NormalizedOption<T>
  selected: boolean
  active: boolean
  disabled: boolean
}

interface TagSlotProps<T = unknown> {
  option: NormalizedOption<T>
  remove: () => void
  disabled: boolean
}

interface ValueSlotProps<T = unknown> {
  selected: NormalizedOption<T>[]
  isMulti: boolean
}

interface OptionGroupSlotProps {
  group: string
}

interface EmptySlotProps {
  query: string
  mode: 'no-options' | 'no-results'
}

interface CreateSlotProps {
  query: string
  create: () => void
}

interface ClearIconSlotProps {
  clear: () => void
}

interface DropdownIconSlotProps {
  open: boolean
}

interface LoaderSlotProps {
  /** True when the loader appears inside the menu, false in the control. */
  inMenu: boolean
}
```

## `NormalizedTreeNode<T>`

```ts
interface NormalizedTreeNode<T = unknown> {
  id: string
  value: unknown
  label: string
  /** 0 for top-level, increments per nesting level. */
  depth: number
  parentId: string | null
  /** A leaf has no children; only leaves are toggled into v-model. */
  isLeaf: boolean
  disabled: boolean
  children: NormalizedTreeNode<T>[]
  raw: T
}
```

## `TreeOptionLike`

```ts
type TreeOptionLike = object
```

Same rationale as `OptionLike`.

## `TreeChildrenAccessor<T>`

```ts
type TreeChildrenAccessor<T> = OptionAccessor<T, T[] | undefined>
```

## `TreeNodeCheckState`

```ts
type TreeNodeCheckState = 'unchecked' | 'indeterminate' | 'checked'
```

What `getCheckState(node)` returns from `useTreeSelection`.

## `VTreeSelectProps<T>`

Full prop surface for `<VTreeSelect>` — see the
[`<VTreeSelect>` reference](./v-tree-select#props) for the complete table.

## `VTreeSelectEmits<T>`

```ts
interface VTreeSelectEmits<T = unknown> {
  (e: 'update:modelValue', value: unknown[]): void
  (e: 'update:search', value: string): void
  (e: 'open'): void
  (e: 'close'): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur',  event: FocusEvent): void
  (e: 'select',   node: NormalizedTreeNode<T>): void
  (e: 'deselect', node: NormalizedTreeNode<T>): void
  (e: 'expand',   node: NormalizedTreeNode<T>): void
  (e: 'collapse', node: NormalizedTreeNode<T>): void
  (e: 'search', query: string): void
}
```

## `VTreeSelectInstance`

```ts
interface VTreeSelectInstance {
  open: () => void
  close: () => void
  toggle: () => void
  focus: () => void
  blur: () => void
  clear: () => void
  selectAll: () => void
  expand:   (id: string) => void
  collapse: (id: string) => void
  expandAll:   () => void
  collapseAll: () => void
  flushSearch: () => void
  readonly isOpen: boolean
}
```

## `VTreeSelectSlots<T>`

Aggregate slot map for `<VTreeSelect>`. Slots: `prefix`, `suffix`, `tag`,
`value`, `toolbar`, `empty`, `dropdownicon`, `clearicon`. See
[Slot prop shapes](#slot-prop-shapes-vtreeselect) below.

## Slot prop shapes (`<VTreeSelect>`)

```ts
interface TreeTagSlotProps<T = unknown> {
  node: NormalizedTreeNode<T>
  remove: () => void
  disabled: boolean
}

interface TreeValueSlotProps<T = unknown> {
  selected: NormalizedTreeNode<T>[]
}

interface TreeToolbarSlotProps {
  selectAll: () => void
  clear: () => void
  /** Expand every parent in the tree. */
  expandAll: () => void
  /** Collapse every parent in the tree. */
  collapseAll: () => void
  /** True when every parent in the full tree is currently expanded. */
  allExpanded: boolean
  selectedCount: number
}

interface TreeEmptySlotProps {
  query: string
  mode: 'no-options' | 'no-results'
}
```

`<VTreeSelect>` also reuses `DropdownIconSlotProps` and `ClearIconSlotProps`
from the `<VSelect>` set.
