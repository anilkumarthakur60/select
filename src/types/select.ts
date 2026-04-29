import type { FilterFn } from '@/types/filter'
import type { OptionLike, SelectMode, SelectSize, SelectTheme } from '@/types/option'

/**
 * Public props surface for `<VSelect>`. Defined here (rather than inline in
 * the component) so `vue-tsc` can roll it into the generated `.d.ts` without
 * tripping on synthesized private names.
 */
export interface VSelectProps<T extends OptionLike = OptionLike> {
  modelValue?: unknown
  options?: T[]
  mode?: SelectMode

  /** Property name or accessor for the value emitted via v-model. */
  optionValue?: keyof T | ((option: T) => unknown)
  /** Property name or accessor for the visible label. */
  optionLabel?: keyof T | ((option: T) => string)
  /** Property name or accessor for grouping. */
  optionGroup?: keyof T | ((option: T) => string | undefined)
  /** Property name or accessor for the disabled flag. */
  optionDisabled?: keyof T | ((option: T) => boolean)

  placeholder?: string
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  loading?: boolean

  /** Auto-close after a single-select pick (default: true for `single`). */
  closeOnSelect?: boolean
  /** Focus the search input on mount. */
  autofocus?: boolean
  /** Collapse extra tags into a "+N" pill once this many are selected. */
  maxVisibleTags?: number
  /** Hard cap on selections for multi/tags mode. */
  maxSelections?: number
  /** Permit creating new options from the search query (tags mode default). */
  taggable?: boolean
  /** Custom filter function — overrides the default substring match. */
  filter?: FilterFn<T>
  caseSensitive?: boolean

  /**
   * Delay (ms) between the last keystroke and the `search` / `update:search`
   * emits and the local filter recomputation. The visible input value still
   * updates immediately so typing feels instant. Set this to drive async
   * requests without writing your own setTimeout dance.
   */
  debounce?: number

  /** Shown in the menu when the option list is empty. */
  emptyText?: string
  /** Shown when search yields no matches. Falls back to `emptyText`. */
  noResultsText?: string
  loadingText?: string

  size?: SelectSize
  theme?: SelectTheme

  /** Accessible label, falls back to placeholder. */
  ariaLabel?: string
  /** Mount the menu in a different element ('body', a selector, or false). */
  teleportTo?: string | HTMLElement | false

  /** Form integration — emits hidden inputs under this name. */
  name?: string
  /** Marks the hidden input as required. */
  required?: boolean
  /** Override automatic id generation. */
  id?: string
}

/** Methods exposed via `defineExpose` on `<VSelect>`. */
export interface VSelectInstance {
  open: () => void
  close: () => void
  toggle: () => void
  focus: () => void
  blur: () => void
  clear: () => void
  /** When `debounce` is set, fires the pending search emit immediately. No-op otherwise. */
  flushSearch: () => void
  readonly isOpen: boolean
}
