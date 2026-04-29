// Public package entry. Consumers import named exports for tree-shaking; the
// optional `VueSelectPlugin` is available for global registration.

// Source SCSS for the dev playground / docs site. Vite's lib build extracts
// this to `dist/vue3-select.css` (no JS-side import in the bundled output) —
// consumers must `import '@anilkumarthakur/vue3-select/style.css'` themselves,
// or `import '@anilkumarthakur/vue3-select/scss'` to compose with their tokens.
import '@/styles/index.scss'

// Components
export { default as VSelect } from '@/components/VSelect'
export { default as VSelectOption } from '@/components/VSelectOption'
export { default as VSelectTag } from '@/components/VSelectTag'
export { default as VTreeSelect } from '@/components/VTreeSelect'
export { default as VTreeSelectNode } from '@/components/VTreeSelectNode'
export * from '@/components/icons'

// Plugin
export { VueSelectPlugin, type VueSelectPluginOptions } from '@/plugin'

// Composables — re-exported so users can build headless variants on top.
export {
  useControlFocus,
  useDebounced,
  useFloatingMenu,
  useFormBinding,
  useKeyboardNav,
  useMenuState,
  useOptionFilter,
  useOutsideClick,
  useSelection,
  useStableId,
  useTaggable,
  useTreeSelection,
  useTriggerInteractions,
  type FormHiddenInput,
  type UseControlFocusOptions,
  type UseControlFocusReturn,
  type UseDebouncedReturn,
  type UseFloatingMenuOptions,
  type UseFloatingMenuReturn,
  type UseFormBindingOptions,
  type UseFormBindingReturn,
  type UseKeyboardNavOptions,
  type UseMenuStateOptions,
  type UseMenuStateReturn,
  type UseOptionFilterOptions,
  type UseOutsideClickOptions,
  type UseSelectionOptions,
  type UseSelectionReturn,
  type UseTaggableOptions,
  type UseTaggableReturn,
  type UseTreeSelectionOptions,
  type UseTreeSelectionReturn,
  type UseTriggerInteractionsOptions,
  type UseTriggerInteractionsReturn,
} from '@/composables'

// Core helpers — useful for custom filter functions and option pre-processing.
export {
  normalize,
  defaultFilter,
  escapeRegex,
  toggleValue,
  valuesEqual,
  readAccessor,
  isPrimitive,
  // Tree helpers
  normalizeTree,
  walkTree,
  flattenTree,
  filterTree,
  getLeafValues,
  getAncestorIds,
} from '@/core'

// Types
export type {
  NormalizedOption,
  OptionLike,
  OptionAccessor,
  SelectMode,
  SelectSize,
  SelectTheme,
  FilterFn,
  FilterContext,
  VSelectProps,
  VSelectEmits,
  VSelectInstance,
  VSelectSlots,
  OptionSlotProps,
  TagSlotProps,
  ValueSlotProps,
  OptionGroupSlotProps,
  EmptySlotProps,
  CreateSlotProps,
  ClearIconSlotProps,
  DropdownIconSlotProps,
  LoaderSlotProps,
  // Tree types
  NormalizedTreeNode,
  TreeOptionLike,
  TreeChildrenAccessor,
  TreeNodeCheckState,
  VTreeSelectProps,
  VTreeSelectEmits,
  VTreeSelectInstance,
  VTreeSelectSlots,
  TreeTagSlotProps,
  TreeValueSlotProps,
  TreeToolbarSlotProps,
  TreeEmptySlotProps,
} from '@/types'
