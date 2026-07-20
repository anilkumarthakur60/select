// Public package entry. Consumers import named exports for tree-shaking; the
// optional `VueSelectPlugin` is available for global registration.

// Styles are NOT imported here. They live in `@anil-labs/select-core` and are
// shared by every adapter, so importing them from one adapter would give Vue
// consumers stylesheets automatically while React/Svelte/Solid consumers had
// to opt in — and would defeat the `sideEffects: false` tree-shaking hint.
// Consumers import them explicitly:
//   import '@anil-labs/select-core/styles.css'      // compiled
//   @use '@anil-labs/select-core/scss' as select;   // source, to compose tokens

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
} from '@anil-labs/select-core'

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

// Mirror what the React/Svelte/Solid/Web Component entries expose: the
// framework-agnostic `createSelectMachine` so Vue consumers can also build
// fully headless variants without reaching for a second import path. The
// pure-helper exports (normalize, defaultFilter, tree utils) are already
// re-exported above via the Vue-specific groupings.
export { createSelectMachine } from '@anil-labs/select-core'
export type {
  SelectMachine,
  SelectMachineConfig,
  SelectState,
  RootProps,
  ControlProps,
  MenuProps,
  SearchProps,
  OptionProps,
} from '@anil-labs/select-core'
