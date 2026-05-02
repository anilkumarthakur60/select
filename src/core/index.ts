export { readAccessor, isPrimitive } from '@/core/accessor'
export { normalize } from '@/core/normalize'
export { valuesEqual, toggleValue } from '@/core/compare'
export { defaultFilter, escapeRegex } from '@/core/filter'
export {
  normalizeTree,
  walkTree,
  flattenTree,
  filterTree,
  getLeafValues,
  getAncestorIds,
} from '@/core/tree'

export type {
  NormalizedOption,
  OptionLike,
  OptionAccessor,
  SelectMode,
  SelectSize,
  SelectTheme,
  FilterFn,
  FilterContext,
  NormalizedTreeNode,
  TreeOptionLike,
  TreeChildrenAccessor,
  TreeNodeCheckState,
} from '@/core/types'

export { createSelectMachine } from '@/core/machine'
export type {
  SelectMachine,
  SelectMachineConfig,
  SelectState,
  RootProps,
  ControlProps,
  MenuProps,
  SearchProps,
  OptionProps,
} from '@/core/machine'
