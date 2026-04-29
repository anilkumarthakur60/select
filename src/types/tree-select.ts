import type { SelectSize, SelectTheme } from '@/types/option'
import type { TreeOptionLike } from '@/types/tree-node'

/**
 * Public props surface for `<VTreeSelect>`. Extracted here (rather than
 * inline in the component) so `vue-tsc` can roll it into the generated
 * `.d.ts` without tripping on synthesized private names.
 */
export interface VTreeSelectProps<T extends TreeOptionLike = TreeOptionLike> {
  /** v-model — array of leaf values currently selected. */
  modelValue?: unknown[]
  options?: T[]

  /** Property name or accessor for the value emitted via v-model. */
  optionValue?: keyof T | ((option: T) => unknown)
  /** Property name or accessor for the visible label. */
  optionLabel?: keyof T | ((option: T) => string)
  /** Property name or accessor for the children array. Default `'children'`. */
  optionChildren?: keyof T | ((option: T) => T[] | undefined)
  /** Property name or accessor for the disabled flag. */
  optionDisabled?: keyof T | ((option: T) => boolean)

  placeholder?: string
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  /** Hard cap on selected leaves. */
  maxSelections?: number
  /** Collapse the trigger to "+N" once this many tags are visible. */
  maxVisibleTags?: number

  /** Expand every parent on first render. */
  defaultExpandAll?: boolean
  /** Show "select all" / "clear" actions above the tree. */
  showToolbar?: boolean
  /** Auto-close after every toggle (rarely useful for trees — default false). */
  closeOnSelect?: boolean
  /** Focus the search input on mount. */
  autofocus?: boolean

  /**
   * Delay (ms) between the last keystroke and the search emits / filter
   * recomputation. The input value still updates immediately so typing feels
   * instant. Mostly useful for very large trees or remote-source variants.
   */
  debounce?: number

  emptyText?: string
  noResultsText?: string
  loadingText?: string

  size?: SelectSize
  theme?: SelectTheme

  ariaLabel?: string
  teleportTo?: string | HTMLElement | false

  /** Form integration — emits hidden inputs under this name (one per leaf). */
  name?: string
  /** Marks the hidden input as required. */
  required?: boolean
  id?: string
}

/** Methods exposed via `defineExpose` on `<VTreeSelect>`. */
export interface VTreeSelectInstance {
  open: () => void
  close: () => void
  toggle: () => void
  focus: () => void
  blur: () => void
  clear: () => void
  selectAll: () => void
  expand: (id: string) => void
  collapse: (id: string) => void
  /** Expand every parent node in the tree. */
  expandAll: () => void
  /** Collapse every parent node in the tree. */
  collapseAll: () => void
  /** When `debounce` is set, fires the pending search emit immediately. No-op otherwise. */
  flushSearch: () => void
  readonly isOpen: boolean
}
